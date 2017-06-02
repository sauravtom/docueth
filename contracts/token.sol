pragma solidity ^0.4.11;

contract token {

        mapping (address => string) public coinBalanceOf;

        event CoinTransfer(address sender, address receiver);

        function token(string supply) {
                coinBalanceOf[msg.sender] = supply;
        }

        function sendCoin(address receiver) returns(bool sufficient) {
                coinBalanceOf[receiver] = coinBalanceOf[msg.sender];
                CoinTransfer(msg.sender, receiver);
                return true;
        }

}
