pragma solidity ^0.8.21;

/**
 * @title ISomniaDexRouter
 * @notice Minimal interface expected by the SomniaTradeAccount during execution.
 *         Concrete router implementations can execute swaps, open leveraged positions,
 *         or interact with perps protocols on behalf of the smart account.
 */
interface ISomniaDexRouter {
    /**
     * @param account Smart account initiating the trade.
     * @param asset Asset involved in the trade (collateral or target).
     * @param isLong Direction toggle (true = long, false = short).
     * @param collateral Amount locked as collateral.
     * @param leverageBps Leverage scaled by 1e2 (100 = 1x, 1000 = 10x).
     * @param stopLoss Optional stop-loss price (0 if unset).
     * @param takeProfit Optional take-profit price (0 if unset).
     * @param metadata Arbitrary payload for protocol-specific instructions.
     * @return response ABI-encoded data representing router results.
     */
    function executeTrade(
        address account,
        address asset,
        bool isLong,
        uint256 collateral,
        uint256 leverageBps,
        uint256 stopLoss,
        uint256 takeProfit,
        bytes calldata metadata
    ) external payable returns (bytes memory response);
}
