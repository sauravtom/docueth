
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
    var key = '14189dc35ae35e75ff31d7502e245cd9bc7803838fbfd5c773cdcd79b8a28bbd';
    var sha_hash;

    function encrypt(name) {
	    var cipher = crypto.createCipher(algorithm, key);
	    var file;
    	    gfs.collection('ctFiles');
            gfs.files.find({"filename" : name }).toArray(function(err, files) {
                    if(!files || files.length === 0) {
                            console.log("File not correctly uploaded");
                    }
                    //		console.log(files[0]);
                    var input  = gfs.createReadStream({
            	                filename: files[0].filename,
                    	        root: "ctFiles"
      	             });
  		    var output = fs.createWriteStream(files[0].filename+'.enc');
    		    input.pipe(cipher).pipe(output);
    		    output.on('finish', function() {
    		    	console.log('Encrypted file written to disk!');

    			var algo = 'sha256';
                    	var shasum = crypto.createHash(algo);
                        file = name+'.enc';
                    	var s = fs.ReadStream(file);
                    	s.on('data', function(d) { shasum.update(d); });
                    	s.on('end', function() {
                         	var d = shasum.digest('hex');
                            	console.log(d);
                            	sha_hash = d;

                    	});
			console.log(file);
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
			try {multer({storage: storage}).single('fil');} catch(e) { console.log(e);}
	             });

            });
    //	console.log(hash);
    	return sha_hash;
    }

    function decrypt(filename) {
	   var decipher = crypto.createDecipher(algorithm, key);
	   var input = fs.createReadStream(filename);
	   var output = fs.createWriteStream(filename+'.dec');

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


        });

	   input.pipe(decipher).pipe(output);

	   output.on('finish', function() {
		  console.log('Decrypted file written to disk!');
	   });
    }

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

    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        upload(req,res,function(err){
            if(err){
                 res.json({error_code:1,err_desc:err});
                 //next(err);
                 return;
            }
	    var hash = encrypt(req.file.filename);
//		var sleep = require('sleep');
//		sleep.sleep(100);
	    setTimeout(function () {
		   res.json({error_code:0,err_desc:null,hash:hash});
	    }, 5000)
//	    res.json({error_code:0,err_desc:null,hash:hash});
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

    app.listen('3002', function(){
        console.log('running on 3002...');
    });
