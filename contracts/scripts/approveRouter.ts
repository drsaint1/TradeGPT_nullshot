import { ethers } from 'hardhat';
import 'dotenv/config';

/**
 * Approve router to spend tokens from your smart account
 * REQUIRED before executing trades!
 */
async function main() {
  const [signer] = await ethers.getSigners();

  console.log('🔐 Approving Router to Spend Tokens from Smart Account\n');
  console.log('Your address:', signer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'STT\n');

  const factoryAddress = process.env.SOMNIA_FACTORY_ADDRESS;
  const routerAddress = process.env.SOMNIA_ROUTER_ADDRESS;

  if (!factoryAddress) {
    throw new Error('SOMNIA_FACTORY_ADDRESS not set in .env');
  }
  if (!routerAddress) {
    throw new Error('SOMNIA_ROUTER_ADDRESS not set in .env');
  }

  console.log('Factory:', factoryAddress);
  console.log('Router:', routerAddress);
  console.log('---\n');

  const Factory = await ethers.getContractFactory('SomniaTradeFactory');
  const factory = Factory.attach(factoryAddress);

  const accounts = await factory.getAccountsByOwner(signer.address);

  if (accounts.length === 0) {
    console.log('❌ No smart accounts found for your address');
    console.log('💡 Create one first using the frontend\n');
    return;
  }

  const smartAccountAddress = accounts[0];
  console.log('Smart Account:', smartAccountAddress);
  console.log('---\n');

  const tokens = [
    {
      symbol: 'USDC',
      address: process.env.SOMNIA_USDC_ADDRESS || '0x96701B986319Fd6442fd8E61FbeF407d7AA06eb9',
      decimals: 6,
    },
    {
      symbol: 'WETH',
      address: process.env.SOMNIA_ETH_ADDRESS || '0xDEa92e19B792D0e8B9de9E181C07cC2daE368d0F',
      decimals: 18,
    },
    {
      symbol: 'WBTC',
      address: process.env.SOMNIA_BTC_ADDRESS || '0xDAb76771518097e1EAeF63da885e990EbC85F025',
      decimals: 8,
    },
    {
      symbol: 'WSOL',
      address: process.env.SOMNIA_SOL_ADDRESS || '0x86e53baea13e052694D96A27Ba82e5958c525746',
      decimals: 9,
    },
  ];

  const Account = await ethers.getContractFactory('SomniaTradeAccount');
  const account = Account.attach(smartAccountAddress);

  console.log('Approving router to spend tokens...\n');

  for (const token of tokens) {
    try {
      console.log(`${token.symbol}:`);

      const maxAmount = ethers.MaxUint256;

      const tx = await account.approveToken(token.address, routerAddress, maxAmount);
      console.log(`  Approving...`);
      await tx.wait();

      console.log(`  ✅ Approved (unlimited)`);
      console.log(`  Tx: ${tx.hash}\n`);
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('✅ Done!\n');
  console.log('💡 Your smart account can now execute trades!');
  console.log('   LONG trades will use USDC as collateral');
  console.log('   SHORT trades will use the asset as collateral\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
