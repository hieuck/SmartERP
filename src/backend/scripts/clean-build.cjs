const fs = require('fs');
const path = require('path');

const targets = [
  path.resolve(__dirname, '..', 'dist'),
  path.resolve(__dirname, '..', 'tsconfig.build.tsbuildinfo'),
];

for (const target of targets) {
  fs.rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}
