pragma solidity ^0.4.11;

contract message {

        mapping (address => string) public coinBalanceOf;

        event CoinTransfer(address sender, address receiver);

        function message() {
              
        }

        function sendCoin(address receiver, string message) returns(bool sufficient) {
		coinBalanceOf[msg.sender] = message;
                coinBalanceOf[receiver] = coinBalanceOf[msg.sender];
                CoinTransfer(msg.sender, receiver);
                return true;
        }
        function getBalance(address addr) returns(string) {
                return coinBalanceOf[addr];
        }
}
