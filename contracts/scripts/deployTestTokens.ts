import { ethers } from 'hardhat';
import 'dotenv/config';

/**
 * Deploy test ERC20 tokens for Somnia testnet trading
 * Only use this if tokens don't already exist on Somnia testnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying test tokens with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const tokens = [
    {
      name: 'Somnia Test USDC',
      symbol: 'USDC',
      decimals: 6,
      initialSupply: ethers.parseUnits('1000000', 6),
    },
    {
      name: 'Somnia Test Token',
      symbol: 'STT',
      decimals: 18,
      initialSupply: ethers.parseUnits('1000000', 18),
    },
    {
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
      initialSupply: ethers.parseUnits('10000', 18),
    },
    {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      initialSupply: ethers.parseUnits('1000', 8),
    },
    {
      name: 'Wrapped Solana',
      symbol: 'WSOL',
      decimals: 9,
      initialSupply: ethers.parseUnits('100000', 9),
    },
  ];

  console.log('\n📝 Deploying test tokens...\n');

  const deployedTokens: Record<string, string> = {};

  for (const token of tokens) {
    console.log(`Deploying ${token.name} (${token.symbol})...`);

    const Token = await ethers.getContractFactory('contracts/mocks/MockERC20.sol:MockERC20');
    const tokenContract = await Token.deploy(
      token.name,
      token.symbol,
      token.decimals,
      token.initialSupply
    );

    await tokenContract.waitForDeployment();
    const address = await tokenContract.getAddress();

    deployedTokens[token.symbol] = address;

    console.log(`✅ ${token.symbol} deployed to: ${address}`);
    console.log(`   Initial supply: ${ethers.formatUnits(token.initialSupply, token.decimals)} ${token.symbol}\n`);
  }

  console.log('\n✅ All tokens deployed!\n');
  console.log('📝 Update your .env files with these addresses:\n');
  console.log(`SOMNIA_USDC_ADDRESS=${deployedTokens.USDC}`);
  console.log(`SOMNIA_STT_ADDRESS=${deployedTokens.STT}`);
  console.log(`SOMNIA_ETH_ADDRESS=${deployedTokens.WETH}`);
  console.log(`SOMNIA_BTC_ADDRESS=${deployedTokens.WBTC}`);
  console.log(`SOMNIA_SOL_ADDRESS=${deployedTokens.WSOL}`);

  console.log('\n💡 Next steps:');
  console.log('1. Update .env files in contracts/ and backend/');
  console.log('2. Add liquidity to DEX pools');
  console.log('3. Deploy the SomniaDexRouter');
  console.log('4. Configure supported assets');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
