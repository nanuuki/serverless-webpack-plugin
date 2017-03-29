'use strict';
const path = require('path');
const childProcess = require('child_process');
const Promise = require('bluebird');
const fs = require('fs');

const exec = Promise.promisify(childProcess.execFile);

function findNearestPkg(root) {
  let pkg;
  let file;
  let current = root;

  while (!pkg) {
    file = path.join(current, 'package.json');
    if (fs.existsSync(file)) {
      pkg = file;
      break;
    }
    current = path.join(current, '..');
  }

  if (!pkg) {
    throw new Error('Error: Could not find package.json!');
  }

  return pkg;
}

module.exports = function copyModules(funcPath, moduleNames, dest) {
  // No dependencies, just return, so that npm install would not fail.
  if (moduleNames.length === 0) {
    return Promise.resolve();
  }

  const pkg = require(findNearestPkg(funcPath));

  const modulesAndVersions = moduleNames.map(moduleName => {
    const moduleVersion = pkg.dependencies[moduleName];

    // If no module version was found, throw an error
    if (!moduleVersion) {
      throw new Error(`Error: Could not find module ${moduleName} in package.json!`);
    }

    return `${moduleName}@${moduleVersion}`;
  });
  const opts = { cwd: path.join(dest), env: process.env };
  const args = ['install', '--production'].concat(modulesAndVersions);

  // Run 'npm install' on each module to get a full set of dependencies,
  // not just the directly copied ones.
  return exec('npm', args, opts);
};
