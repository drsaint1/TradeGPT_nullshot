pragma solidity ^0.8.21;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SomniaTradeAccount} from "./SomniaTradeAccount.sol";

/**
 * @title SomniaTradeFactory
 * @notice Deploys SomniaTradeAccount instances for end users and optionally
 *         assigns a backend agent allowed to prepare trade proposals.
 */
contract SomniaTradeFactory is Ownable {
    address public backendAgent;
    address[] public allAccounts;
    mapping(address => address[]) private _accountsByOwner;

    event BackendAgentUpdated(address indexed newAgent);
    event AccountCreated(address indexed owner, address indexed account, address agent);

    constructor(address _backendAgent) Ownable(msg.sender) {
        backendAgent = _backendAgent;
    }

    /**
     * @notice Updates the default backend agent used for new accounts.
     */
    function setBackendAgent(address newAgent) external onlyOwner {
        backendAgent = newAgent;
        emit BackendAgentUpdated(newAgent);
    }

    /**
     * @notice Creates a new smart trading account for a user.
     * @param accountOwner Address that will ultimately control the account.
     * @param customAgent Optional agent override for this user; zero address uses default.
     */
    function createAccount(address accountOwner, address customAgent) external returns (address account) {
        require(accountOwner != address(0), "InvalidOwner");

        SomniaTradeAccount newAccount = new SomniaTradeAccount(address(this));
        account = address(newAccount);

        address agentToSet = customAgent != address(0) ? customAgent : backendAgent;
        if (agentToSet != address(0)) {
            newAccount.setAgent(agentToSet, true);
        }

        newAccount.transferOwnership(accountOwner);

        allAccounts.push(account);
        _accountsByOwner[accountOwner].push(account);

        emit AccountCreated(accountOwner, account, agentToSet);
    }

    function getAccountsByOwner(address accountOwner) external view returns (address[] memory) {
        return _accountsByOwner[accountOwner];
    }

    function allAccountsLength() external view returns (uint256) {
        return allAccounts.length;
    }
}
