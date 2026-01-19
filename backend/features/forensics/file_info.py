import puremagic
import binascii

def run_analyze(file_data: bytes) -> dict:
    """
    Analyzes file bytes to determine file type using magic numbers.
    Returns a dictionary with detection results and raw data info.
    """
    result = {
        "detection_count": 0,
        "matches": [],
        "hex_preview": "",
        "size": len(file_data)
    }

    try:
        # Get simplified hex preview (first 16 bytes)
        # "89 50 4E 47 ..."
        header = file_data[:16]
        result["hex_preview"] = " ".join([f"{b:02X}" for b in header])

        # Use puremagic to detect
        # flexible_extensions=True allows showing potential extensions
        matches = puremagic.magic_string(file_data)
        
        # matches is a list of PureMagicResult or similar objects
        # e.g. [PureMagicResult(byte_match=b'\x89PNG\r\n\x1a\n', offset=0, extension='.png', mime_type='image/png', name='Portable Network Graphics', filename=None)]
        
        # Convert to dict for JSON serialization
        formatted_matches = []
        for match in matches:
             formatted_matches.append({
                 "extension": match.extension,
                 "mime": match.mime_type,
                 "name": match.name,
                 "offset": match.offset
             })
        
        result["matches"] = formatted_matches
        result["detection_count"] = len(formatted_matches)
        
    except puremagic.PureError:
        # No match found
        pass
    except Exception as e:
        result["error"] = str(e)

    return result
