# File Upload and Messaging Demo
### using Ethereum, truffle and Nodejs

This is an Ethereum Blockchain based DApp running on a private network for file sharing through MongoDb server.
The app passes encrypted file (AES encryption) hash to another ethereum client on the private ethereum network.
This also has a simple message passing facility where the user can just send some messages to another Peer connected on the network.
This uses Ethereum Smart Contracts which are deployed in the ethereum private blockchain in the process of setting up of the project.
Truffle framework has been used for the web application to work.  
MongoDB has been used as the database where we are performing the upload.
We are encrypting the given file and returning the sha hash of the encrypted file after the upload in one AJAX (in JQuery) call.
We have used ExpressJS and GridFS for the file upload module.



##### Dependencies
  - Geth 1.5.9 or above
  - Truffle 3.2.4
  - npm 4.2.0
  - node 7.10.0
  - MongoDB
  
### Installing dependencies
* You can install Geth following the guide from [here](https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu) and Go from 
[here](https://tecadmin.net/install-go-on-ubuntu/#)
    
* For Truffle, follow instructions from [here](http://www.techtonet.com/how-to-install-and-execute-truffle-on-an-ubuntu-16-04/)
    
* Install npm 
```bash
$ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - 
$ sudo apt-get install -y nodejs 
``` 
* Install webpack 
```bash 
$ npm install --save-dev webpack 
``` 
* Install web3 
```bash 
$ npm install web3 
``` 
* Install MongoDB by following instructions from [here](https://docs.mongodb.com/v3.0/tutorial/install-mongodb-on-ubuntu/) 
After installations are done, update your system 
```bash 
$ sudo apt-get update 
$ sudo apt-get -y upgrade 
```
## Steps
#### Step 1 : Setting up a geth node
 Few things need to be specified in the geth command according to your own system and host details. They are...
    
 RPC port number, Port number, Host address, Location of data directory for your geth accounts and Network id.
 First initialize the blockchain by adding a Genesis block
```bash 
geth --rpcport "RPC port number" --rpccorsdomain="*" --rpcaddr "Host address" --rpcapi "eth,web3,db,net,personal" --datadir "Location of data directory" --port "Port number" --networkid "Network id" init ~/docueth/CustomGenesis.json 
``` 
Example : 
```bash 
geth --rpcport "13080" --rpccorsdomain="*" --rpcaddr "http://ec2-52-53-222-152.us-west-1.compute.amazonaws.com" --rpcapi "eth,web3,db,net,personal" --datadir "/home/ubuntu/mining" --port "13000" --networkid 9866 init ~/docueth/CustomGenesis.json 
``` 
Then start the geth console 
```bash 
geth --rpcport "13080" --rpccorsdomain="*" --rpcaddr "http://ec2-52-53-222-152.us-west-1.compute.amazonaws.com" --rpcapi "eth,web3,db,net,personal" --datadir "/home/ubuntu/mining" --port "13000" --networkid 9866 console 2>sml.txt 
``` 
Then in the console, run following commands: 
```bash
> personal.newAccount("password")
``` 
(This will give you the address of your first account. Run this command again to create another account where 
transactions from other accounts will be received.) 
```bash
> personal.unlockAccount(eth.accounts[0],"password",60000) admin.startRPC("0.0.0.0",13080)
``` 
(13080 is the rpc port number) 
```bash
> miner.setEtherbase(eth.accounts[0])
``` 
Now to add the geth node with which you will be performing transactions, add it's enode address as a peer. The enode address of a node can be found by : 
```bash
> admin
``` 
Then on your console 
```bash
> admin.addPeer("the enode address of the other node")
``` 
Now you can run 
```bash
> admin.peers
``` 
which will show you the other node as your peer. Then start your miner 
```bash
> miner.start()
```
#### Step 2 : Launching the truffle app
Steps to start a truffle project :
1. Go to the cloned repos and set up the environment for migration 
```bash 
$ nano truffle.js 
``` 
Change "host" , "port" and "network_id" under "live" to your specifications. 

2. Run the following to compile the original contracts and deploy them to your network 
```bash 
$ truffle compile --network live 
$ truffle migrate --network live 
``` 
(Here the contract which we will be using can be found at /docueth/contracts/message.sol) 

3. Now that the contracts are up and running, you can test to see if they are working correctly: 
```bash 
$ truffle test --network live 
``` 
(You can modify the test if you want to , by changing the file in /docueth/test folder) Once the tests are passed you can be sure that the contracts are correctly deployed and running. 

4. Change the host address for the web app
    Go to "/docueth/app/javascripts" folder and edit line number 108 in the file  app.js : 
```javascript 
window.web3 = new Web3(new Web3.providers.HttpProvider("http://ec2-52-52-25-62.us-west-1.compute.amazonaws.com:13080")); 
``` 
inside HttpProvider, put "your_host_address:rpc_port_number". 

5. Change the line number 22 of "index.html" in "/docueth/app" folder:
```HTML
<form id="myForm" action="your_host_address:3002/upload" method="post" enctype="multipart/form-data" >
```

6. Now we build and run the front end application in the app directory 
```bash
$ npm run build
$ truffle serve --network live --p 15080 
``` 
(mention the port you want your app to run , by default it runs on 8080) 

7. Open another terminal and start mongodb by 
```bash 
$ sudo service mongodb start 
$ mongo 
``` 
(mongo console opens up , you can check the database manually) 

8. Open another terminal and goto docueth/upload-gridfs and run 
```bash 
$ node app.js 
``` 

9. Check the localhost (or the network address of the running instance ) with the specific port number in a web browser. 
Go to "http://your_host_address:15080" You can transfer messages from the message box to a particular account id as mentioned in the field or select file and transfer the hash to another 
account. Click the "Choose File" button to select a file and then press "Submit". After pressing submit the document 
is uploaded to the mongodb gridfs. You can check the files in the mongodb database by opening the mongo console and 
type 
```bash
> use gridfstest 
> db.ctFiles.files.find()
```
