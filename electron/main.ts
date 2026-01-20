import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as child_process from 'child_process';
import * as fs from 'fs';
// fetch is global in Node 18+ / Electron

// Global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let pythonProcess: child_process.ChildProcess | null = null;

const PY_HOST = '127.0.0.1';
const PY_PORT = 8000;
const PY_URL = `http://${PY_HOST}:${PY_PORT}`;

// Function to find Python executable (Dev) or Binary (Prod)
function getPythonPath(): string {
    const isWin = process.platform === 'win32';

    if (app.isPackaged) {
        // Production: Use bundled executable
        // In electron-builder, extraResources puts files in resources/
        // process.resourcesPath points to that folder
        const exeName = isWin ? 'api.exe' : 'api';
        return path.join(process.resourcesPath, exeName);
    } else {
        // Development: Use venv python
        const venvPath = path.join(__dirname, '..', '..', 'backend', 'venv');
        const binDir = isWin ? 'Scripts' : 'bin';
        const executable = isWin ? 'python.exe' : 'python';
        return path.join(venvPath, binDir, executable);
    }
}

// Start Python Backend
function startPythonSubprocess() {
    const pythonPath = getPythonPath();
    console.log(`Starting Python process from: ${pythonPath}`);

    const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };

    if (app.isPackaged) {
        // Production: Spawn the exe directly
        // No arguments needed for now, it runs uvicorn internally
        console.log(`Running bundled backend`);
        pythonProcess = child_process.spawn(pythonPath, [], { env });
    } else {
        // Development: Run python script
        const scriptPath = path.join(__dirname, '..', '..', 'backend', 'app.py');
        console.log(`Running script: ${scriptPath}`);
        pythonProcess = child_process.spawn(pythonPath, [scriptPath], { env });
    }

    if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Python]: ${data}`);
        });
    }
    if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python API]: ${data}`);
        });
    }

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

// Kill Python Backend
function killPythonSubprocess() {
    if (pythonProcess) {
        console.log('Killing Python process...');
        pythonProcess.kill();
        pythonProcess = null;
    }
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // In production, load file. In dev, load localhost:5173
    // basic check for dev
    const isDev = !app.isPackaged;
    if (isDev) {
        // Wait for Vite to be ready? usually concurrently handles this or we just retry
        await mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    startPythonSubprocess();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    killPythonSubprocess();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    killPythonSubprocess();
});

// --- IPC Handlers ---

ipcMain.handle('check-backend-health', async () => {
    try {
        // dynamic import for node-fetch is annoyance in CJS, using native fetch if node 18+ or standard http
        // Assuming Node 18+ in Electron
        const response = await fetch(`${PY_URL}/health`);
        return await response.json();
    } catch (e: any) {
        return { status: 'error', message: e.message };
    }
});

ipcMain.handle('send-echo', async (event, message) => {
    try {
        const response = await fetch(`${PY_URL}/echo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('base64-encode', async (event, text) => {
    try {
        const response = await fetch(`${PY_URL}/crypto/base64/encode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: text })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('base64-decode', async (event, text) => {
    try {
        const response = await fetch(`${PY_URL}/crypto/base64/decode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: text })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('stego-lsb', async (event, base64Image) => {
    try {
        const response = await fetch(`${PY_URL}/stego/lsb`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Image })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('forensics-file', async (event, base64Data) => {
    try {
        const response = await fetch(`${PY_URL}/forensics/file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Data })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('forensics-strings', async (event, base64Data) => {
    try {
        const response = await fetch(`${PY_URL}/forensics/strings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Data })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('forensics-entropy', async (event, base64Data) => {
    try {
        const response = await fetch(`${PY_URL}/forensics/entropy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Data })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('forensics-entropy-graph', async (event, base64Data) => {
    try {
        const response = await fetch(`${PY_URL}/forensics/entropy/graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Data })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('forensics-scan', async (event, base64Data) => {
    try {
        const response = await fetch(`${PY_URL}/forensics/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64Data })
        });
        return await response.json();
    } catch (e: any) {
        return { error: e.message };
    }
});

// --- Workspace IPC Handlers ---

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: TreeNode[];
}

function buildTree(dirPath: string): TreeNode[] {
    // Note: Do not catch errors here. Let them propagate to the IPC handler
    // so that we can distinguish between a file (error) and an empty folder (empty array).
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const node: TreeNode = {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory()
        };
        if (entry.isDirectory()) {
            try {
                node.children = buildTree(fullPath);
            } catch (e) {
                // If we can't read a subdirectory, just skip its children
                node.children = [];
            }
        }
        return node;
    });
}

ipcMain.handle('workspace-open-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }
    return { path: result.filePaths[0] };
});

ipcMain.handle('workspace-open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }
    return { path: result.filePaths[0] };
});

ipcMain.handle('workspace-read-tree', async (event, folderPath: string) => {
    try {
        const tree = buildTree(folderPath);
        return { result: tree };
    } catch (e: any) {
        return { error: e.message };
    }
});

ipcMain.handle('workspace-read-file', async (event, filePath: string) => {
    try {
        const data = fs.readFileSync(filePath);
        const base64 = data.toString('base64');
        return { result: base64, fileName: path.basename(filePath) };
    } catch (e: any) {
        return { error: e.message };
    }
});
