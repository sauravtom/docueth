
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

/*encryption variables*/
var fs = require('fs');
var crypto = require('crypto');
var algorithm = 'aes-256-cbc';
var private_key = '019678ec59270e7b2769f39b36bf42a3651ed1e7f81b9dc8b06768dc55495926'
var public_key = '019678ec59270e7b2769f39b36bf42a3651ed1e7f81b9dc8b06768dc55495926'

function encrypt(name,res) {
	var key = '14189dc35ae35e75ff31d7502e245cd9bc7803838fbfd5c773cdcd79b8a28bbd';
	var sha_hash;
	var id;
	var cipher = crypto.createCipher(algorithm, key);
	var file;
    	gfs.collection('ctFiles');
        gfs.files.find({"filename" : name }).toArray(function(err, files) {
        	if(!files || files.length === 0) {
                	console.log("File not correctly uploaded");
                }

                var input  = gfs.createReadStream({
            		filename: files[0].filename,
                    	root: "ctFiles"
      	        });
  		var output = fs.createWriteStream(files[0].filename+'.enc');
    		input.pipe(cipher).pipe(output);
    		output.on('finish', function() {
	    		console.log('Encrypted file written to disk!');

    			var key_cipher = crypto.createCipher(algorithm, private_key);
			var input_key = key;
			var encrypted_key = key_cipher.update(input_key,'utf8','hex');
			encrypted_key += key_cipher.final('hex');


			var algo = 'sha256';
                	var shasum = crypto.createHash(algo);
                        file = name+'.enc';
	                var s = fs.ReadStream(file);
        	        s.on('data', function(d) { shasum.update(d); });
                	s.on('end', function() {
                        	var d = shasum.digest('hex');
                            	console.log(d);
	                        sha_hash = d;

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
				        gfs.files.find({"filename": file}).toArray(function(err, files){
		                		if(!files || files.length === 0){
        		                		console.log("encrypted file not uploaded: "+err);
                				}
	              				id = files[0]._id;
                				console.log(files[0]);
						var array = new Array(3);
						array[0]=sha_hash; array[1]=id; array[2]=encrypted_key;
						res.json({error_code:0,err_desc:null,hash:array[0],id:array[1],key:array[2]});
					});

		        	});
			});

	        });

        });
}

app.get('/received_file', function(req, res){
        gfs.collection('ctFiles'); //set collection name to lookup into
        var object = JSON.parse(req.query.object);
        console.log(object.id);
        var id = new mongoose.mongo.ObjectId(object.id);
        var key_decipher = crypto.createDecipher(algorithm, public_key);
        var input_key = object.key;
        var decrypted_key = key_decipher.update(input_key,'hex','utf8');
        decrypted_key += key_decipher.final('utf8');
        // First check if file exists
        gfs.files.find({"_id": id}).toArray(function(err, files){
                if(!files || files.length === 0){
                        console.log("File not found");
                }
                console.log(files[0]);
                var read_stream = gfs.createReadStream({_id: id, root: 'ctFiles'});
                var decipher = crypto.createDecipher(algorithm, decrypted_key);
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

app.get('/received_file', function(req, res){
        gfs.collection('ctFiles'); //set collection name to lookup into
        console.log(req.query);
       // var id = new mongoose.mongo.ObjectId(req.objectid);
        /** First check if file exists */
     //   gfs.files.find({_id: id}).toArray(function(err, files){
   /*             if(!files || files.length === 0){
                        console.log("File not found");
                }
                /** create read stream */
           /*     var readstream = gfs.createReadStream({
                                        filename: files[0].filename,
                                        root: "ctFiles"
                                });
                /** set the proper content type */
             //   res.set('Content-Type', files[0].contentType)
                /** return response */
               // return readstream.pipe(res);
 //       });
});
/** API path that will upload the files */
app.post('/upload', function(req, res) {
	upload(req,res,function(err){
        	if(err){
        		res.json({error_code:1,err_desc:err});
	                //next(err);
        	        return;
        	}
		//var array = new Array(3);
		encrypt(req.file.filename,res);
		//viewFile("5938f7fec5ce7165e550d775");
		/*setTimeout(function () {
			res.json({error_code:0,err_desc:null,hash:array[0],id:array[1]});
		}, 1000)*/

		//res.json({error_code:0,err_desc:null,hash:hash});
		//res.send(hash);
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

app.listen('4002', function(){
	console.log('running on 4002...');
});
