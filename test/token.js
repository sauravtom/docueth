var token = artifacts.require("./token.sol");

contract('token', function(accounts) {
	it("should send string correctly", function() {
    var meta;

    //    Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    return token.deployed().then(function(instance) {
        meta=instance;
        return meta.coinBalanceOf.call(account_one);
    }).then(function(balance) {
        account_one_starting_balance = balance;
        return meta.sendCoin(account_two, {from: account_one});
    }).then(function() {
    	return meta.coinBalanceOf.call(account_two);
    }).then(function(balance) {
    	account_two_ending_balance = balance;

      assert.equal(account_two_ending_balance,"hello","not successful");
		});
   });
  });

