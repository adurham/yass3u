// Dependencies
var AWS = require('aws-sdk');
var express = require("express");
var formidable = require('formidable');

// AWS Config
var bucket = process.env.S3_BUCKET;
var s3 = new AWS.S3({
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
});
var s3Stream = require('s3-upload-stream')(s3);

var app = express();

//Store all HTML files in view folder.
app.use(express.static(__dirname + '/views'));
//Store all JS and CSS in Scripts folder.
app.use(express.static(__dirname + '/scripts'));

// Show index.html
app.get('/',function(req,res){
  res.sendFile('index.html');
});

// Process and upload data from form
app.post('/upload', function(req, res){
  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  form.onPart = function(part) {
            console.log('part',part);
            
            var start = new Date().getTime();
            var upload = s3Stream.upload({
                "Bucket": bucket,
                "Key": part.filename
            });

            // Optional configuration
            //upload.maxPartSize(20971520); // 20 MB
            upload.concurrentParts(5);

            // Handle errors.
            upload.on('error', function (error) {
                console.log('errr',error);
            });
            upload.on('part', function (details) {
                console.log('part',details);
            });
            upload.on('uploaded', function (details) {
                var end = new Date().getTime();
                console.log('it took',end-start);
                console.log('uploaded',details);
            });

            // Maybe you could add compress like
            // part.pipe(compress).pipe(upload)
            part.pipe(upload);
        };

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});