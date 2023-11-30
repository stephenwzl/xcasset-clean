#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// get first param as working directory
let workingDir = process.argv[2] || process.cwd();
// if working directory is relative path, convert to absolute path
if (!path.isAbsolute(workingDir)) {
  workingDir = path.join(process.cwd(), workingDir);
}
console.log(`Working directory: ${workingDir}`);

function listAssets(dir) {
  // resursive list all .imageset folders
  const assets = [];
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    let folder = path.join(dir, file);
    if (file.endsWith('.imageset')) {
      assets.push(folder);
      return;
    }
    if (fs.lstatSync(folder).isDirectory()) {
      const subAssets = listAssets(folder);
      assets.push(...subAssets);
    }
  });
  return assets;
}

function processingAssetFolder(assetFolder) {
  let basename = path.basename(assetFolder).split('.')[0];
  let contentJSONFile = path.join(assetFolder, 'Contents.json');
  if (!fs.existsSync(contentJSONFile)) {
    console.log(`Contents.json not found in ${basename}`);
    return;
  }
  const contentsJson = JSON.parse(fs.readFileSync(contentJSONFile));
  const images = contentsJson.images || [];
  const newImages = [...images];
  let hasRename = false;
  images.forEach((image, index) => {
    const { scale, filename } = image;
    if (!scale || !filename) {
      return;
    }
    const extention = path.extname(filename);
    let newFilename = `${basename}@${scale}${extention}`;
    if (scale === '1x') {
      newFilename = `${basename}${extention}`;
    }
    if (filename !== newFilename) {
      hasRename = true;
      console.log(`rename ${filename} to ${newFilename}`);
      fs.renameSync(path.join(assetFolder, filename), path.join(assetFolder, newFilename));
      newImages[index].filename = newFilename;
    }
  });
  contentsJson.images = newImages;
  if (hasRename) {
    // keep space after colon
    fs.writeFileSync(contentJSONFile, JSON.stringify(contentsJson, null, 2) + '\n');
    console.log(`Contents.json updated in ${basename}`);
  }
}

async function main() {
  const assets = listAssets(workingDir);
  console.log(`found ${assets.length} assets`);
  assets.forEach(asset => {
    processingAssetFolder(asset);
  });
}

main();