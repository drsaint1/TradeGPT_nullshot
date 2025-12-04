pragma solidity ^0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./ISomniaDexRouter.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

/**
 * @title SomniaDexRouter
 * @notice Real DEX router that executes token swaps on Somnia testnet using Uniswap V2 compatible DEX
 * @dev This router integrates with actual DEXes to execute trades with leverage simulation
 */
contract SomniaDexRouter is ISomniaDexRouter, Ownable {
    using SafeERC20 for IERC20;

    struct TradeRecord {
        address account;
        address asset;
        address stablecoin;
        bool isLong;
        uint256 collateral;
        uint256 leverageBps;
        uint256 amountSwapped;
        uint256 timestamp;
    }

    address public dexRouter;

    address public usdcAddress;

    mapping(address => bool) public supportedAssets;

    TradeRecord[] public trades;
    mapping(address => uint256[]) public accountTrades;

    uint256 public slippageBps = 100;

    event TradeExecuted(
        address indexed account,
        address indexed asset,
        bool isLong,
        uint256 collateral,
        uint256 amountSwapped,
        uint256 timestamp
    );

    event DexRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event AssetSupportUpdated(address indexed asset, bool supported);
    event SlippageUpdated(uint256 oldSlippage, uint256 newSlippage);

    error UnsupportedAsset(address asset);
    error InsufficientCollateral();
    error SwapFailed();
    error InvalidDexRouter();
    error InvalidSlippage();

    constructor(
        address initialOwner,
        address _dexRouter,
        address _usdcAddress
    ) Ownable(initialOwner) {
        if (_dexRouter == address(0)) revert InvalidDexRouter();
        dexRouter = _dexRouter;
        usdcAddress = _usdcAddress;
    }

    /**
     * @notice Executes a trade by swapping tokens through the DEX
     * @dev For LONG: Swaps USDC → Asset, For SHORT: Swaps Asset → USDC
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
    ) external payable override returns (bytes memory response) {
        if (!supportedAssets[asset]) revert UnsupportedAsset(asset);
        if (collateral == 0) revert InsufficientCollateral();

        uint256 effectiveAmount = (collateral * leverageBps) / 100;

        uint256 amountSwapped;

        if (isLong) {
            amountSwapped = _swapUSDCForAsset(account, asset, effectiveAmount);
        } else {
            amountSwapped = _swapAssetForUSDC(account, asset, effectiveAmount);
        }

        TradeRecord memory trade = TradeRecord({
            account: account,
            asset: asset,
            stablecoin: usdcAddress,
            isLong: isLong,
            collateral: collateral,
            leverageBps: leverageBps,
            amountSwapped: amountSwapped,
            timestamp: block.timestamp
        });

        trades.push(trade);
        accountTrades[account].push(trades.length - 1);

        emit TradeExecuted(
            account,
            asset,
            isLong,
            collateral,
            amountSwapped,
            block.timestamp
        );

        return abi.encode(true, amountSwapped, block.timestamp);
    }

    /**
     * @notice Swap USDC for target asset
     */
    function _swapUSDCForAsset(
        address account,
        address asset,
        uint256 usdcAmount
    ) internal returns (uint256) {
        IERC20(usdcAddress).safeTransferFrom(account, address(this), usdcAmount);

        IERC20(usdcAddress).approve(dexRouter, 0);
        IERC20(usdcAddress).approve(dexRouter, usdcAmount);

        address[] memory path = new address[](2);
        path[0] = usdcAddress;
        path[1] = asset;

        uint256[] memory amountsOut = IUniswapV2Router(dexRouter).getAmountsOut(
            usdcAmount,
            path
        );
        uint256 minAmountOut = (amountsOut[1] * (10000 - slippageBps)) / 10000;

        uint256[] memory amounts = IUniswapV2Router(dexRouter).swapExactTokensForTokens(
            usdcAmount,
            minAmountOut,
            path,
            account, 
            block.timestamp + 300 
        );

        return amounts[1];
    }

    /**
     * @notice Swap asset for USDC
     */
    function _swapAssetForUSDC(
        address account,
        address asset,
        uint256 assetAmount
    ) internal returns (uint256) {
        IERC20(asset).safeTransferFrom(account, address(this), assetAmount);

        IERC20(asset).approve(dexRouter, 0);
        IERC20(asset).approve(dexRouter, assetAmount);

        address[] memory path = new address[](2);
        path[0] = asset;
        path[1] = usdcAddress;

        uint256[] memory amountsOut = IUniswapV2Router(dexRouter).getAmountsOut(
            assetAmount,
            path
        );
        uint256 minAmountOut = (amountsOut[1] * (10000 - slippageBps)) / 10000;

        uint256[] memory amounts = IUniswapV2Router(dexRouter).swapExactTokensForTokens(
            assetAmount,
            minAmountOut,
            path,
            account, 
            block.timestamp + 300 
        );

        return amounts[1];
    }

    function setDexRouter(address _newRouter) external onlyOwner {
        if (_newRouter == address(0)) revert InvalidDexRouter();
        address oldRouter = dexRouter;
        dexRouter = _newRouter;
        emit DexRouterUpdated(oldRouter, _newRouter);
    }

    /**
     * @notice Add or remove supported asset
     */
    function setSupportedAsset(address asset, bool supported) external onlyOwner {
        supportedAssets[asset] = supported;
        emit AssetSupportUpdated(asset, supported);
    }

    /**
     * @notice Update slippage tolerance
     */
    function setSlippageBps(uint256 _slippageBps) external onlyOwner {
        if (_slippageBps > 1000) revert InvalidSlippage(); 
        uint256 oldSlippage = slippageBps;
        slippageBps = _slippageBps;
        emit SlippageUpdated(oldSlippage, _slippageBps);
    }

    /**
     * @notice Update USDC address
     */
    function setUSDCAddress(address _usdcAddress) external onlyOwner {
        usdcAddress = _usdcAddress;
    }

    function getAccountTradeCount(address account) external view returns (uint256) {
        return accountTrades[account].length;
    }

    /**
     * @notice Get trade by index
     */
    function getTrade(uint256 index) external view returns (TradeRecord memory) {
        require(index < trades.length, "Invalid index");
        return trades[index];
    }

    /**
     * @notice Get estimated swap amount
     */
    function getEstimatedSwapAmount(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router(dexRouter).getAmountsOut(
            amountIn,
            path
        );

        return amounts[1];
    }

    /**
     * @notice Emergency fund recovery
     */
    function recoverFunds(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
