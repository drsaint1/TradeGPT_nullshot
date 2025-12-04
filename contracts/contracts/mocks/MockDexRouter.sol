pragma solidity ^0.8.21;

import "../ISomniaDexRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Simple mock router that simulates Uniswap V2 compatible swaps
 * @notice Uses a fixed 1:1 exchange rate for testing purposes
 */
contract MockDexRouter is ISomniaDexRouter {
    struct RecordedTrade {
        address account;
        address asset;
        bool isLong;
        uint256 collateral;
        uint256 leverageBps;
        uint256 stopLoss;
        uint256 takeProfit;
        bytes metadata;
        uint256 value;
    }

    RecordedTrade public lastTrade;
    bool public forceRevert;

    uint256 public constant MOCK_RATE = 1e18;

    event TradeRecorded(address indexed account, address indexed asset, uint256 collateral);
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    function setForceRevert(bool shouldRevert) external {
        forceRevert = shouldRevert;
    }

    function executeTrade(
        address account,
        address asset,
        bool isLong,
        uint256 collateral,
        uint256 leverageBps,
        uint256 stopLoss,
        uint256 takeProfit,
        bytes calldata metadata
    ) external payable override returns (bytes memory response) {
        if (forceRevert) {
            revert("MockRouter: forced revert");
        }

        lastTrade = RecordedTrade({
            account: account,
            asset: asset,
            isLong: isLong,
            collateral: collateral,
            leverageBps: leverageBps,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            metadata: metadata,
            value: msg.value
        });

        emit TradeRecorded(account, asset, collateral);

        return abi.encode(true);
    }

    /**
     * @notice Mock implementation of Uniswap V2 getAmountsOut
     * @dev Returns a 1:1 exchange rate for testing
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amountIn;
        }

        return amounts;
    }

    /**
     * @notice Mock implementation of Uniswap V2 swapExactTokensForTokens
     * @dev Simulates a swap with 1:1 rate, just transfers tokens
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "MockRouter: EXPIRED");
        require(path.length >= 2, "MockRouter: INVALID_PATH");

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = amountIn;
        require(amountOut >= amountOutMin, "MockRouter: INSUFFICIENT_OUTPUT_AMOUNT");

        IERC20(path[path.length - 1]).transfer(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;

        emit SwapExecuted(path[0], path[path.length - 1], amountIn, amountOut);

        return amounts;
    }

    /**
     * @notice Mock implementation of Uniswap V2 swapTokensForExactTokens
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "MockRouter: EXPIRED");
        require(path.length >= 2, "MockRouter: INVALID_PATH");

        uint256 amountIn = amountOut;
        require(amountIn <= amountInMax, "MockRouter: EXCESSIVE_INPUT_AMOUNT");

        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        IERC20(path[path.length - 1]).transfer(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOut;

        emit SwapExecuted(path[0], path[path.length - 1], amountIn, amountOut);

        return amounts;
    }
}
