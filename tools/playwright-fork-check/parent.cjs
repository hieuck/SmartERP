const path = require('path');
const { fork } = require('child_process');

const childPath = path.join(__dirname, 'child.cjs');
const child = fork(childPath, {
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
