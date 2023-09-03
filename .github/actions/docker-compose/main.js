const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');

async function run() {
  try {

    const sshHost = core.getInput('ssh-host');
    const sshPort = core.getInput('ssh-port');
    const sshUser = core.getInput('ssh-user');
    const projectPath = core.getInput('project-path');
    const sshPrivateKey = core.getInput('ssh-private-key');

    // Path to the docker-compose.yml file
    const dockerComposePath = 'docker-compose.yml';

    // Check if the docker-compose.yml file exists
    if (!fs.existsSync(dockerComposePath)) {
      core.setFailed('docker-compose.yml file not found.');
      return;
    }

    // Set up SSH agent and configure it with the private key
    await exec.exec('mkdir .ssh');
    await exec.exec('touch .ssh/id_rsa');
    await exec.exec(`echo ${sshPrivateKey} > .ssh/id_rsa`);
    await exec.exec('chmod', ['600', '.ssh/id_rsa']);
    await exec.exec('ssh-add', ['.ssh/id_rsa']);

    await exec.exec('scp', [
      '-P', sshPort,
      '-i', '.ssh/id_rsa',
      dockerComposePath,
      `${sshUser}@${sshHost}:~/${projectPath}/docker-compose.yml`
    ]);
    core.info('docker-compose.yml file copied to the remote server.');

    const dockerComposeCommand = 'docker-compose up -d';

    // Run the Docker Compose command on the remote server via SSH
    // await exec.exec('ssh', [
    //   '-i', '.ssh/id_rsa',
    //   '-p', sshPort,
    //   `${sshUser}@${sshHost}`,
    //   dockerComposeCommand
    // ]);

    core.info('Docker Compose command executed successfully on the remote server.');
  } catch (error) {
    core.setFailed(`Error: ${error.message}`);
  }
}

run();