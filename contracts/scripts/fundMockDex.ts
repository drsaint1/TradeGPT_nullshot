import { ethers } from 'hardhat';
import 'dotenv/config';

/**
 * Fund the MockDexRouter with tokens so it can execute swaps
 */
async function main() {
  const [signer] = await ethers.getSigners();

  const MOCK_DEX_ROUTER = process.env.SOMNIA_DEX_ROUTER_V2!;
  const USDC_ADDRESS = process.env.SOMNIA_USDC_ADDRESS!;
  const WETH_ADDRESS = process.env.SOMNIA_ETH_ADDRESS!;
  const WBTC_ADDRESS = process.env.SOMNIA_BTC_ADDRESS!;
  const WSOL_ADDRESS = process.env.SOMNIA_SOL_ADDRESS!;

  console.log('💰 Funding MockDexRouter with Tokens\n');
  console.log('MockDexRouter:', MOCK_DEX_ROUTER);
  console.log('Funding from:', signer.address);
  console.log('---\n');

  const ERC20 = await ethers.getContractFactory('contracts/mocks/MockERC20.sol:MockERC20');

  const usdc = ERC20.attach(USDC_ADDRESS);
  const usdcAmount = ethers.parseUnits('1000000', 6); 
  await usdc.transfer(MOCK_DEX_ROUTER, usdcAmount);
  console.log('✅ Transferred 1,000,000 USDC to MockDexRouter');

  const weth = ERC20.attach(WETH_ADDRESS);
  const wethAmount = ethers.parseUnits('10000', 18); 
  await weth.transfer(MOCK_DEX_ROUTER, wethAmount);
  console.log('✅ Transferred 10,000 WETH to MockDexRouter');

  const wbtc = ERC20.attach(WBTC_ADDRESS);
  const wbtcAmount = ethers.parseUnits('1000', 8); 
  await wbtc.transfer(MOCK_DEX_ROUTER, wbtcAmount);
  console.log('✅ Transferred 1,000 WBTC to MockDexRouter');

  const wsol = ERC20.attach(WSOL_ADDRESS);
  const wsolAmount = ethers.parseUnits('100000', 9); 
  await wsol.transfer(MOCK_DEX_ROUTER, wsolAmount);
  console.log('✅ Transferred 100,000 WSOL to MockDexRouter');

  console.log('\n✅ MockDexRouter is now funded and ready for swaps!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
