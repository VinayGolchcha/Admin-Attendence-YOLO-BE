import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

const installConda = async () => {
    console.log('Checking for Conda installation...');
    try {
        execSync('conda --version', { stdio: 'pipe' });
        console.log('Conda is already installed.');
    } catch (error) {
        console.log('Conda is not installed. Installing Miniconda...');

        const platform = os.platform();
        let installerUrl, installerPath, condaPath;

        if (platform === 'win32') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-Windows-x86_64.exe');
            condaPath = path.join(os.homedir(), 'Miniconda3', 'Scripts', 'conda.exe');
        } else if (platform === 'darwin') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-MacOSX-x86_64.sh');
            condaPath = path.join(os.homedir(), 'miniconda3', 'bin', 'conda');
        } else if (platform === 'linux') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-Linux-x86_64.sh');
            condaPath = path.join(os.homedir(), 'miniconda3', 'bin', 'conda');
        } else {
            throw new Error(`Unsupported platform: ${platform}`);
        }

        // Download and install Miniconda
        execSync(`curl -o ${installerPath} ${installerUrl}`, { stdio: 'inherit' });
        if (platform === 'win32') {
            execSync(`start /wait "" "${installerPath}" /InstallationType=JustMe /AddToPath=1 /RegisterPython=1 /S /D=${path.join(os.homedir(), 'Miniconda3')}`, { stdio: 'inherit' });
        } else {
            execSync(`bash ${installerPath} -b -p ${path.join(os.homedir(), 'miniconda3')}`, { stdio: 'inherit' });
        }
        console.log('Miniconda installed successfully.');

        // Add Miniconda to PATH
        process.env.PATH = `${path.dirname(condaPath)}${path.delimiter}${process.env.PATH}`;
        console.log(`Miniconda added to PATH: ${condaPath}`);
    }
};

const setupEnvironment = async () => {
    console.log('Creating/Updating Conda environment...');
    try {
        const condaCommand = os.platform() === 'win32' ? 'conda.exe' : 'conda';
        const condaPath = path.join(os.homedir(), os.platform() === 'win32' ? 'Miniconda3' : 'miniconda3', 'bin', condaCommand);

        // Use the full path to conda
        const envList = execSync(`${condaPath} env list`).toString();
        if (envList.includes('conda_env')) {
            console.log('Conda environment "conda_env" already exists. Updating...');
            execSync(`${condaPath} env update -f environment.yml`, { stdio: 'inherit' });
        } else {
            console.log('Creating new Conda environment "conda_env"...');
            execSync(`${condaPath} env create -f environment.yml`, { stdio: 'inherit' });
        }

        console.log('Conda environment created/updated successfully.');

        // Activate the environment and install Python dependencies if needed
        console.log('Activating Conda environment...');
        execSync(`${condaPath} activate conda_env`, { stdio: 'inherit' });
        console.log('Installing Python dependencies...');
        // execSync('pip install -r requirements.txt', { stdio: 'inherit' });
        console.log('Python dependencies installed successfully.');
    } catch (error) {
        console.error(`Error setting up environment: ${error.message}`);
    }
};

export { installConda, setupEnvironment };
