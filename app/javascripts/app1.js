// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

/*
 * When you compile and deploy your Voting contract,
 * truffle stores the abi and deployed address in a json
 * file in the build directory. We will use this information
 * to setup a Voting abstraction. We will use this abstraction
 * later to create an instance of the Voting contract.
 * Compare this against the index.js from our previous tutorial to see the difference
 * https://gist.github.com/maheshmurthy/f6e96d6b3fff4cd4fa7f892de8a1a1b4#file-index-js
 */

import message_artifacts from '../../build/contracts/message.json'

var Message = contract(message_artifacts);
//var express = require("express");

window.add = function addRow() {

			var table = $('#dataTable')[0];

			var rowCount = table.rows.length;
			var row = table.insertRow(1);

			var cell1 = row.insertCell(0);
			var element1 = document.createElement("span");
                        element1.id = "transactions";
			cell1.appendChild(element1);

			var cell2 = row.insertCell(1);
			var element2 = document.createElement("span");
			element2.id = "account";
			cell2.appendChild(element2);
	}
window.start = function(){
		var filter = web3.eth.filter('latest',{address: web3.eth.accounts[1]});
		var hash;
		filter.watch(function callback(error, result){
			hash=result;				//blockHash is stored
			var block=web3.eth.getBlock(hash);	//Block object is fetched using blockHash
			var len=block.transactions.length;
			var data; var i=0;
			var prev;
			if(len!=0){				//if the block contains any transactions
				while(i<len){
					var tx=block.transactions[i++];
					//if the transaction is not sent by own node
					if(web3.eth.getTransaction(tx).from!=web3.eth.accounts[0]){
						if(tx!=prev)		//new transaction
							window.add();
						prev=tx;
						var fromAccount = web3.eth.getTransaction(tx).from;
						//input message is retrieved from the transaction
						data=web3.eth.getTransaction(tx).input;
						var ascii_string=web3.toAscii(data);
						var msg_received = ascii_string.substring(ascii_string.lastIndexOf("<") + 1);
						console.log(msg_received);
				//		try{
				//			var parsedData = JSON.parse(msg_received);
				//			window.setStatus(parsedData["id"],"transactions");
                                  //                      window.setStatus(fromAccount,"account");
				//		}catch(e){
							window.setStatus(msg_received,"transactions");
							window.setStatus(fromAccount,"account");
				//		}
					}
				}
			}
		})
}
window.setStatus = function(message,id) {
	var status = document.getElementById(id);
	status.innerHTML = message;
}
window.sendFile = function(candidate){
	try{
		var meta;console.log(hash_received);
		var addr= $("#address_file").val();
        	var msg= hash_received;console.log(addr);
		 var formatted_msg = "<<<<<"+msg;
                Message.deployed().then(function(instance) {
                        meta = instance;
                        // return meta.coinBalanceOf.call(web3.eth.accounts[0]);
                        return meta.sendCoin(addr, formatted_msg, {from: web3.eth.accounts[0]});
                }).then(function(result) {
                        console.log(result);
                        alert("Transaction Successful!! File Sent !!");
                }).catch(function(e) {
                        console.log(e);
                })

        } catch (err) {
                console.log(err);
        }

}
window.sendCoin = function(candidate) {

	try {

		var meta;
		//var addr2= $("#address_file");
		//var msg2= JSON.stringify(hash_received);
		var addr = $("#address").val();
		var msg = $("#message").val();
		var formatted_msg = "<<<<<"+msg;
		Message.deployed().then(function(instance) {
			meta = instance;console.log(instance);
			// return meta.coinBalanceOf.call(web3.eth.accounts[0]);
			return meta.sendCoin(addr, formatted_msg, {from: web3.eth.accounts[0]});
		}).then(function(result) {
			console.log(result);
			alert("Transaction Successful!");
     		}).catch(function(e) {
			console.log(e);
     		})

  	} catch (err) {
    		console.log(err);
  	}
}

$( document ).ready(function() {
  	if (typeof web3 !== 'undefined') {
    		console.warn("Using web3 detected from external source like Metamask")
    		// Use Mist/MetaMask's provider
    		window.web3 = new Web3(web3.currentProvider);
  	}
	else {
    		console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    		// fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    		window.web3 = new Web3(new Web3.providers.HttpProvider("http://ec2-52-52-25-62.us-west-1.compute.amazonaws.com:13080"));
  	}
	//console.log(Web3.providers.HttpProvider("http://localhost:12080"));
	//console.log(web3);
	//alert(web3.currentProvider.host);
  	Message.setProvider(web3.currentProvider);
  	window.start();
	//console.log(voting_artifacts);
	//console.log(web3.accounts);

});

