/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const packageJSON = require('../package.json');

const appVersion = packageJSON.version;
const zipDir = path.join(__dirname, '../build-zip', appVersion);

if (fs.existsSync(zipDir)) {
  const files = fs.readdirSync(zipDir);

  if (files.length > 0) {
    console.log(`Cleaning old build cache for version ${appVersion}...`);

    files.forEach((file) => {
      const filePath = path.join(zipDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        console.log(`  Removed: ${file}`);
      } else if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`  Removed directory: ${file}`);
      }
    });

    console.log('Build cache cleaned successfully.');
  } else {
    console.log(`No cache files found for version ${appVersion}.`);
  }
} else {
  console.log(
    `Build cache directory for version ${appVersion} does not exist. Skipping cleanup.`
  );
}
