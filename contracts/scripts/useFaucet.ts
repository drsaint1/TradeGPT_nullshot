import { ethers } from 'hardhat';
import 'dotenv/config';

/**
 * Script to use the faucet function on test tokens
 * Anyone can call this to get free test tokens
 */
async function main() {
  const [user] = await ethers.getSigners();

  console.log('🚰 Token Faucet');
  console.log('================\n');
  console.log('User address:', user.address);
  console.log('User balance:', ethers.formatEther(await ethers.provider.getBalance(user.address)), 'STT\n');

  const tokens = {
    USDC: {
      address: process.env.SOMNIA_USDC_ADDRESS || '',
      decimals: 6,
      symbol: 'USDC',
    },
    STT: {
      address: process.env.SOMNIA_STT_ADDRESS || '',
      decimals: 18,
      symbol: 'STT',
    },
    WETH: {
      address: process.env.SOMNIA_ETH_ADDRESS || '',
      decimals: 18,
      symbol: 'WETH',
    },
    WBTC: {
      address: process.env.SOMNIA_BTC_ADDRESS || '',
      decimals: 8,
      symbol: 'WBTC',
    },
    WSOL: {
      address: process.env.SOMNIA_SOL_ADDRESS || '',
      decimals: 9,
      symbol: 'WSOL',
    },
  };

  console.log('💧 Faucet gives you 1000 of each token!\n');

  for (const [name, config] of Object.entries(tokens)) {
    if (!config.address || config.address === '0x0000000000000000000000000000000000000000') {
      console.log(`⚠️  Skipping ${name} (address not configured)`);
      continue;
    }

    try {
      const token = await ethers.getContractAt('MockERC20', config.address);

      const balanceBefore = await token.balanceOf(user.address);

      console.log(`Getting ${name} from faucet...`);
      const tx = await token.faucet();
      await tx.wait();

      const balanceAfter = await token.balanceOf(user.address);
      const received = balanceAfter - balanceBefore;

      console.log(`✅ Received: ${ethers.formatUnits(received, config.decimals)} ${config.symbol}`);
      console.log(`   Total balance: ${ethers.formatUnits(balanceAfter, config.decimals)} ${config.symbol}\n`);

    } catch (error: any) {
      console.error(`❌ Failed to get ${name}:`, error.message);
    }
  }

  console.log('✅ Faucet complete!');
  console.log();
  console.log('📊 Your Token Balances:');

  for (const [name, config] of Object.entries(tokens)) {
    if (!config.address || config.address === '0x0000000000000000000000000000000000000000') {
      continue;
    }

    try {
      const token = await ethers.getContractAt('MockERC20', config.address);
      const balance = await token.balanceOf(user.address);
      console.log(`  ${config.symbol}: ${ethers.formatUnits(balance, config.decimals)}`);
    } catch (error) {
    }
  }

  console.log();
  console.log('💡 Next steps:');
  console.log('1. Create a smart trading account on TradeGPT');
  console.log('2. Deposit USDC and STT to your trading account');
  console.log('3. Start trading with AI assistance!');
  console.log();
  console.log('🔗 TradeGPT: http://localhost:5173');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
