import { ethers } from "hardhat";

async function main() {
  const [caller] = await ethers.getSigners();
  console.log(`Caller: ${await caller.getAddress()}`);

  const factoryAddress = process.env.SOMNIA_FACTORY_ADDRESS;
  const userAddress = process.env.NEW_ACCOUNT_OWNER;
  const agentOverride = process.env.AGENT_OVERRIDE ?? ethers.ZeroAddress;

  if (!factoryAddress) {
    throw new Error("SOMNIA_FACTORY_ADDRESS env variable is required");
  }
  if (!userAddress) {
    throw new Error("NEW_ACCOUNT_OWNER env variable is required");
  }

  const factory = await ethers.getContractAt("SomniaTradeFactory", factoryAddress, caller);
  const tx = await factory.createAccount(userAddress, agentOverride === "" ? ethers.ZeroAddress : agentOverride);
  console.log("createAccount transaction hash:", tx.hash);
  const receipt = await tx.wait();

  const event = receipt?.logs
    ?.map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return undefined;
      }
    })
    .find((parsed) => parsed?.name === "AccountCreated");

  if (event) {
    console.log("New account:", event.args?.account);
    console.log("Owner:", event.args?.owner);
    console.log("Agent:", event.args?.agent);
  } else {
    console.log("Account created; inspect transaction receipt for details.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
