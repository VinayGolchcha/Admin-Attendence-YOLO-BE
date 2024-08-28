import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn,exec} from 'child_process';
import path from 'path';
import { installConda, setupEnvironment } from './install.js';

await installConda();
await setupEnvironment();
const app = express();
const server = createServer(app);
const io = new Server(server);

const pythonProcess = spawn('conda', ['run', '-n', 'conda_env', 'python', 'script.py']); // Update path and python version as needed

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

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Node.js server running on port ${PORT}`);
});
