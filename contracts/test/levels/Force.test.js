const ForceFactory = artifacts.require('./levels/ForceFactory.sol');
const ForceAttack = artifacts.require('./attacks/ForceAttack.sol');
const Force = artifacts.require('./levels/Force.sol');

const Lux = artifacts.require('./Lux.sol');
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require('openzeppelin-test-helpers');
const utils = require('../utils/TestUtils');
const { ethers, upgrades } = require('hardhat');

contract('Force', function (accounts) {
  let lux;
  let level;
  let owner = accounts[1];
  let player = accounts[0];
  let statproxy;

  before(async function () {
    lux = await utils.getLuxWithStatsProxy();
    level = await ForceFactory.new();
    await lux.registerLevel(level.address);
  });

  it('should allow the player to solve the level', async function () {
    const instance = await utils.createLevelInstance(
      lux,
      level.address,
      player,
      Force
    );

    // Check init balances
    let balance = await utils.getBalance(web3, instance.address);
    //console.log(`init instance balance: ${balance}`)
    assert.equal(balance, 0);

    // Sending funds should not work
    await expectRevert.unspecified(
      web3.eth.sendTransaction({
        from: player,
        to: instance.address,
        value: web3.utils.toWei('0.01', 'ether'),
      })
    );

    balance = await utils.getBalance(web3, instance.address);
    //console.log(`instance balance: ${balance}`)
    assert.equal(balance, 0);

    // Attack
    const attacker = await ForceAttack.new({
      from: player,
      value: web3.utils.toWei('0.01', 'ether'),
    });
    await attacker.attack(instance.address);

    // Check init balances
    balance = await utils.getBalance(web3, instance.address);
    //console.log(`post instance balance: ${balance}`)
    assert.notEqual(balance, 0);

    // Check win.
    const ethCompleted = await utils.submitLevelInstance(
      lux,
      level.address,
      instance.address,
      player
    );
    assert.equal(ethCompleted, true);
  });
});
