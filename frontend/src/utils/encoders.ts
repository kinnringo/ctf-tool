// ============================================================
// Encoding/Decoding utility functions for the Crypto tab
// All functions: (input: string, options?) => string
// ============================================================

// ---- Base64 ----
export function base64Encode(input: string): string {
    // Handle Unicode properly
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

export function base64Decode(input: string): string {
    const binary = atob(input.trim());
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

// ---- Base32 ----
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(input: string): string {
    const bytes = new TextEncoder().encode(input);
    let bits = '';
    for (const b of bytes) bits += b.toString(2).padStart(8, '0');
    // Pad to multiple of 5
    while (bits.length % 5 !== 0) bits += '0';
    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
        result += B32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
    }
    // Add padding
    while (result.length % 8 !== 0) result += '=';
    return result;
}

export function base32Decode(input: string): string {
    const clean = input.trim().replace(/=+$/, '').toUpperCase();
    let bits = '';
    for (const c of clean) {
        const idx = B32_ALPHABET.indexOf(c);
        if (idx === -1) throw new Error(`Invalid Base32 character: ${c}`);
        bits += idx.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// ---- Hex ----
export function hexEncode(input: string): string {
    const bytes = new TextEncoder().encode(input);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

export function hexDecode(input: string): string {
    const clean = input.trim().replace(/\s+/g, '').replace(/0x/gi, '');
    if (clean.length % 2 !== 0) throw new Error('Invalid hex: odd number of characters');
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
        const val = parseInt(clean.slice(i, i + 2), 16);
        if (isNaN(val)) throw new Error(`Invalid hex at position ${i}: ${clean.slice(i, i + 2)}`);
        bytes.push(val);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// ---- URL Encoding ----
export function urlEncode(input: string): string {
    return encodeURIComponent(input);
}

export function urlDecode(input: string): string {
    return decodeURIComponent(input.trim());
}

// ---- ROT-N (Caesar) ----
export function rotNEncode(input: string, n: number): string {
    return input.split('').map(c => {
        if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 + n) % 26 + 26) % 26 + 97);
        if (c >= 'A' && c <= 'Z') return String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26 + 26) % 26 + 65);
        return c;
    }).join('');
}

export function rotNDecode(input: string, n: number): string {
    return rotNEncode(input, -n);
}

// ---- Binary ↔ Text ----
export function binaryEncode(input: string): string {
    const bytes = new TextEncoder().encode(input);
    return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
}

export function binaryDecode(input: string): string {
    const clean = input.trim().replace(/\s+/g, ' ');
    const chunks = clean.split(' ');
    const bytes: number[] = [];
    for (const chunk of chunks) {
        if (!/^[01]+$/.test(chunk)) throw new Error(`Invalid binary: ${chunk}`);
        bytes.push(parseInt(chunk, 2));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// ---- ASCII ↔ Decimal ----
export function asciiEncode(input: string): string {
    const bytes = new TextEncoder().encode(input);
    return Array.from(bytes).map(b => b.toString(10)).join(' ');
}

export function asciiDecode(input: string): string {
    const clean = input.trim().replace(/\s+/g, ' ');
    const nums = clean.split(' ');
    const bytes: number[] = [];
    for (const n of nums) {
        const val = parseInt(n, 10);
        if (isNaN(val) || val < 0 || val > 255) throw new Error(`Invalid ASCII value: ${n}`);
        bytes.push(val);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// ---- XOR ----
export function xorEncode(input: string, key: string): string {
    if (!key) throw new Error('XOR key is required');
    const inputBytes = new TextEncoder().encode(input);
    const keyBytes = new TextEncoder().encode(key);
    const result: number[] = [];
    for (let i = 0; i < inputBytes.length; i++) {
        result.push(inputBytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    // Return as hex string (XOR output is usually binary)
    return result.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

export function xorDecode(input: string, key: string): string {
    if (!key) throw new Error('XOR key is required');
    // Input is hex string
    const clean = input.trim().replace(/\s+/g, '');
    const keyBytes = new TextEncoder().encode(key);
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 2) {
        const val = parseInt(clean.slice(i, i + 2), 16);
        if (isNaN(val)) throw new Error(`Invalid hex at position ${i}`);
        bytes.push(val ^ keyBytes[(i / 2) % keyBytes.length]);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
}

// ---- Morse Code ----
const MORSE_MAP: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/', '.': '.-.-.-', ',': '--..--',
    '?': '..--..', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
    "'": '.----.',
};
const MORSE_REVERSE: Record<string, string> = {};
for (const [k, v] of Object.entries(MORSE_MAP)) MORSE_REVERSE[v] = k;

export function morseEncode(input: string): string {
    return input.toUpperCase().split('').map(c => {
        if (MORSE_MAP[c]) return MORSE_MAP[c];
        if (c === ' ') return '/';
        return c; // passthrough unknown
    }).join(' ');
}

export function morseDecode(input: string): string {
    // Split by spaces, '/' or '|' as word separator
    const words = input.trim().split(/\s*[/|]\s*/);
    return words.map(word => {
        return word.trim().split(/\s+/).map(code => {
            return MORSE_REVERSE[code] || '?';
        }).join('');
    }).join(' ');
}

// ---- Atbash ----
export function atbashEncode(input: string): string {
    return input.split('').map(c => {
        if (c >= 'a' && c <= 'z') return String.fromCharCode(122 - c.charCodeAt(0) + 97);
        if (c >= 'A' && c <= 'Z') return String.fromCharCode(90 - c.charCodeAt(0) + 65);
        return c;
    }).join('');
}

// Atbash is its own inverse
export const atbashDecode = atbashEncode;

// ---- Vigenère ----
export function vigenereEncode(input: string, key: string): string {
    if (!key) throw new Error('Vigenère key is required');
    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyUpper) throw new Error('Key must contain at least one letter');
    let ki = 0;
    return input.split('').map(c => {
        if (c >= 'a' && c <= 'z') {
            const shift = keyUpper.charCodeAt(ki % keyUpper.length) - 65;
            ki++;
            return String.fromCharCode((c.charCodeAt(0) - 97 + shift) % 26 + 97);
        }
        if (c >= 'A' && c <= 'Z') {
            const shift = keyUpper.charCodeAt(ki % keyUpper.length) - 65;
            ki++;
            return String.fromCharCode((c.charCodeAt(0) - 65 + shift) % 26 + 65);
        }
        return c;
    }).join('');
}

export function vigenereDecode(input: string, key: string): string {
    if (!key) throw new Error('Vigenère key is required');
    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyUpper) throw new Error('Key must contain at least one letter');
    let ki = 0;
    return input.split('').map(c => {
        if (c >= 'a' && c <= 'z') {
            const shift = keyUpper.charCodeAt(ki % keyUpper.length) - 65;
            ki++;
            return String.fromCharCode(((c.charCodeAt(0) - 97 - shift) % 26 + 26) % 26 + 97);
        }
        if (c >= 'A' && c <= 'Z') {
            const shift = keyUpper.charCodeAt(ki % keyUpper.length) - 65;
            ki++;
            return String.fromCharCode(((c.charCodeAt(0) - 65 - shift) % 26 + 26) % 26 + 65);
        }
        return c;
    }).join('');
}

// ============================================================
// Registry — maps encoder names to functions
// ============================================================
export type EncoderType =
    | 'base64' | 'base32' | 'hex' | 'url' | 'rot-n'
    | 'binary' | 'ascii' | 'xor' | 'morse' | 'atbash' | 'vigenere';

export interface EncoderInfo {
    label: string;
    encode: (input: string, opts?: any) => string;
    decode: (input: string, opts?: any) => string;
    needsKey?: boolean;      // XOR, Vigenère
    needsRotN?: boolean;     // ROT-N slider
}

export const ENCODERS: Record<EncoderType, EncoderInfo> = {
    'base64': { label: 'Base64', encode: base64Encode, decode: base64Decode },
    'base32': { label: 'Base32', encode: base32Encode, decode: base32Decode },
    'hex': { label: 'Hex', encode: hexEncode, decode: hexDecode },
    'url': { label: 'URL Encoding', encode: urlEncode, decode: urlDecode },
    'rot-n': { label: 'ROT-N (Caesar)', encode: (i, o) => rotNEncode(i, o?.n ?? 13), decode: (i, o) => rotNDecode(i, o?.n ?? 13), needsRotN: true },
    'binary': { label: 'Binary', encode: binaryEncode, decode: binaryDecode },
    'ascii': { label: 'ASCII ↔ Dec', encode: asciiEncode, decode: asciiDecode },
    'xor': { label: 'XOR', encode: (i, o) => xorEncode(i, o?.key ?? ''), decode: (i, o) => xorDecode(i, o?.key ?? ''), needsKey: true },
    'morse': { label: 'Morse Code', encode: morseEncode, decode: morseDecode },
    'atbash': { label: 'Atbash', encode: atbashEncode, decode: atbashDecode },
    'vigenere': { label: 'Vigenère', encode: (i, o) => vigenereEncode(i, o?.key ?? ''), decode: (i, o) => vigenereDecode(i, o?.key ?? ''), needsKey: true },
};
