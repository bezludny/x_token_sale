var DappToken = artifacts.require('./DappToken.sol')

contract('DappToken', function(accounts) {
  var tokenInstance;

  it('inits contract with values', function(){
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name){
      assert.equal(name, 'DApp Token', 'has the correct name')
      return tokenInstance.symbol();
    }).then(function(symbol){
      assert.equal(symbol, 'DAPP', 'has the correct symbol')
      return tokenInstance.standard();
    }).then(function(standard){
      assert.equal(standard, 'DApp Token v1.0', 'has the correct standard')
    });
  });

  it('sets the total supply', function(){
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply){
      assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1000000');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(adminBalance) {
      assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin account')
    });
  });

  // --------------------

  it('tranfers the token ownership', function(){
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;

      return tokenInstance.transfer.call(accounts[1], 9999999999);
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
      return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
    }).then(function(result) {
      assert.equal(result, true, 'it returns true');
      return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'event is Transfer');
      assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the sender');
      assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the recipient');
      assert.equal(receipt.logs[0].args._value, 250000, 'logs the tranfer amount');

      return tokenInstance.balanceOf(accounts[1]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 250000, 'adds the ammount to the receiving account');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 750000, 'deducts the ammount from the sender');
      return tokenInstance.balanceOf(accounts[0]);
    });
  });

  // --------------------
  it('approves tokens for delegated transfer', function() {
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.approve.call(accounts[1], 100)
    }).then(function(success) {
      assert.equal(success, true, 'returns true')
      return tokenInstance.approve(accounts[1], 100, { from: accounts[0] })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Approval', 'event is Approval');
      assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the owner');
      assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the spender');
      assert.equal(receipt.logs[0].args._value, 100, 'logs the tranfer amount');

      return tokenInstance.allowance(accounts[0], accounts[1]);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
    });
  });


  // --------------------
  it('handles delegated token transfers', function() {
    return DappToken.deployed().then(function(instance) {
      tokenInstance = instance;

      fromAccount = accounts[2];
      toAccount = accounts[3];
      spendingAccount = accounts[4];

      // transfer some tokens to fromAccount
      return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] })
    }).then(function(receipt) {
      // Approve spendingAccount to spend 10 tokens from fromAccount
      return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
    }).then(function(receipt) {
      // Try transferring something larger than the sender's balance
      return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value lager than balance')

      // Try transferring something larger than the approved amount
      return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value lager than approved ammount');
      return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount })
    }).then(function(success) {
      assert.equal(success, true);
      return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'event is Transfer');
      assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the sender');
      assert.equal(receipt.logs[0].args._to, toAccount, 'logs the recipient');
      assert.equal(receipt.logs[0].args._value, 10, 'logs the tranfer amount');

      return tokenInstance.balanceOf(fromAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 90, 'deducts the ammount from the sending account');
      return tokenInstance.balanceOf(toAccount)
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10, 'adds the ammount to the receiving account');
      return tokenInstance.allowance(fromAccount, spendingAccount);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 0, 'deducts the ammount from the allowance')
    });
  })
});
