import { useState } from 'react';

const StegoTool = () => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
    const [error, setError] = useState<string>('');
    const [viewMode, setViewMode] = useState<'hex' | 'ascii'>('hex');
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file: File) => {
        setError('');
        setResultBytes(null);
        const reader = new FileReader();

        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
            const base64Raw = result.split(',')[1];
            setImageBase64(base64Raw);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

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

    const handleAnalyze = async () => {
        if (!imageBase64) return;
        setError('');
        try {
            const res = await window.api.stego.extractLsb(imageBase64);
            if (res.result) {
                const binaryString = atob(res.result);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                setResultBytes(bytes);
            } else if (res.error) {
                setError(res.error);
            }
        } catch (e: any) {
            setError(e.toString());
        }
    };

    const renderHex = (data: Uint8Array) => {
        let output = '';
        const limit = Math.min(data.length, 2048);
        for (let i = 0; i < limit; i++) {
            const hex = data[i].toString(16).padStart(2, '0');
            output += hex + ' ';
            if ((i + 1) % 16 === 0) output += '\n';
        }
        if (data.length > limit) output += `\n... (${data.length - limit} more bytes)`;
        return output;
    };

    const renderAscii = (data: Uint8Array) => {
        let output = '';
        const limit = Math.min(data.length, 4096);
        for (let i = 0; i < limit; i++) {
            const code = data[i];
            if (code >= 32 && code <= 126) {
                output += String.fromCharCode(code);
            } else {
                output += '.';
            }
        }
        if (data.length > limit) output += `\n... (${data.length - limit} more bytes)`;
        return output;
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center' }}>Stego LSB Tool</h2>

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
                    画像を選択
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
                <p style={{ margin: '10px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                    またはここに画像をドラッグ&ドロップ
                </p>
            </div>

            {imagePreview && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <img src={imagePreview} alt="Target" style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid #ccc' }} />
                    <div style={{ marginTop: '10px' }}>
                        <button onClick={handleAnalyze}>Extract LSB</button>
                    </div>
                </div>
            )}

            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}

            {resultBytes && (
                <div style={{ marginTop: '20px', textAlign: 'left' }}>
                    <h3>Result (Length: {resultBytes.length} bytes)</h3>
                    <div style={{ marginBottom: '5px' }}>
                        <label>
                            <input
                                type="radio"
                                name="viewmode"
                                checked={viewMode === 'hex'}
                                onChange={() => setViewMode('hex')}
                            /> Hex
                        </label>
                        <label style={{ marginLeft: '10px' }}>
                            <input
                                type="radio"
                                name="viewmode"
                                checked={viewMode === 'ascii'}
                                onChange={() => setViewMode('ascii')}
                            /> ASCII
                        </label>
                    </div>
                    <textarea
                        readOnly
                        value={viewMode === 'hex' ? renderHex(resultBytes) : renderAscii(resultBytes)}
                        rows={15}
                        style={{
                            width: '100%',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre',
                            background: '#222',
                            color: '#0f0',
                            padding: '10px'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default StegoTool;
