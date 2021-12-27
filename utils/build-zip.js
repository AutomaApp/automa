/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const packageJSON = require('../package.json');

const fileName = `${packageJSON.name}-v${packageJSON.version}.zip`;

const destDir = path.join(__dirname, '../build');
const zipDir = path.join(__dirname, '../build-zip');

if (!fs.existsSync(zipDir)) {
  fs.mkdirSync(zipDir);
}

const archive = archiver('zip', { zlib: { level: 9 } });
const stream = fs.createWriteStream(path.join(zipDir, fileName));

archive
  .directory(destDir, false)
  .on('error', (error) => {
    console.error(error);
  })
  .pipe(stream);

stream.on('close', () => console.log('Success'));
archive.finalize();
