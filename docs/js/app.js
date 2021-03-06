App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log('App initialized...');
    return App.initWeb3();
  },

  initWeb3: function() {
    if(typeof web3 !== 'undefined') {
      // if a web3 instance is already provided by MetaMask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider)
    }

    // App.listenForEvents();
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("DappTokenSale.json", function(dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);

      App.contracts.DappTokenSale.deployed().then(function(dappTokenSale) {
        console.log("Dapp Token Sale address: ", dappTokenSale.address);

        App.listenForEvents(dappTokenSale);

      });
    }).done(function() {
      $.getJSON("DappToken.json", function(dappToken) {
        App.contracts.DappToken = TruffleContract(dappToken);
        App.contracts.DappToken.setProvider(App.web3Provider);

        App.contracts.DappToken.deployed().then(function(dappToken) {
          console.log("Dapp Token address: ", dappToken.address)
        });

        return App.render();
      });
    });
  },

  listenForEvents: function(dappTokenSale) {
    // App.contracts.DappTokenSale.deployed().then(function(instance) {
      dappTokenSale.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log('event triggered', event);
        App.render();
      })
    // });
  },

  render: function() {
    var $loader = $('#loader');
    var $content = $('#content');

    if(App.loading)
      return;

    App.loading = true;
    $loader.show();
    $content.hide();

    // Load Account data
    web3.eth.getCoinbase(function(error, account) {
      if(error === null) {
        App.account = account;

        $('#accountAddress').html('Your Account: ' + account)
      }
    // }).done(function() {
    });


    // Load Token sale contract
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      dappTokenSaleInstance = instance;
      return dappTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;

      $('.token-price').html(web3.fromWei(App.tokenPrice, 'ether').toNumber());

      return dappTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      // App.tokensSold = 600000;

      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.DappToken.deployed().then(function(instance) {
        dappTokenInstance = instance;
        console.log(dappTokenInstance);

        return dappTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());

        App.loading = false;
        $loader.hide();
        $content.show();
      });
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();

    var numberOfTokens = $('#numberOfTokens').val();

    App.contracts.DappTokenSale.deployed().then(function(instance){
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000
      }).then(function(result) {
        console.log('Tokens bought...');
        $('#form').trigger('reset');
        // wait for Sell event
      });
    })
  }
}


$(function() {
  $(window).load(function() {
    App.init();
  })
})
