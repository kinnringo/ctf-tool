import { useState } from 'react';
import { ENCODERS, type EncoderType } from '../utils/encoders';

const ENCODER_KEYS = Object.keys(ENCODERS) as EncoderType[];

const CryptoTool = () => {
    const [selectedEncoder, setSelectedEncoder] = useState<EncoderType>('base64');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [rotN, setRotN] = useState(13);
    const [key, setKey] = useState('');

    const encoder = ENCODERS[selectedEncoder];

    const handleEncode = () => {
        setError('');
        try {
            const opts: any = {};
            if (encoder.needsRotN) opts.n = rotN;
            if (encoder.needsKey) opts.key = key;
            setOutput(encoder.encode(input, opts));
        } catch (e: any) {
            setError(e.message || e.toString());
        }
    };

    const handleDecode = () => {
        setError('');
        try {
            const opts: any = {};
            if (encoder.needsRotN) opts.n = rotN;
            if (encoder.needsKey) opts.key = key;
            setOutput(encoder.decode(input, opts));
        } catch (e: any) {
            setError(e.message || e.toString());
        }
    };

    const handleSwap = () => {
        setInput(output);
        setOutput('');
        setError('');
    };

    const handleClear = () => {
        setInput('');
        setOutput('');
        setError('');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Encode / Decode</h2>

            {/* Encoder selector */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                justifyContent: 'center',
                marginBottom: '20px',
                padding: '10px',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333'
            }}>
                {ENCODER_KEYS.map(k => (
                    <button
                        key={k}
                        onClick={() => { setSelectedEncoder(k); setError(''); }}
                        style={{
                            padding: '6px 14px',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            border: selectedEncoder === k ? '1px solid #00ff7f' : '1px solid #555',
                            background: selectedEncoder === k ? 'rgba(0, 255, 127, 0.15)' : '#2a2a2a',
                            color: selectedEncoder === k ? '#00ff7f' : '#ccc',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {ENCODERS[k].label}
                    </button>
                ))}
            </div>

            {/* Extra controls: ROT-N slider or Key input */}
            {encoder.needsRotN && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '15px',
                    padding: '10px 15px',
                    background: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #333'
                }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        Shift (N):
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={25}
                        value={rotN}
                        onChange={e => setRotN(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        color: '#00ff7f',
                        minWidth: '30px',
                        textAlign: 'center'
                    }}>
                        {rotN}
                    </span>
                    <button
                        onClick={() => setRotN(13)}
                        style={{
                            padding: '3px 10px',
                            fontSize: '0.8rem',
                            background: '#333',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#ccc',
                            cursor: 'pointer'
                        }}
                    >
                        ROT13
                    </button>
                </div>
            )}

            {encoder.needsKey && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '15px',
                    padding: '10px 15px',
                    background: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #333'
                }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Key:</label>
                    <input
                        type="text"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder={selectedEncoder === 'xor' ? 'XOR key...' : 'Vigenère key (letters only)...'}
                        style={{
                            flex: 1,
                            padding: '6px 10px',
                            background: '#222',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                            fontFamily: 'monospace'
                        }}
                    />
                </div>
            )}

            {/* Main I/O area */}
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Input..."
                    rows={6}
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        background: '#1e1e1e',
                        color: '#e0e0e0',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        resize: 'vertical'
                    }}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={handleEncode} style={{
                        padding: '8px 20px',
                        background: 'rgba(0, 255, 127, 0.15)',
                        border: '1px solid #00ff7f',
                        color: '#00ff7f',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Encode ↓
                    </button>
                    <button onClick={handleDecode} style={{
                        padding: '8px 20px',
                        background: 'rgba(100, 149, 237, 0.15)',
                        border: '1px solid #6495ED',
                        color: '#6495ED',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Decode ↓
                    </button>
                    <button onClick={handleSwap} style={{
                        padding: '8px 16px',
                        background: '#333',
                        border: '1px solid #555',
                        color: '#ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Swap ↑
                    </button>
                    <button onClick={handleClear} style={{
                        padding: '8px 16px',
                        background: '#333',
                        border: '1px solid #555',
                        color: '#ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}>
                        Clear
                    </button>
                </div>

                <textarea
                    value={output}
                    readOnly
                    placeholder="Output..."
                    rows={6}
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        background: '#111',
                        color: '#e0e0e0',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        resize: 'vertical'
                    }}
                />

                {error && (
                    <div style={{
                        color: '#ff6b6b',
                        padding: '8px 12px',
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                    }}>
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CryptoTool;
