// run-lighthouse.js

const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

async function runLighthouse() {
  try {
    const { stdout, stderr } = await execPromise(
      'lighthouse http://fcarlosmonteiro.github.io/ --output=json --output-path=lighthouse-report.json'
    );
    console.log(stdout);
    console.error(stderr);
  } catch (error) {
    console.error('Erro ao executar o Lighthouse:', error);
  }
}

runLighthouse();
