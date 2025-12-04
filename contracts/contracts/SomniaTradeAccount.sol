pragma solidity ^0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SomniaTradeAccount
 * @notice Smart account controlled by a single owner that lets an AI agent stage
 *         leveraged trade proposals which the owner must explicitly execute.
 *         The contract never autonomously executes trades and the owner can
 *         tweak parameters or cancel anytime prior to execution.
 */
contract SomniaTradeAccount is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TradeConfig {
        address asset;
        uint256 collateral; 
        uint256 leverageBps; 
        bool isLong;
        uint256 stopLoss;
        uint256 takeProfit;
    }

    struct TradeExecution {
        address router;
        uint256 value; 
        bytes payload;
    }

    struct TradeProposal {
        uint256 id;
        TradeConfig config;
        TradeExecution execution;
        uint64 createdAt;
        address createdBy;
    }

    uint256 private _proposalCounter;
    TradeProposal private _pendingTrade;
    bool private _hasPendingTrade;

    mapping(address => bool) public agents;

    event AgentUpdated(address indexed agent, bool isAllowed);
    event Deposited(address indexed from, uint256 amount);
    event TradePrepared(
        uint256 indexed id,
        address indexed asset,
        uint256 collateral,
        uint256 leverageBps,
        bool isLong,
        uint256 stopLoss,
        uint256 takeProfit,
        address indexed router,
        uint256 value,
        bytes32 payloadHash,
        address proposer
    );
    event TradeConfigUpdated(
        uint256 indexed id,
        address indexed asset,
        uint256 collateral,
        uint256 leverageBps,
        bool isLong,
        uint256 stopLoss,
        uint256 takeProfit
    );
    event TradeExecutionUpdated(uint256 indexed id, address indexed router, uint256 value, bytes32 payloadHash);
    event TradeCancelled(uint256 indexed id, address indexed caller);
    event TradeExecuted(uint256 indexed id, address indexed router, bytes response);
    event FundsRecovered(address indexed token, address indexed to, uint256 amount);

    error NotAgent();
    error NoPendingTrade();
    error PendingTradeExists();
    error InvalidRouter();
    error EmptyPayload();
    error ExecutionFailed(string reason);

    modifier onlyAgentOrOwner() {
        if (msg.sender != owner() && !agents[msg.sender]) {
            revert NotAgent();
        }
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Returns the current pending trade (if any).
     */
    function getPendingTrade() external view returns (TradeProposal memory proposal, bool exists) {
        return (_pendingTrade, _hasPendingTrade);
    }

    /**
     * @notice Allows the owner to whitelist or revoke backend agents.
     */
    function setAgent(address agent, bool isAllowed) external onlyOwner {
        agents[agent] = isAllowed;
        emit AgentUpdated(agent, isAllowed);
    }

    /**
     * @notice Stages a new trade proposal that the owner may later execute.
     * @dev An account can only have one pending trade at a time.
     */
    function prepareTrade(
        TradeConfig calldata config,
        TradeExecution calldata execution
    ) external onlyAgentOrOwner returns (uint256 id) {
        if (_hasPendingTrade) {
            revert PendingTradeExists();
        }
        if (execution.router == address(0)) {
            revert InvalidRouter();
        }
        if (execution.payload.length == 0) {
            revert EmptyPayload();
        }

        _proposalCounter += 1;
        TradeProposal storage stored = _pendingTrade;
        stored.id = _proposalCounter;
        stored.config = config;
        stored.execution.router = execution.router;
        stored.execution.value = execution.value;
        stored.execution.payload = execution.payload;
        stored.createdAt = uint64(block.timestamp);
        stored.createdBy = msg.sender;

        _hasPendingTrade = true;

        emit TradePrepared(
            stored.id,
            config.asset,
            config.collateral,
            config.leverageBps,
            config.isLong,
            config.stopLoss,
            config.takeProfit,
            execution.router,
            execution.value,
            keccak256(execution.payload),
            msg.sender
        );

        return stored.id;
    }

    /**
     * @notice Owner can adjust risk parameters before executing.
     */
    function ownerUpdateTradeConfig(
        TradeConfig calldata newConfig
    ) external onlyOwner {
        if (!_hasPendingTrade) {
            revert NoPendingTrade();
        }

        _pendingTrade.config = newConfig;

        emit TradeConfigUpdated(
            _pendingTrade.id,
            newConfig.asset,
            newConfig.collateral,
            newConfig.leverageBps,
            newConfig.isLong,
            newConfig.stopLoss,
            newConfig.takeProfit
        );
    }

    /**
     * @notice Owner can update execution routing details (e.g. stop-loss automation, dex path).
     */
    function ownerUpdateTradeExecution(
        TradeExecution calldata newExecution
    ) external onlyOwner {
        if (!_hasPendingTrade) {
            revert NoPendingTrade();
        }
        if (newExecution.router == address(0)) {
            revert InvalidRouter();
        }
        if (newExecution.payload.length == 0) {
            revert EmptyPayload();
        }

        _pendingTrade.execution.router = newExecution.router;
        _pendingTrade.execution.value = newExecution.value;
        _pendingTrade.execution.payload = newExecution.payload;

        emit TradeExecutionUpdated(
            _pendingTrade.id,
            newExecution.router,
            newExecution.value,
            keccak256(newExecution.payload)
        );
    }

    /**
     * @notice Clears the pending trade without executing it.
     */
    function cancelTrade() external onlyAgentOrOwner {
        if (!_hasPendingTrade) {
            revert NoPendingTrade();
        }

        uint256 id = _pendingTrade.id;
        delete _pendingTrade;
        _hasPendingTrade = false;

        emit TradeCancelled(id, msg.sender);
    }

    /**
     * @notice Executes the prepared trade by forwarding the stored payload to the router.
     * @return response Raw response bytes from the router call.
     */
    function executeTrade() external onlyOwner nonReentrant returns (bytes memory response) {
        if (!_hasPendingTrade) {
            revert NoPendingTrade();
        }
        TradeProposal storage trade = _pendingTrade;
        address router = trade.execution.router;
        if (router == address(0)) {
            revert InvalidRouter();
        }

        bytes memory payload = trade.execution.payload;
        uint256 value = trade.execution.value;

        (bool success, bytes memory data) = router.call{value: value}(payload);
        if (!success) {
            revert ExecutionFailed(_parseRevertReason(data));
        }

        emit TradeExecuted(trade.id, router, data);

        delete _pendingTrade;
        _hasPendingTrade = false;

        return data;
    }

    /**
     * @notice Lets the owner recover tokens or native currency.
     */
    function recoverFunds(address token, address payable to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) {
            revert("InvalidRecipient");
        }

        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }

        emit FundsRecovered(token, to, amount);
    }

    function hasPendingTrade() external view returns (bool) {
        return _hasPendingTrade;
    }

    /**
     * @notice Approve a spender to use tokens from this smart account
     * @dev Allows owner to approve routers/contracts to spend account tokens
     */
    function approveToken(address token, address spender, uint256 amount) external onlyOwner {
        IERC20(token).approve(spender, 0);
        IERC20(token).approve(spender, amount);
    }

    /**
     * @dev Extracts the revert reason from a failed low-level call.
     */
    function _parseRevertReason(bytes memory revertData) private pure returns (string memory) {
        if (revertData.length < 68) {
            return "call reverted";
        }
        assembly {
            revertData := add(revertData, 0x04)
        }
        return abi.decode(revertData, (string));
    }
}
