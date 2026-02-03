import { useState, useEffect, useRef } from 'react';

interface SelectedFile {
    path: string;
    name: string;
    base64: string;
}

interface FileToolProps {
    selectedFile?: SelectedFile | null;
    onClearSelection?: () => void;
}

const FileTool = ({ selectedFile, onClearSelection }: FileToolProps) => {
    const [fileName, setFileName] = useState<string>('');
    const [result, setResult] = useState<any>(null);
    const [strings, setStrings] = useState<string[] | null>(null);
    const [entropy, setEntropy] = useState<number | null>(null);
    const [entropyGraph, setEntropyGraph] = useState<number[] | null>(null);
    const [scanResults, setScanResults] = useState<any[] | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [pendingBase64, setPendingBase64] = useState<string | null>(null);
    const [pendingFileObject, setPendingFileObject] = useState<File | null>(null); // To get path for DnD files
    const [isDragging, setIsDragging] = useState(false);

    // Hex Viewer state
    const [hexData, setHexData] = useState<Uint8Array | null>(null);
    const [hexHeight, setHexHeight] = useState(600);
    const [hexSearch, setHexSearch] = useState('');
    const [hexSearchIndex, setHexSearchIndex] = useState(0);
    const hexViewRef = useRef<HTMLDivElement>(null);

    // Strings Viewer state
    const [stringsHeight, setStringsHeight] = useState(400);
    const [stringsSearch, setStringsSearch] = useState('');
    const [stringsSearchIndex, setStringsSearchIndex] = useState(0);
    const stringsViewRef = useRef<HTMLDivElement>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Constants
    const BYTES_PER_ROW = 16;
    const HEIGHT_STEP = 100;
    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = 1000;

    // Handle file selection from workspace sidebar
    useEffect(() => {
        if (selectedFile) {
            setResult(null);
            setStrings(null);
            setEntropy(null);
            setEntropyGraph(null);
            setScanResults(null);
            setMetadata(null);
            setError('');
            setFileName(selectedFile.name);
            setPendingBase64(selectedFile.base64);
            setPendingFileObject(null); // Workspace selection overrides pending file
        }
    }, [selectedFile]);

    const runAnalysis = async (base64Data: string) => {
        setError('');
        try {
            // Determine file path for metadata
            let filePath: string | undefined = undefined;
            if (selectedFile) {
                filePath = selectedFile.path;
            } else if (pendingFileObject) {
                // Try to get path from File object (Electron specific)
                filePath = window.api.workspace.getPathForFile(pendingFileObject);
            }

            const res = await window.api.forensics.analyzeFile(base64Data);
            if (res.error) {
                setError(res.error);
            } else {
                setResult(res);

                const [strRes, entRes, graphRes, scanRes, metaRes] = await Promise.all([
                    window.api.forensics.extractStrings(base64Data),
                    window.api.forensics.calculateEntropy(base64Data),
                    window.api.forensics.calculateEntropyGraph(base64Data),
                    window.api.forensics.scanFile(base64Data),
                    window.api.forensics.getMetadata(base64Data, filePath)
                ]);

                if (strRes.result) setStrings(strRes.result);
                if (entRes.result !== undefined) setEntropy(entRes.result);
                if (graphRes.result) setEntropyGraph(graphRes.result);
                if (scanRes.result) setScanResults(scanRes.result);
                if (metaRes.result) setMetadata(metaRes.result);

                // Decode base64 to Uint8Array for Hex Viewer
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                setHexData(bytes);
            }
        } catch (err: any) {
            setError(err.toString());
        }
        setPendingBase64(null);
    };

    const handleAnalyzeClick = () => {
        if (pendingBase64) {
            runAnalysis(pendingBase64);
        }
    };

    const handleClear = () => {
        setFileName('');
        setResult(null);
        setStrings(null);
        setEntropy(null);
        setEntropyGraph(null);
        setScanResults(null);
        setMetadata(null);
        setError('');
        setPendingBase64(null);
        setPendingFileObject(null);
        setHexData(null);
        setHexSearch('');
        setStringsSearch('');
        if (onClearSelection) onClearSelection();
    };

    // Helper to highlight search matches
    const highlightText = (text: string, search: string, baseColor: string) => {
        if (!search) return <span style={{ color: baseColor }}>{text}</span>;
        const searchLower = search.toLowerCase();
        const textLower = text.toLowerCase();
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let matchIndex = textLower.indexOf(searchLower);
        let key = 0;
        while (matchIndex !== -1) {
            if (matchIndex > lastIndex) {
                parts.push(<span key={key++} style={{ color: baseColor }}>{text.slice(lastIndex, matchIndex)}</span>);
            }
            parts.push(<span key={key++} style={{ background: '#ff0', color: '#000' }}>{text.slice(matchIndex, matchIndex + search.length)}</span>);
            lastIndex = matchIndex + search.length;
            matchIndex = textLower.indexOf(searchLower, lastIndex);
        }
        if (lastIndex < text.length) {
            parts.push(<span key={key++} style={{ color: baseColor }}>{text.slice(lastIndex)}</span>);
        }
        return <>{parts}</>;
    };

    // Hex Viewer rendering
    const renderHexView = () => {
        if (!hexData) return null;

        const rows: React.ReactNode[] = [];
        const matchingRows: number[] = [];
        const searchLower = hexSearch.toLowerCase();

        for (let rowIdx = 0; rowIdx < Math.ceil(hexData.length / BYTES_PER_ROW); rowIdx++) {
            const rowStart = rowIdx * BYTES_PER_ROW;
            const rowEnd = Math.min(rowStart + BYTES_PER_ROW, hexData.length);
            const rowBytes = hexData.slice(rowStart, rowEnd);

            const offsetHex = rowStart.toString(16).toUpperCase().padStart(8, '0');

            let hexStr = '';
            for (let i = 0; i < BYTES_PER_ROW; i++) {
                if (i < rowBytes.length) {
                    hexStr += rowBytes[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
                } else {
                    hexStr += '   ';
                }
                if (i === 7) hexStr += ' ';
            }

            let asciiStr = '';
            for (let i = 0; i < rowBytes.length; i++) {
                const byte = rowBytes[i];
                asciiStr += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
            }

            const isMatch = hexSearch && (hexStr.toLowerCase().includes(searchLower) || asciiStr.toLowerCase().includes(searchLower));
            if (isMatch) matchingRows.push(rowIdx);

            const isCurrentMatch = hexSearch && matchingRows.length > 0 && matchingRows[hexSearchIndex] === rowIdx;

            rows.push(
                <div
                    key={rowIdx}
                    id={`hex-row-${rowIdx}`}
                    style={{
                        display: 'flex',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        background: isCurrentMatch ? 'rgba(255, 255, 0, 0.2)' : 'transparent'
                    }}
                >
                    <span style={{ color: '#888', minWidth: '80px' }}>{offsetHex}</span>
                    <span style={{ minWidth: '400px', letterSpacing: '0.5px' }}>{highlightText(hexStr, hexSearch, '#0f0')}</span>
                    <span>{highlightText(asciiStr, hexSearch, '#aaa')}</span>
                </div>
            );
        }

        const matchCount = matchingRows.length;
        const currentIdx = hexSearchIndex >= matchCount ? 0 : hexSearchIndex;

        const goToMatch = (idx: number) => {
            setHexSearchIndex(idx);
            const row = matchingRows[idx];
            const el = document.getElementById(`hex-row-${row}`);
            if (el && hexViewRef.current) {
                el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        };

        return (
            <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                            Total: {hexData.length} bytes ({(hexData.length / 1024).toFixed(2)} KB)
                        </span>
                        <input
                            type="text"
                            placeholder="検索..."
                            value={hexSearch}
                            onChange={(e) => { setHexSearch(e.target.value); setHexSearchIndex(0); }}
                            style={{ padding: '4px 8px', fontSize: '0.85rem', background: '#222', border: '1px solid #555', borderRadius: '4px', color: '#fff', maxWidth: '150px' }}
                        />
                        {hexSearch && (
                            <>
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                                    {matchCount > 0 ? `${currentIdx + 1}/${matchCount}` : '0/0'}
                                </span>
                                <button onClick={() => goToMatch((currentIdx - 1 + matchCount) % matchCount)} disabled={matchCount === 0} style={{ padding: '2px 6px' }}>▲</button>
                                <button onClick={() => goToMatch((currentIdx + 1) % matchCount)} disabled={matchCount === 0} style={{ padding: '2px 6px' }}>▼</button>
                            </>
                        )}
                    </div>
                    <div
                        ref={hexViewRef}
                        style={{
                            background: '#111',
                            padding: '10px',
                            border: '1px solid #444',
                            borderRadius: '5px',
                            overflowX: 'auto',
                            height: `${hexHeight}px`,
                            overflowY: 'auto'
                        }}
                    >
                        {rows}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => setHexHeight(h => Math.min(MAX_HEIGHT, h + HEIGHT_STEP))}
                        disabled={hexHeight >= MAX_HEIGHT}
                        style={{ padding: '4px 8px', fontSize: '1rem' }}
                        title="表示領域を拡大"
                    >+</button>
                    <button
                        onClick={() => setHexHeight(h => Math.max(MIN_HEIGHT, h - HEIGHT_STEP))}
                        disabled={hexHeight <= MIN_HEIGHT}
                        style={{ padding: '4px 8px', fontSize: '1rem' }}
                        title="表示領域を縮小"
                    >−</button>
                </div>
            </div>
        );
    };

    // Strings rendering with search
    const renderStringsView = () => {
        if (!strings) return null;

        const searchLower = stringsSearch.toLowerCase();
        const matchingIndices: number[] = [];

        strings.forEach((s, idx) => {
            if (stringsSearch && s.toLowerCase().includes(searchLower)) {
                matchingIndices.push(idx);
            }
        });

        const matchCount = matchingIndices.length;
        const currentIdx = stringsSearchIndex >= matchCount ? 0 : stringsSearchIndex;

        const goToMatch = (idx: number) => {
            setStringsSearchIndex(idx);
            const lineIdx = matchingIndices[idx];
            const el = document.getElementById(`string-line-${lineIdx}`);
            if (el && stringsViewRef.current) {
                el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        };

        return (
            <div style={{ display: 'flex', gap: '5px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="検索..."
                            value={stringsSearch}
                            onChange={(e) => { setStringsSearch(e.target.value); setStringsSearchIndex(0); }}
                            style={{ padding: '4px 8px', fontSize: '0.85rem', background: '#222', border: '1px solid #555', borderRadius: '4px', color: '#fff', maxWidth: '150px' }}
                        />
                        {stringsSearch && (
                            <>
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                                    {matchCount > 0 ? `${currentIdx + 1}/${matchCount}` : '0/0'}
                                </span>
                                <button onClick={() => goToMatch((currentIdx - 1 + matchCount) % matchCount)} disabled={matchCount === 0} style={{ padding: '2px 6px' }}>▲</button>
                                <button onClick={() => goToMatch((currentIdx + 1) % matchCount)} disabled={matchCount === 0} style={{ padding: '2px 6px' }}>▼</button>
                            </>
                        )}
                    </div>
                    <div
                        ref={stringsViewRef}
                        style={{
                            background: '#111',
                            color: '#ccc',
                            padding: '10px',
                            height: `${stringsHeight}px`,
                            overflowY: 'auto',
                            border: '1px solid #444',
                            borderRadius: '5px',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                        }}
                    >
                        {strings.length > 0 ? strings.map((s, idx) => {
                            const isMatch = stringsSearch && s.toLowerCase().includes(searchLower);
                            const isCurrentMatch = stringsSearch && matchingIndices.length > 0 && matchingIndices[stringsSearchIndex] === idx;
                            return (
                                <div
                                    key={idx}
                                    id={`string-line-${idx}`}
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        background: isCurrentMatch ? 'rgba(255, 255, 0, 0.2)' : 'transparent'
                                    }}
                                >
                                    {isMatch ? highlightText(s, stringsSearch, '#ccc') : s}
                                </div>
                            );
                        }) : "(No strings found)"}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => setStringsHeight(h => Math.min(MAX_HEIGHT, h + HEIGHT_STEP))}
                        disabled={stringsHeight >= MAX_HEIGHT}
                        style={{ padding: '4px 8px', fontSize: '1rem' }}
                        title="表示領域を拡大"
                    >+</button>
                    <button
                        onClick={() => setStringsHeight(h => Math.max(MIN_HEIGHT, h - HEIGHT_STEP))}
                        disabled={stringsHeight <= MIN_HEIGHT}
                        style={{ padding: '4px 8px', fontSize: '1rem' }}
                        title="表示領域を縮小"
                    >−</button>
                </div>
            </div>
        );
    };

    const processFile = (file: File) => {
        setError('');
        setResult(null);
        setStrings(null);
        setEntropy(null);
        setEntropyGraph(null);
        setEntropyGraph(null);
        setScanResults(null);
        setMetadata(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            const content = reader.result as string;
            const base64Raw = content.split(',')[1];
            setPendingBase64(base64Raw);
            setPendingFileObject(file);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    // Entropy graph drawing
    useEffect(() => {
        if (entropyGraph && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            const data = entropyGraph;

            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);

            ctx.beginPath();
            ctx.strokeStyle = '#00ff7f';
            ctx.lineWidth = 1;

            const stepX = width / (data.length - 1 || 1);

            for (let i = 0; i < data.length; i++) {
                const x = i * stepX;
                const val = data[i];
                const y = height - (val / 8.0) * height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 255, 127, 0.2)';
            ctx.fill();

            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            const y7 = height - (7.0 / 8.0) * height;
            ctx.beginPath();
            ctx.moveTo(0, y7);
            ctx.lineTo(width, y7);
            ctx.stroke();

            ctx.setLineDash([]);
        }
    }, [entropyGraph]);

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center' }}>File Analysis Tool</h2>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    marginBottom: '20px',
                    padding: '30px',
                    border: `2px dashed ${isDragging ? '#00ff7f' : '#444'}`,
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: isDragging ? 'rgba(0, 255, 127, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                }}
            >
                <label style={{ display: 'inline-block', padding: '8px 16px', background: '#b9b9b999', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
                    ファイルを選択
                    <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                <p style={{ margin: '10px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                    またはここにファイルをドラッグ&ドロップ
                </p>
                {fileName && <p style={{ marginTop: '10px' }}>Selected: {fileName}</p>}
                {pendingBase64 && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={handleAnalyzeClick} style={{ padding: '8px 24px' }}>
                            Analyze
                        </button>
                        <button onClick={handleClear} style={{ background: '#9999', padding: '8px 16px' }}>
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {error && <div style={{ color: 'red', textAlign: 'center' }}>Error: {error}</div>}

            {result && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ textAlign: 'center' }}>Analysis Result</h3>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#e0e0e0', color: '#000', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Property</th>
                                <th style={{ padding: '8px' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <td style={{ padding: '8px' }}>File Type</td>
                                <td style={{ padding: '8px' }}>{result.file_type || 'Unknown'}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <td style={{ padding: '8px' }}>Size</td>
                                <td style={{ padding: '8px' }}>{result.size} bytes</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <td style={{ padding: '8px' }}>Magic Number</td>
                                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{result.magic_hex}</td>
                            </tr>
                            {entropy !== null && (
                                <tr style={{ borderBottom: '1px solid #444' }}>
                                    <td style={{ padding: '8px' }}>Entropy</td>
                                    <td style={{ padding: '8px' }}>
                                        {entropy.toFixed(4)}
                                        <span style={{ marginLeft: '10px', color: entropy > 7.5 ? '#f55' : (entropy > 6 ? '#fa0' : '#5f5') }}>
                                            {entropy > 7.5 ? '(Very High - likely encrypted/compressed)' : (entropy > 6 ? '(High)' : '(Normal)')}
                                        </span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {metadata && (
                        <div style={{ marginTop: '30px' }}>
                            <h4>Metadata</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <tbody>
                                    {metadata.hashes && (
                                        <>
                                            <tr style={{ background: '#333', color: '#fff' }}><td colSpan={2} style={{ padding: '4px' }}><strong>Hashes</strong></td></tr>
                                            <tr><td style={{ padding: '4px', width: '100px' }}>MD5</td><td style={{ padding: '4px', fontFamily: 'monospace' }}>{metadata.hashes.md5}</td></tr>
                                            <tr><td style={{ padding: '4px' }}>SHA1</td><td style={{ padding: '4px', fontFamily: 'monospace' }}>{metadata.hashes.sha1}</td></tr>
                                            <tr><td style={{ padding: '4px' }}>SHA256</td><td style={{ padding: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{metadata.hashes.sha256}</td></tr>
                                        </>
                                    )}
                                    {metadata.timestamps && Object.keys(metadata.timestamps).length > 0 && (
                                        <>
                                            <tr style={{ background: '#333', color: '#fff' }}><td colSpan={2} style={{ padding: '4px' }}><strong>Timestamps (OS Dependent)</strong></td></tr>
                                            {Object.entries(metadata.timestamps).map(([key, val]) => (
                                                <tr key={key}>
                                                    <td style={{ padding: '4px', textTransform: 'capitalize' }}>{key}</td>
                                                    <td style={{ padding: '4px' }}>{String(val)}</td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                    {metadata.format_specific && (
                                        <>
                                            <tr style={{ background: '#333', color: '#fff' }}>
                                                <td colSpan={2} style={{ padding: '4px' }}>
                                                    <strong>Format Specific ({metadata.format_specific.type})</strong>
                                                </td>
                                            </tr>
                                            {Object.entries(metadata.format_specific.data).map(([key, val]) => {
                                                if (key === 'exif') return null; // Handle Exif separately at the end
                                                return (
                                                    <tr key={key}>
                                                        <td style={{ padding: '4px', textTransform: 'capitalize' }}>{key}</td>
                                                        <td style={{ padding: '4px' }}>{String(val)}</td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Special handling for Exif if present */}
                                            {metadata.format_specific.data.exif && Object.keys(metadata.format_specific.data.exif).length > 0 && (
                                                <>
                                                    <tr style={{ background: '#444', color: '#ddd' }}><td colSpan={2} style={{ padding: '4px', paddingLeft: '20px' }}><em>Exif Data</em></td></tr>
                                                    {Object.entries(metadata.format_specific.data.exif).map(([k, v]) => (
                                                        <tr key={k}>
                                                            <td style={{ padding: '4px', paddingLeft: '20px', fontSize: '0.9em' }}>{k}</td>
                                                            <td style={{ padding: '4px', fontSize: '0.9em', wordBreak: 'break-word' }}>{String(v)}</td>
                                                        </tr>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {entropyGraph && (
                        <div style={{ marginTop: '30px' }}>
                            <h4>Local Entropy Graph (Distribution)</h4>
                            <canvas
                                ref={canvasRef}
                                width={760}
                                height={150}
                                style={{ width: '100%', border: '1px solid #444', background: '#111', borderRadius: '5px' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#888' }}>
                                X: File Position, Y: Entropy (0-8). High spikes indicate compressed/encrypted chunks.
                            </p>
                        </div>
                    )}

                    {scanResults && scanResults.length > 0 && (
                        <div style={{ marginTop: '30px' }}>
                            <h4>Embedded Structures ({scanResults.length})</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ background: '#e0e0e0', color: '#000', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Offset (Hex)</th>
                                        <th style={{ padding: '8px' }}>Offset (Dec)</th>
                                        <th style={{ padding: '8px' }}>Type</th>
                                        <th style={{ padding: '8px' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scanResults.map((s: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #444' }}>
                                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{s.offset_hex}</td>
                                            <td style={{ padding: '8px' }}>{s.offset}</td>
                                            <td style={{ padding: '8px' }}>{s.name}</td>
                                            <td style={{ padding: '8px', color: '#888' }}>{s.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {strings && (
                        <div style={{ marginTop: '30px' }}>
                            <h4>Extracted Strings ({strings.length})</h4>
                            {renderStringsView()}
                        </div>
                    )}

                    {hexData && (
                        <div style={{ marginTop: '30px' }}>
                            <h4>Hex Viewer</h4>
                            {renderHexView()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileTool;
