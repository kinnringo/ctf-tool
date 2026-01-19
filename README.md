# CTF Tool

A versatile implementation of CTF (Capture The Flag) assist tools, combining a modern React frontend with a powerful Python backend.

## Features

- **Crypto**: Base64 encoding/decoding
- **Stego**: LSB (Least Significant Bit) extraction for images
- **File Analysis**:
  - File type identification (Magic Number)
  - Entropy calculation and validation
  - Local Entropy Graph visualization
  - String extraction (with browser-like search)
  - Hex Viewer (pagination, search, highlighting)
- **Workspace**: Folder/file management with drag-and-drop support

## Technology Stack

### Frontend
- **Framework**: [Electron](https://www.electronjs.org/)
- **UI Library**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

### Backend
- **Language**: Python 3.x
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Packaging**: [PyInstaller](https://pyinstaller.org/)
- **Communication**: HTTP (localhost) spawned as a subprocess

## Distribution & Compatibility

### Supported Platforms
- **Windows**: Fully supported (x64 tested).
  - The distributed package contains a bundled Python backend (`api.exe`), so Python installation is **not required** for the end user.
  - Just share the `win-unpacked` folder (or the installer if configured).

- **Mac/Linux**:
  - Currently, the build configuration is optimized for Windows (`api.exe`).
  - To support Mac/Linux, the Python backend must be packaged for those platforms (e.g., using PyInstaller on a Mac machine to generate a binary), and `electron-builder` configuration needs adjustment.

### How to Build (For Developers)

1. **Prerequisites**: Node.js and Python installed.
2. **Setup**:
    ```bash
    npm install
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    ```
3. **Build Command**:
    ```bash
    npm run package
    ```
    Output will be in `release_build/win-unpacked`.

## Sharing Source Code

To share this project on GitHub or other platforms:

1. **Exclude**:
   - `node_modules/`
   - `release/`, `release_build/`
   - `dist/`, `frontend/dist/`
   - `backend/venv/`
   - `backend/build/`, `backend/dist/`
   - `.git/` (if copying manually)
   - Personal/Work folders (e.g., `初期構想`, `その他`) if they contain sensitive info.

2. **Include**:
   - `electron/`
   - `frontend/` (src, public, config files)
   - `backend/` (source code, requirements.txt)
   - `package.json`, `tsconfig.json` etc.
   - `README.md`
   - `.gitignore`
