export { };

declare global {
    interface Window {
        api: {
            checkBackendHealth: () => Promise<any>;
            sendEcho: (message: string) => Promise<any>;
            base64: {
                encode: (text: string) => Promise<any>;
                decode: (text: string) => Promise<any>;
            };
            stego: {
                extractLsb: (base64Image: string) => Promise<any>;
            };
            forensics: {
                analyzeFile: (base64Data: string) => Promise<any>;
                extractStrings: (base64Data: string) => Promise<any>;
                calculateEntropy: (base64Data: string) => Promise<any>;
                calculateEntropyGraph: (base64Data: string) => Promise<any>;
                scanFile: (base64Data: string) => Promise<any>;
            };
            workspace: {
                openFolder: () => Promise<any>;
                openFile: () => Promise<any>;
                readTree: (folderPath: string) => Promise<any>;
                readFile: (filePath: string) => Promise<any>;
                getPathForFile: (file: File) => string;
            };
        };
    }
}
