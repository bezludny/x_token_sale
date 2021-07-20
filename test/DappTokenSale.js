var DappTokenSale = artifacts.require('./DappTokenSale.sol')
var DappToken = artifacts.require('./DappToken.sol')

contract('DappToken', function(accounts) {
  var tokenInstance;
  var tokenSaleInstance;
  var admin = accounts[0];
  var buyer = accounts[1];
  var tokenPrice = 1000000000000000; // in wei
  var tokensAvailable = 75000;
  var numberOfTokens;

  it('init contract with correct values', function() {
    return DappTokenSale.deployed().then(function(instance) {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has contract address');
      return tokenSaleInstance.tokenContract();
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has a token contract address');
      return tokenSaleInstance.tokenPrice();
    }).then(function(price) {
      assert.equal(price, tokenPrice, 'token price is correct')
    });
  });

  it('facilitates token buying', function() {
    return DappToken.deployed().then(function(instance) {
      // grab token instance first
      tokenInstance = instance;

      return DappTokenSale.deployed();
    }).then(function(instance) {
      // grab token sale instance
      tokenSaleInstance = instance;
      // Provision 75% of all tokens to the token sale
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin })
    }).then(function(receipt) {
      numberOfTokens = 10;

      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'event is Sell');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the buyer');
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the purchased amount');
      return tokenSaleInstance.tokensSold();
    }).then(function(amount) {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments amount of tokens sold');
      return tokenInstance.balanceOf(buyer);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), numberOfTokens)

      return tokenInstance.balanceOf(tokenSaleInstance.address)
    }).then(function(balance) {
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens)

      // try to buy tokens different from ether value
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei')
    //   return tokenSaleInstance.buyTokens(80000, { from: buyer, value: 80000 * tokenPrice });
    // }).then(assert.fail).catch(function(error) {
    //   console.log(error);
    //   console.log(error.message);
    //   assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available')
    });
  });

  it('ends Token sale', function() {
    return DappToken.deployed().then(function(instance) {
      // grab token instance first
      tokenInstance = instance;

      return DappTokenSale.deployed();
    }).then(function(instance) {
      // grab token sale instance
      tokenSaleInstance = instance;

      // try to end sale by non-admin
      return tokenSaleInstance.endSale({ from: buyer })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'must be admin for end sale');

      // end sale as admin

      console.log('before destroy', tokenSaleInstance);

      return tokenSaleInstance.endSale({ from: admin });
    }).then(function(receipt) {
      return tokenInstance.balanceOf(admin)
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 999990, 'returns all unsold tokens to admin');

      // check that token price was reset when selfdestruct was called
      console.log('after destroy', tokenSaleInstance);
      // return tokenSaleInstance.tokenPrice();
    // }).then(function(price) {
    //   assert.equal(price.toNumber(), 0, 'token price was reset')


    });
  })
});
