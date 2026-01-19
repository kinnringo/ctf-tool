import { useState } from 'react';

const Base64Tool = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    const handleEncode = async () => {
        setError('');
        try {
            const res = await window.api.base64.encode(input);
            if (res.result) {
                setOutput(res.result);
            } else {
                setError(JSON.stringify(res));
            }
        } catch (e: any) {
            setError(e.toString());
        }
    };

    const handleDecode = async () => {
        setError('');
        try {
            const res = await window.api.base64.decode(input);
            if (res.result) {
                setOutput(res.result);
                if (res.is_binary) {
                    setError('Warning: Result is binary data (shown as string representation)');
                }
            } else if (res.error) {
                setError(res.error);
            } else {
                setError(JSON.stringify(res));
            }
        } catch (e: any) {
            setError(e.toString());
        }
    };

    // Helper to swap input/output for quick re-encoding
    const handleSwap = () => {
        setInput(output);
        setOutput('');
        setError('');
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ textAlign: 'center' }}>Base64 Tool</h2>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Input text..."
                    rows={6}
                    style={{ width: '100%', padding: '10px' }}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={handleEncode}>Encode ↓</button>
                    <button onClick={handleDecode}>Decode ↓</button>
                    <button onClick={handleSwap}>Swap ↑</button>
                    <button onClick={() => { setInput(''); setOutput(''); setError(''); }}>Clear</button>
                </div>

                <textarea
                    value={output}
                    readOnly
                    placeholder="Output..."
                    rows={6}
                    style={{ width: '100%', padding: '10px', background: '#f5f5f5', color: 'black' }}
                />

                {error && (
                    <div style={{ color: 'red', marginTop: '10px' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Base64Tool;
