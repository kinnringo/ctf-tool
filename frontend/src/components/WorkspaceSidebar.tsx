import React, { useState } from 'react';

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: TreeNode[];
}

interface WorkspaceSidebarProps {
    onFileSelect: (filePath: string, fileName: string, base64Data: string) => void;
}

const WorkspaceSidebar = ({ onFileSelect }: WorkspaceSidebarProps) => {
    const [folderPath, setFolderPath] = useState<string | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);

    // Hover color constant for easy adjustment
    const HOVER_BG_COLOR = '#999';
    const DRAG_BG_COLOR = '#333';

    const handleOpenFolder = async () => {
        const result = await window.api.workspace.openFolder();
        if (!result.canceled && result.path) {
            setFolderPath(result.path);
            await refreshTree(result.path);
        }
    };

    const handleOpenFile = async () => {
        const result = await window.api.workspace.openFile();
        if (!result.canceled && result.path) {
            // Display single file as a tree item
            setFolderPath(result.path); // Set path as "root" context
            // Create a pseudo-tree with just that file
            const fileName = result.path.replace(/\\/g, '/').split('/').pop() || 'file';
            setTree([{
                name: fileName,
                path: result.path,
                isDirectory: false
            }]);

            // Also load it immediately
            loadFile(result.path);
        }
    };

    const loadFile = async (path: string) => {
        setLoading(true);
        const result = await window.api.workspace.readFile(path);
        if (result.result) {
            onFileSelect(path, result.fileName, result.result);
        } else if (result.error) {
            console.error('Failed to load file:', result.error);
        }
        setLoading(false);
    };

    const refreshTree = async (path: string) => {
        setLoading(true);
        const result = await window.api.workspace.readTree(path);
        if (result.result) {
            setTree(result.result);
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        if (folderPath) {
            refreshTree(folderPath);
        }
    };

    const handleFileClick = async (node: TreeNode) => {
        if (node.isDirectory) {
            setExpandedPaths(prev => {
                const next = new Set(prev);
                if (next.has(node.path)) {
                    next.delete(node.path);
                } else {
                    next.add(node.path);
                }
                return next;
            });
        } else {
            await loadFile(node.path);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        let path = '';

        // Use Electron's webUtils.getPathForFile for robust path extraction
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            try {
                path = window.api.workspace.getPathForFile(file);
            } catch (err) {
                // Fallback to file.name if getPathForFile fails
                console.error('getPathForFile failed:', err);
                path = file.name;
            }
        }

        if (path) {
            try {
                // Try to read as folder first
                const treeRes = await window.api.workspace.readTree(path);

                // If readTree succeeded (result exists), it is a FOLDER.
                if (treeRes.result) {
                    setFolderPath(path);
                    setTree(treeRes.result);
                } else {
                    // It failed (likely ENOTDIR), so it is a file.
                    throw new Error('Not a directory');
                }
            } catch (err) {
                // Assume it is a file
                // Get filename from path
                const parts = path.split(/[\\/]/);
                const name = parts.pop() || path;

                setFolderPath(path);
                setTree([{
                    name: name,
                    path: path,
                    isDirectory: false
                }]);
                loadFile(path);
            }
        }
    };

    const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode[] => {
        return nodes.map(node => (
            <div key={node.path}>
                <div
                    onClick={() => handleFileClick(node)}
                    style={{
                        padding: `4px 8px 4px ${depth * 16 + 8}px`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = HOVER_BG_COLOR}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <span>{node.isDirectory ? (expandedPaths.has(node.path) ? '📂' : '📁') : '📄'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.name}
                    </span>
                </div>
                {node.isDirectory && expandedPaths.has(node.path) && node.children && (
                    <div>{renderTree(node.children, depth + 1)}</div>
                )}
            </div>
        ));
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: isDragging ? DRAG_BG_COLOR : 'transparent',
                transition: 'background 0.2s',
                borderRight: '1px solid #444'
            }}
        >
            <div style={{ padding: '8px', borderBottom: '1px solid #444', display: 'flex', gap: '4px' }}>
                <button onClick={handleOpenFolder} title="Open Folder" style={{ flex: 1, padding: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    📂 Folder
                </button>
                <button onClick={handleOpenFile} title="Open File" style={{ flex: 1, padding: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    📄 File
                </button>
                <button onClick={handleRefresh} disabled={!folderPath} title="Refresh" style={{ padding: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <b>⟳</b>
                </button>
            </div>

            {folderPath && (
                <div style={{ padding: '8px', fontSize: '0.75rem', color: '#aaa', borderBottom: '1px solid #444', wordBreak: 'break-all' }}>
                    {folderPath.length > 30 ? '...' + folderPath.slice(-30) : folderPath}
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#888' }}>Loading...</div>
                ) : tree.length > 0 ? (
                    renderTree(tree)
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.8rem', lineHeight: '1.5' }}>
                        No Folder/File<br />Selected<br /><br />(Drag & Drop)<br />Supported
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceSidebar;
