import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn,exec} from 'child_process';
import path from 'path';
import os from 'os';
import { installConda, setupEnvironment } from './install.js';
import { config } from 'dotenv';
config()
await installConda();
await setupEnvironment();
const app = express();
const server = createServer(app);
const io = new Server(server);
const condaPath = path.join(os.homedir(), os.platform() === 'win32' ? 'Miniconda3' : 'miniconda3', 'condabin', os.platform() === 'win32' ? 'conda.bat' : 'conda');
const pythonProcess = spawn(condaPath, ['run', '-n', 'conda_env', 'python', 'script.py']);

io.on('connection', (socket) => {
    console.log('Client connected');

    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        socket.emit('python_output', output);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
    });

    socket.on('detections', (data) => {
        console.log('Received detections:', data.detections);
        console.log('Received URL:', data.rtsp_url);
        console.log('stream_id :', data.stream_id);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        pythonProcess.kill('SIGINT');
    });
});

let PORT = process.env.PORT || 3000;
server.listen(process.env.PORT, () => {
    console.log(`Node.js server running on port ${PORT}`);
});
