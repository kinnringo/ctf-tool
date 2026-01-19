import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('api', {
    checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),
    sendEcho: (message: string) => ipcRenderer.invoke('send-echo', message),
    base64: {
        encode: (text: string) => ipcRenderer.invoke('base64-encode', text),
        decode: (text: string) => ipcRenderer.invoke('base64-decode', text),
    },
    stego: {
        extractLsb: (base64Image: string) => ipcRenderer.invoke('stego-lsb', base64Image),
    },
    forensics: {
        analyzeFile: (base64Data: string) => ipcRenderer.invoke('forensics-file', base64Data),
        extractStrings: (base64Data: string) => ipcRenderer.invoke('forensics-strings', base64Data),
        calculateEntropy: (base64Data: string) => ipcRenderer.invoke('forensics-entropy', base64Data),
        calculateEntropyGraph: (base64Data: string) => ipcRenderer.invoke('forensics-entropy-graph', base64Data),
        scanFile: (base64Data: string) => ipcRenderer.invoke('forensics-scan', base64Data),
    },
    workspace: {
        openFolder: () => ipcRenderer.invoke('workspace-open-folder'),
        openFile: () => ipcRenderer.invoke('workspace-open-file'),
        readTree: (folderPath: string) => ipcRenderer.invoke('workspace-read-tree', folderPath),
        readFile: (filePath: string) => ipcRenderer.invoke('workspace-read-file', filePath),
        getPathForFile: (file: File) => webUtils.getPathForFile(file),
    }
});
