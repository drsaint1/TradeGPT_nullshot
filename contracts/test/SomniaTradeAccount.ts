import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import {
  SomniaTradeAccount,
  MockDexRouter,
} from "../typechain-types";

describe("SomniaTradeAccount", function () {
  async function deployFixture() {
    const [deployer, owner, agent, stranger] = await ethers.getSigners();

    const accountFactory = await ethers.getContractFactory("SomniaTradeAccount");
    const account = (await accountFactory.deploy(owner.address)) as SomniaTradeAccount;
    await account.waitForDeployment();
    const accountAddress = await account.getAddress();

    const routerFactory = await ethers.getContractFactory("MockDexRouter");
    const router = (await routerFactory.deploy()) as MockDexRouter;
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();

    const config = {
      asset: ethers.ZeroAddress,
      collateral: ethers.parseUnits("10", 18),
      leverageBps: 1000,
      isLong: true,
      stopLoss: ethers.parseUnits("1500", 8),
      takeProfit: ethers.parseUnits("2000", 8),
    };

    const metadata = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["open long"]);
    const payload = router.interface.encodeFunctionData("executeTrade", [
      accountAddress,
      config.asset,
      config.isLong,
      config.collateral,
      config.leverageBps,
      config.stopLoss,
      config.takeProfit,
      metadata,
    ]);

    const execution = {
      router: routerAddress,
      value: ethers.parseEther("0.1"),
      payload,
    };

    return {
      deployer,
      owner,
      agent,
      stranger,
      account,
      accountAddress,
      router,
      routerAddress,
      config,
      execution,
      metadata,
    };
  }

  describe("agents", function () {
    it("allows owner to whitelist an agent", async function () {
      const { owner, agent, account } = await loadFixture(deployFixture);
      await expect(account.connect(owner).setAgent(agent.address, true))
        .to.emit(account, "AgentUpdated")
        .withArgs(agent.address, true);
      expect(await account.agents(agent.address)).to.equal(true);
    });

    it("prevents non-owner from whitelisting", async function () {
      const { agent, account } = await loadFixture(deployFixture);
      await expect(account.connect(agent).setAgent(agent.address, true))
        .to.be.revertedWithCustomError(account, "OwnableUnauthorizedAccount")
        .withArgs(agent.address);
    });

    it("blocks unapproved agent from staging trades", async function () {
      const { agent, account, config, execution } = await loadFixture(deployFixture);
      await expect(account.connect(agent).prepareTrade(config, execution))
        .to.be.revertedWithCustomError(account, "NotAgent");
    });
  });

  describe("trade lifecycle", function () {
    it("agent prepares, owner updates and executes trade", async function () {
      const { owner, agent, account, accountAddress, router, config, execution } =
        await loadFixture(deployFixture);
      await account.connect(owner).setAgent(agent.address, true);

      await expect(account.connect(agent).prepareTrade(config, execution))
        .to.emit(account, "TradePrepared")
        .withArgs(
          1n,
          config.asset,
          config.collateral,
          config.leverageBps,
          config.isLong,
          config.stopLoss,
          config.takeProfit,
          execution.router,
          execution.value,
          ethers.keccak256(execution.payload),
          agent.address,
        );

      const updatedConfig = {
        ...config,
        takeProfit: config.takeProfit + 100n,
      };

      await expect(account.connect(owner).ownerUpdateTradeConfig(updatedConfig))
        .to.emit(account, "TradeConfigUpdated")
        .withArgs(
          1n,
          updatedConfig.asset,
          updatedConfig.collateral,
          updatedConfig.leverageBps,
          updatedConfig.isLong,
          updatedConfig.stopLoss,
          updatedConfig.takeProfit,
        );

      const adjustedMetadata = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["adjusted"]);
      const newPayload = router.interface.encodeFunctionData("executeTrade", [
        accountAddress,
        updatedConfig.asset,
        updatedConfig.isLong,
        updatedConfig.collateral,
        updatedConfig.leverageBps,
        updatedConfig.stopLoss,
        updatedConfig.takeProfit,
        adjustedMetadata,
      ]);

      const newExecution = {
        router: execution.router,
        value: execution.value,
        payload: newPayload,
      };

      await expect(account.connect(owner).ownerUpdateTradeExecution(newExecution))
        .to.emit(account, "TradeExecutionUpdated")
        .withArgs(1n, execution.router, execution.value, ethers.keccak256(newPayload));

      await owner.sendTransaction({
        to: accountAddress,
        value: execution.value,
      });

      const encodedBool = ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [true]);
      const expectedResponse = router.interface.encodeFunctionResult("executeTrade", [encodedBool]);

      await expect(account.connect(owner).executeTrade())
        .to.emit(account, "TradeExecuted")
        .withArgs(1n, execution.router, expectedResponse);

      const lastTrade = await router.lastTrade();
      expect(lastTrade.account).to.equal(accountAddress);
      expect(lastTrade.metadata).to.equal(adjustedMetadata);
      expect(lastTrade.value).to.equal(execution.value);
      expect(await account.hasPendingTrade()).to.equal(false);
    });

    it("owner can cancel pending trade", async function () {
      const { owner, agent, account, config, execution } = await loadFixture(deployFixture);
      await account.connect(owner).setAgent(agent.address, true);
      await account.connect(agent).prepareTrade(config, execution);

      await expect(account.connect(owner).cancelTrade())
        .to.emit(account, "TradeCancelled")
        .withArgs(1n, owner.address);
      expect(await account.hasPendingTrade()).to.equal(false);
    });

    it("reverts execution if router fails", async function () {
      const { owner, agent, account, accountAddress, router, config, execution } =
        await loadFixture(deployFixture);
      await account.connect(owner).setAgent(agent.address, true);
      await account.connect(agent).prepareTrade(config, execution);

      await router.setForceRevert(true);

      await owner.sendTransaction({
        to: accountAddress,
        value: execution.value,
      });

      await expect(account.connect(owner).executeTrade()).to.be.revertedWithCustomError(
        account,
        "ExecutionFailed",
      );
    });
  });

  describe("fund recovery", function () {
    it("owner can recover native funds", async function () {
      const { owner, account, accountAddress } = await loadFixture(deployFixture);
      const ownerAddress = await owner.getAddress();

      const value = ethers.parseEther("1");
      await owner.sendTransaction({ to: accountAddress, value });

      await expect(account.connect(owner).recoverFunds(ethers.ZeroAddress, ownerAddress, value))
        .to.emit(account, "FundsRecovered")
        .withArgs(ethers.ZeroAddress, ownerAddress, value);
    });
  });
});
