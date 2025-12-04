import { ethers } from 'hardhat';
import 'dotenv/config';

/**
 * Authorize the backend AI agent to prepare trades on your smart account
 *
 * This allows the backend to call prepareTrade() on your behalf,
 * but you still need to execute trades yourself via executeTrade()
 */
async function main() {
  const [signer] = await ethers.getSigners();

  console.log('🤖 Authorizing AI Agent on Smart Account\n');
  console.log('Your address:', signer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'STT\n');

  const factoryAddress = process.env.SOMNIA_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error('SOMNIA_FACTORY_ADDRESS not set in .env');
  }

  const agentAddress = process.env.BACKEND_AGENT_ADDRESS;
  if (!agentAddress) {
    throw new Error('BACKEND_AGENT_ADDRESS not set in .env');
  }

  console.log('Factory address:', factoryAddress);
  console.log('Agent address:', agentAddress, '\n');

  const Factory = await ethers.getContractFactory('SomniaTradeFactory');
  const factory = Factory.attach(factoryAddress);

  const accounts = await factory.getAccountsByOwner(signer.address);

  if (accounts.length === 0) {
    console.log('❌ No smart accounts found for your address');
    console.log('💡 Create one first using the frontend or run:');
    console.log('   npx hardhat run scripts/createSmartAccount.ts --network somniaTestnet\n');
    return;
  }

  console.log(`Found ${accounts.length} smart account(s):\n`);

  for (let i = 0; i < accounts.length; i++) {
    const accountAddress = accounts[i];
    console.log(`[${i + 1}/${accounts.length}] Smart Account: ${accountAddress}`);

    try {
      const Account = await ethers.getContractFactory('SomniaTradeAccount');
      const account = Account.attach(accountAddress);

      const isAuthorized = await account.agents(agentAddress);

      if (isAuthorized) {
        console.log('   ✅ Agent already authorized\n');
        continue;
      }

      console.log('   Authorizing agent...');
      const tx = await account.setAgent(agentAddress, true);
      await tx.wait();

      console.log('   ✅ Agent authorized successfully!');
      console.log(`   Transaction: ${tx.hash}\n`);
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('✅ Done!\n');
  console.log('💡 Your AI agent can now prepare trades on your smart account.');
  console.log('   You still control when trades execute via executeTrade().\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
