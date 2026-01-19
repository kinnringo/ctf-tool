import re

def run_extract(data: bytes) -> list[str]:
    """
    Extracts printable strings (ASCII and UTF-16LE) from raw bytes.
    Min length: 4
    Returns a unique list of strings to avoid clutter.
    """
    min_len = 4
    
    # 1. ASCII Strings
    # Regex: 4 or more printable chars (0x20-0x7E)
    ascii_pattern = re.compile(rb'[\x20-\x7E]{' + str(min_len).encode() + rb',}')
    ascii_strings = [m.decode('ascii') for m in ascii_pattern.findall(data)]
    
    # 2. Unicode (UTF-16LE) Strings
    # Regex: 4 or more (printable char + null byte)
    # Note: This is a heuristic for basic Windows UTF-16LE
    unicode_pattern = re.compile(rb'(?:[\x20-\x7E]\x00){' + str(min_len).encode() + rb',}')
    unicode_strings = [m.decode('utf-16le') for m in unicode_pattern.findall(data)]
    
    # Combine and deduplicate while preserving order roughly
    combined = ascii_strings + unicode_strings
    
    # Limit number of results for safety (e.g., 1000 max)
    # and remove duplicates
    seen = set()
    unique_result = []
    for s in combined:
        if s not in seen:
            seen.add(s)
            unique_result.append(s)
            
    # Max return 1000 lines to prevent UI freeze on large files
    return unique_result[:1000]
