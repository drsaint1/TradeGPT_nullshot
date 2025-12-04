import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

/**
 * Master deployment script that deploys all contracts in order and updates .env files
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('================================================');
  console.log('🚀 SOMNIA TRADE GPT - FULL DEPLOYMENT');
  console.log('================================================\n');
  console.log('Deploying with account:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'STT\n');

  if (balance < ethers.parseEther('0.1')) {
    console.warn('⚠️  WARNING: Low balance! You may need more STT for deployment.\n');
  }

  const deployedAddresses: Record<string, string> = {};

  console.log('================================================');
  console.log('STEP 1: Deploying Test Tokens');
  console.log('================================================\n');

  const tokens = [
    {
      name: 'Somnia Test USDC',
      symbol: 'USDC',
      decimals: 6,
      initialSupply: ethers.parseUnits('10000000', 6),
      envKey: 'SOMNIA_USDC_ADDRESS',
    },
    {
      name: 'Somnia Test Token',
      symbol: 'STT',
      decimals: 18,
      initialSupply: ethers.parseUnits('10000000', 18),
      envKey: 'SOMNIA_STT_ADDRESS',
    },
    {
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      decimals: 18,
      initialSupply: ethers.parseUnits('100000', 18),
      envKey: 'SOMNIA_ETH_ADDRESS',
    },
    {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      initialSupply: ethers.parseUnits('10000', 8),
      envKey: 'SOMNIA_BTC_ADDRESS',
    },
    {
      name: 'Wrapped Solana',
      symbol: 'WSOL',
      decimals: 9,
      initialSupply: ethers.parseUnits('1000000', 9),
      envKey: 'SOMNIA_SOL_ADDRESS',
    },
  ];

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
    deployedAddresses[token.envKey] = address;

    console.log(`✅ ${token.symbol} deployed to: ${address}`);
    console.log(`   Initial supply: ${ethers.formatUnits(token.initialSupply, token.decimals)} ${token.symbol}\n`);
  }

  console.log('================================================');
  console.log('STEP 2: Deploying Mock DEX Router (for testing)');
  console.log('================================================\n');

  const MockDexRouter = await ethers.getContractFactory('MockDexRouter');
  const mockRouter = await MockDexRouter.deploy();
  await mockRouter.waitForDeployment();
  const mockRouterAddress = await mockRouter.getAddress();

  deployedAddresses['SOMNIA_DEX_ROUTER_V2'] = mockRouterAddress;

  console.log(`✅ MockDexRouter deployed to: ${mockRouterAddress}\n`);
  console.log('💡 Note: This is a mock router for testing.');
  console.log('   For production, use a real Uniswap V2 compatible DEX router.\n');

  console.log('================================================');
  console.log('STEP 3: Deploying SomniaDexRouter');
  console.log('================================================\n');

  const SomniaDexRouter = await ethers.getContractFactory('SomniaDexRouter');
  const somniaDexRouter = await SomniaDexRouter.deploy(
    deployer.address, 
    mockRouterAddress, 
    deployedAddresses['SOMNIA_USDC_ADDRESS'] 
  );

  await somniaDexRouter.waitForDeployment();
  const routerAddress = await somniaDexRouter.getAddress();
  deployedAddresses['SOMNIA_ROUTER_ADDRESS'] = routerAddress;

  console.log(`✅ SomniaDexRouter deployed to: ${routerAddress}\n`);

  console.log('Configuring supported assets...');
  const assetKeys = ['SOMNIA_ETH_ADDRESS', 'SOMNIA_BTC_ADDRESS', 'SOMNIA_SOL_ADDRESS'];

  for (const key of assetKeys) {
    const address = deployedAddresses[key];
    if (address) {
      const tx = await somniaDexRouter.setSupportedAsset(address, true);
      await tx.wait();
      const symbol = key.replace('SOMNIA_', '').replace('_ADDRESS', '');
      console.log(`✅ ${symbol} added as supported asset`);
    }
  }
  console.log();

  console.log('================================================');
  console.log('STEP 4: Deploying SomniaTradeFactory');
  console.log('================================================\n');

  const backendAgent = process.env.BACKEND_AGENT_ADDRESS || deployer.address;
  console.log('Backend agent address:', backendAgent);

  const SomniaTradeFactory = await ethers.getContractFactory('SomniaTradeFactory');
  const factory = await SomniaTradeFactory.deploy(backendAgent);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  deployedAddresses['SOMNIA_FACTORY_ADDRESS'] = factoryAddress;

  console.log(`✅ SomniaTradeFactory deployed to: ${factoryAddress}\n`);

  console.log('================================================');
  console.log('STEP 5: Updating .env files');
  console.log('================================================\n');

  updateEnvFile(
    path.join(__dirname, '../../contracts/.env'),
    deployedAddresses,
    'contracts'
  );

  updateEnvFile(
    path.join(__dirname, '../../backend/.env'),
    deployedAddresses,
    'backend'
  );

  updateFrontendFactoryAddress(
    path.join(__dirname, '../../frontend/src/hooks/useSmartAccount.ts'),
    deployedAddresses['SOMNIA_FACTORY_ADDRESS']
  );

  console.log('\n================================================');
  console.log('✅ DEPLOYMENT COMPLETE!');
  console.log('================================================\n');

  console.log('📝 Deployed Contract Addresses:\n');
  console.log('Tokens:');
  console.log(`  USDC: ${deployedAddresses['SOMNIA_USDC_ADDRESS']}`);
  console.log(`  STT:  ${deployedAddresses['SOMNIA_STT_ADDRESS']}`);
  console.log(`  WETH: ${deployedAddresses['SOMNIA_ETH_ADDRESS']}`);
  console.log(`  WBTC: ${deployedAddresses['SOMNIA_BTC_ADDRESS']}`);
  console.log(`  WSOL: ${deployedAddresses['SOMNIA_SOL_ADDRESS']}`);
  console.log();
  console.log('Contracts:');
  console.log(`  MockDexRouter:     ${deployedAddresses['SOMNIA_DEX_ROUTER_V2']}`);
  console.log(`  SomniaDexRouter:   ${deployedAddresses['SOMNIA_ROUTER_ADDRESS']}`);
  console.log(`  TradeFactory:      ${deployedAddresses['SOMNIA_FACTORY_ADDRESS']}`);
  console.log();

  console.log('💡 Next Steps:');
  console.log('1. ✅ .env files have been updated automatically');
  console.log('2. Restart your backend server to load new addresses');
  console.log('3. Test creating a smart account via the frontend');
  console.log('4. (Optional) Add liquidity to DEX pools for real trading');
  console.log();

  console.log('🔗 Verify contracts on block explorer:');
  console.log(`   https://shannon-explorer.somnia.network/address/${factoryAddress}`);
  console.log();
}

/**
 * Update .env file with new addresses
 */
function updateEnvFile(
  envPath: string,
  addresses: Record<string, string>,
  label: string
) {
  try {
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    for (const [key, value] of Object.entries(addresses)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated ${label}/.env`);
  } catch (error) {
    console.error(`❌ Failed to update ${label}/.env:`, error);
  }
}

/**
 * Update frontend useSmartAccount hook with new factory address
 */
function updateFrontendFactoryAddress(filePath: string, factoryAddress: string) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Frontend hook not found at ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    const regex = /const FACTORY_ADDRESS = '[^']+';/;
    content = content.replace(regex, `const FACTORY_ADDRESS = '${factoryAddress}';`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated frontend/src/hooks/useSmartAccount.ts with factory address`);
  } catch (error) {
    console.error(`❌ Failed to update frontend hook:`, error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
