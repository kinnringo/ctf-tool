# Common file signatures (Magic Bytes)
# Focus on formats that are often embedded or concatenated (CTF context)
SIGNATURES = [
    # Archives / Compressed
    {"name": "ZIP Archive", "magic": b"PK\x03\x04", "desc": "ZIP Local File Header"},
    {"name": "7z Archive", "magic": b"7z\xbc\xaf\x27\x1c", "desc": "7-Zip Archive"},
    {"name": "GZIP", "magic": b"\x1f\x8b\x08", "desc": "GZIP Compressed Data"},
    {"name": "RAR", "magic": b"Rar!\x1a\x07\x00", "desc": "RAR Archive"},
    {"name": "BZIP2", "magic": b"BZh", "desc": "BZIP2 Compressed Data"},
    
    # Images
    {"name": "PNG Image", "magic": b"\x89PNG\r\n\x1a\n", "desc": "PNG Header"},
    {"name": "JPEG Image", "magic": b"\xff\xd8\xff\xe0", "desc": "JPEG (JFIF)"},
    {"name": "JPEG Image", "magic": b"\xff\xd8\xff\xe1", "desc": "JPEG (Exif)"},
    {"name": "GIF Image", "magic": b"GIF89a", "desc": "GIF 89a"},
    {"name": "GIF Image", "magic": b"GIF87a", "desc": "GIF 87a"},
    
    # Documents
    {"name": "PDF Document", "magic": b"%PDF-", "desc": "PDF Header"},
    
    # Executables
    {"name": "ELF Executable", "magic": b"\x7fELF", "desc": "ELF Header (Linux)"},
    {"name": "Mach-O (64)", "magic": b"\xcf\xfa\xed\xfe", "desc": "Mach-O 64-bit"},
    {"name": "Mach-O (32)", "magic": b"\xce\xfa\xed\xfe", "desc": "Mach-O 32-bit"},
    
    # Others
    {"name": "Ogg Container", "magic": b"OggS", "desc": "Ogg Container"},
    {"name": "RIFF Container", "magic": b"RIFF", "desc": "RIFF Header (WAV/AVI)"},
]

def run_scan(data: bytes) -> list[dict]:
    """
    Scans the data for known file signatures.
    Returns a list of dicts with offset and description.
    No interpretation - just reports where patterns exist.
    """
    results = []
    
    for sig in SIGNATURES:
        magic = sig["magic"]
        start = 0
        while True:
            offset = data.find(magic, start)
            if offset == -1:
                break
            
            results.append({
                "offset": offset,
                "offset_hex": f"0x{offset:08X}",
                "name": sig["name"],
                "description": sig["desc"]
            })
            
            start = offset + 1
            
    # Sort by offset
    results.sort(key=lambda x: x["offset"])
    
    return results
