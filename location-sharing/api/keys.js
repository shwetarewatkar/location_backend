const { generateKeyPair } = require('crypto');

const AWS = require('aws-sdk');
AWS.config.update({ region:'us-west-2'});
// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});
const BUCKET_NAME = 'location-sharing';

function uploadFile (buffer, fileName) {
    return new Promise((resolve, reject) => {
     s3.putObject({
      Body: buffer,
      Key: fileName,
      Bucket: BUCKET_NAME,
     }, (error) => {
      if (error) {
       reject(error);
      } else {
       console.info(`${fileName} uploaded to ${BUCKET_NAME} succesfully.`);
       resolve(fileName);
      }
     });
    });
   }

function checkFileExists (fileName) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName //if any sub folder-> path/of/the/folder.ext
    }
    s3.headObject(params,function(err, metadata){
        if(err && err.code === 'NotFound'){
            return false
        }
        else{
            return true
        }
    })
        
}

 
exports.getKey = function(req, res){
    postdata = req.body;

    let sessionId = postdata.sessionid;
    console.log('-----',sessionId);
    if(!checkFileExists(sessionId)){
        generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
              type: 'pkcs1',
              format: 'pem'
            },
            privateKeyEncoding: {
              type: 'pkcs1',
              format: 'pem'
            }
          }, (err, publicKey, privateKey) => {
    
            if(err){
                console.log(err);
            }
            else{
                uploadFile(publicKey,sessionId); //data, filename
                    
                    res.status(200).json({ status: true, key: privateKey});
                }
          });
    }
    
    
    

      
}