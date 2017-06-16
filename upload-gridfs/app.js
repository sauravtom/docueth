var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/gridfstest');
var conn = mongoose.connection;
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);

var ursa = require('ursa');
var fs = require('fs');
var encoding = 'base64';

//Private key of this node is inside the keys folder, generated by keygen.js
var priv = ursa.createPrivateKey(fs.readFileSync('./keys/privkey.pem'));

/*encryption variables*/
var fs = require('fs');
var crypto = require('crypto');
var algorithm = 'aes-256-cbc';


function encrypt(name, res) {
	//key to encode the original file
	var key = '14189dc35ae35e75ff31d7502e245cd9bc7803838fbfd5c773cdcd79b8a28bbd';
	var sha_hash;
	var id;
	var cipher = crypto.createCipher(algorithm, key);
	var file;
    	gfs.collection('ctFiles');
	//fetching the original uploaded file
        gfs.files.find({"filename" : name }).toArray(function(err, files) {
        	if(!files || files.length === 0) {
                	console.log("File not correctly uploaded");
                }

                var input  = gfs.createReadStream({
            		filename: files[0].filename,
                    	root: "ctFiles"
      	        });
  		var output = fs.createWriteStream(files[0].filename+'.enc');
		//encoding the original file
    		input.pipe(cipher).pipe(output);
    		output.on('finish', function() {
	    		console.log('Encrypted file written to disk!');

    			/*var key_cipher = crypto.createCipher(algorithm, private_key);
			var input_key = key;
			var encrypted_key = key_cipher.update(input_key,'utf8','hex');
			encrypted_key += key_cipher.final('hex');*/

			//encrypting the key with receiver's public key
			var pub = ursa.createPublicKey(fs.readFileSync('./pubkey.pem'));
			var data = new Buffer(key, 'ascii');

			var encrypted_key =  pub.encrypt(data).toString('base64');

			//creating sha-hash of the encrypted file
			var algo = 'sha256';
                	var shasum = crypto.createHash(algo);
                        file = name+'.enc';
	                var s = fs.ReadStream(file);
        	        s.on('data', function(d) { shasum.update(d); });
                	s.on('end', function() {
                        	var d = shasum.digest('hex');
                            	console.log(d);
	                        sha_hash = d;
				//uploading the encrypted file to database
				var read_stream = fs.createReadStream(file);
				var writestream = gfs.createWriteStream(
							{filename: file,
							contentType: "text/plain",
							metadata: {originalname: file},
							root: 'ctFiles'});
				read_stream.pipe(writestream);
				console.log(file);
				writestream.on("finish",function() {
					gfs.collection('ctFiles');
					//fetching object-id of the encrypted file form mongodb
				        gfs.files.find({"filename": file}).toArray(function(err, files){
		                		if(!files || files.length === 0){
        		                		console.log("encrypted file not uploaded: "+err);
                				}
	              				id = files[0]._id;
                				console.log(files[0]);
						//sending the information to response
						var array = new Array(3);
						array[0]=sha_hash; array[1]=id; array[2]=encrypted_key;
						res.json({"error_code":0,"err_desc":null,"hash":array[0],"id":array[1],"key":array[2]});
					});

		        	});
			});

	        });

        });
}

//View received file and decrypt to display the original file 
app.get('/received_file', function(req, res){
        gfs.collection('ctFiles'); //set collection name to lookup into

	var object = JSON.parse(req.query.object);
	console.log(object.id);
	var id = new mongoose.mongo.ObjectId(object.id);

	/*var key_decipher = crypto.createDecipher(algorithm, public_key);
        var input_key = object.key;
        var decrypted_key = key_decipher.update(input_key,'hex','utf8');
        decrypted_key += key_decipher.final('utf8');*/

	//decrypting the received key with own private key
	var decrypted_key = priv.decrypt(object.key,'base64').toString('ascii');

        // First check if file exists
	gfs.files.find({"_id": id}).toArray(function(err, files){
		if(!files || files.length === 0){
			console.log("File not found");
		}
		console.log(files[0]);
		var read_stream = gfs.createReadStream({_id: id, root: 'ctFiles'});
		var decipher = crypto.createDecipher(algorithm, decrypted_key);
		//decipher the file and set to response
		return read_stream.pipe(decipher).pipe(res);
	});

});


/** Seting up server to accept cross-origin browser requests */
app.use(function(req, res, next) { //allow cross origin requests
	res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "*"); //to enable CORS
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Credentials", true);
        next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

/** Setting up storage using multer-gridfs-storage */
var storage = GridFsStorage({
	gfs : gfs,
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
        },
        /** With gridfs we can store aditional meta-data along with the file */
        metadata: function(req, file, cb) {
            cb(null, { originalname: file.originalname });
        },
        root: 'ctFiles' //root name for collection to store files into
});

var upload = multer({ //multer settings for single upload
	storage: storage
}).single('fil');

//save receiver's Public Key in pubkey.pem file
app.post('/public_key', function(req, res){
//        console.log(req.body);
        var obj = JSON.parse(JSON.stringify(req.body));
        console.log(obj.key);
	var temp = obj.key;
	fs.writeFile("pubkey.pem", temp, function(err){
   	     	if (err) throw err;
        	console.log("success");
	});
});
/** API path that will upload the files */
app.post('/upload', function(req, res) {
//	console.log(req);
	upload(req,res,function(err){
        	if(err){
        		res.json({error_code:1,err_desc:err});
	                //next(err);
        	        return;
        	}
		var document_name = req.file.filename;
		encrypt(document_name, res);

        });
});

app.get('/file/:filename', function(req, res){
	gfs.collection('ctFiles'); //set collection name to lookup into

        /** First check if file exists */
        gfs.files.find({filename: req.params.filename}).toArray(function(err, files){
        	if(!files || files.length === 0){
                	return res.status(404).json({
                    		responseCode: 1,
                    		responseMessage: "error"
                	});
            	}
            	/** create read stream */
            	var readstream = gfs.createReadStream({
                			filename: files[0].filename,
                			root: "ctFiles"
            			});
            	/** set the proper content type */
            	res.set('Content-Type', files[0].contentType)
            	/** return response */
            	return readstream.pipe(res);
        });
});

app.listen('3002', function(){
	console.log('running on 3002...');
});
