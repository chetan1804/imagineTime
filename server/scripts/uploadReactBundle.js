const { Storage } = require('@google-cloud/storage');
const path = require('path');
const config = require('../config')[process.env.NODE_ENV];
let fs = require('fs');
let progress = require('progress-stream');

// set up Google environment variables
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.gcloud.keyPath;

//create new storage instance
const storage = new Storage();

const paths = {
  "vendor": "../static/js/vendor.js",
  "react": "../static/js/react-bundle.js"
}

const env = process.env.NODE_ENV;

async function uploadFile(type) {

  if(!env) return;

  const bucketName = config.gcloud.bucketName;
  const sourceFilePath = path.join(__dirname, paths[type]);
  const fileName = path.basename(sourceFilePath);
  const folderPath = `react-bundle/${env}`
  
  //fileNameWithFolders 384/403222/7342542.docx

  const filenameWithFolders = `${folderPath}/${fileName}`;
  console.log('filenameWithFolder', filenameWithFolders);
  console.log('sourceFilePath', sourceFilePath);

  // Upload the file to the specific folder within the bucket with a different filename
  const fileDestination = storage.bucket(bucketName).file(filenameWithFolders);

  const stats = fs.statSync(sourceFilePath);

  const streamProgress = progress({
    length: stats.size,
    time: 200 // The interval at which events are emitted in milliseconds.
  });

  streamProgress.on('progress', progress => {
    console.log("PROGRESS!", progress);
  })

  fs.createReadStream(sourceFilePath)
  .pipe(streamProgress)
  .pipe(fileDestination.createWriteStream({ gzip: true }))
  .on('error', (error) => {
    console.log("ERROR in createReadStream", error);
  })
  .on('finish', async () => {
    // // Set metadata before creating the write stream
    await fileDestination.setMetadata({
      contentType: 'application/javascript',
      cacheControl: 'public, max-age=900', // set max-age to 15mins Adjust caching behavior as needed
    });
  
    await fileDestination.makePublic();
    console.log('file successfully uploaded')
  });
}

function uploadReactBundle() {
  uploadFile('react');
}

function uploadVendorBundle() {
  uploadFile('vendor');
}

uploadReactBundle();

if(env !== "production" && env !== "production2") uploadVendorBundle();
