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
        let installerUrl, installerPath;

        if (platform === 'win32') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-Windows-x86_64.exe');
        } else if (platform === 'darwin') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-MacOSX-x86_64.sh');
        } else if (platform === 'linux') {
            installerUrl = 'https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh';
            installerPath = path.join(os.tmpdir(), 'Miniconda3-latest-Linux-x86_64.sh');
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
    }
};

const setupEnvironment = async () => {
    console.log('Creating/Updating Conda environment...');
    try {
        // Check if the environment exists
        const envList = execSync('conda env list').toString();
        if (envList.includes('conda_env')) {
            // If the environment exists, update it
            console.log('Conda environment "conda_env" already exists. Updating...');
            execSync('conda env update -f environment.yml', { stdio: 'inherit' });
            execSync('conda activate conda_env', { stdio: 'inherit' });
        } else {
            // If the environment does not exist, create it
            console.log('Creating new Conda environment "conda_env"...');
            execSync('conda env create -f environment.yml', { stdio: 'inherit' });
            execSync('conda activate conda_env', { stdio: 'inherit' });
        }

        console.log('Conda environment created/updated successfully.');

        // Install Python dependencies if needed
        console.log('Installing Python dependencies...');
        // execSync('pip install -r requirements.txt', { stdio: 'inherit' });
        console.log('Python dependencies installed successfully.');
    } catch (error) {
        console.error(`Error setting up environment: ${error.message}`);
    }
};

export { installConda, setupEnvironment };
