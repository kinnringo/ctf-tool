import { useState, useEffect } from 'react'
import './App.css'
import CryptoTool from './components/CryptoTool';
import StegoTool from './components/StegoTool';
import FileTool from './components/FileTool';
import WorkspaceSidebar from './components/WorkspaceSidebar';

interface SelectedFile {
  path: string;
  name: string;
  base64: string;
}

function App() {
  const [health, setHealth] = useState<string>('Checking backend...');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'crypto' | 'stego' | 'file'>('crypto');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      window.api.checkBackendHealth()
        .then((res: any) => {
          if (res.status === 'ok') {
            setHealth('Connected');
            setIsConnected(true);
            clearInterval(interval);
          }
        })
        .catch(() => {
          setHealth('Connecting to Python...');
          setIsConnected(false);
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [])

  // Handle Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Limit min/max width
        const newWidth = Math.max(150, Math.min(e.clientX, 600));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleFileSelect = (filePath: string, fileName: string, base64Data: string) => {
    setSelectedFile({ path: filePath, name: fileName, base64: base64Data });
    setActiveTab('file'); // Switch to File tab when file is selected
  };

  const getButtonStyle = (tabName: string) => ({
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    borderBottom: activeTab === tabName ? '2px solid blue' : '2px solid transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: 'none', color: 'inherit', cursor: 'pointer',
    fontSize: '1.2rem'
  });

  return (
    <>
      <div className="status-bar" style={{
        padding: '5px 10px',
        background: isConnected ? '#e6ffe6' : '#ffe6e6',
        color: isConnected ? 'green' : 'red',
        textAlign: 'center',
        fontSize: '0.8rem',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000
      }}>
        Backend Status: {health}
      </div>

      <div style={{ display: 'flex', marginTop: '40px', height: 'calc(100vh - 40px)' }}>
        <div style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
          <WorkspaceSidebar onFileSelect={handleFileSelect} />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            width: '5px',
            cursor: 'col-resize',
            background: isResizing ? '#666' : '#333',
            transition: 'background 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#888'}
          onMouseLeave={(e) => !isResizing && (e.currentTarget.style.background = '#333')}
        />

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ccc', padding: '10px' }}>
            <button
              onClick={() => setActiveTab('crypto')}
              style={getButtonStyle('crypto')}
            >
              Crypto
            </button>
            <button
              onClick={() => setActiveTab('stego')}
              style={getButtonStyle('stego')}
            >
              Stego
            </button>
            <button
              onClick={() => setActiveTab('file')}
              style={getButtonStyle('file')}
            >
              File
            </button>
          </div>

          {activeTab === 'crypto' && <CryptoTool />}
          {activeTab === 'stego' && <StegoTool />}
          {activeTab === 'file' && <FileTool selectedFile={selectedFile} onClearSelection={() => setSelectedFile(null)} />}
        </div>
      </div>
    </>
  )
}

export default App

