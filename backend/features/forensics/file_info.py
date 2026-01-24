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

import hashlib
import os
import datetime
from . import image_metadata, pdf_metadata

def run_metadata(file_data: bytes, file_path: str = None) -> dict:
    """
    Calculates file hashes, retrieves filesystem timestamps (if path provided),
    and attempts to extract format-specific metadata (Image, PDF).
    """
    result = {
        "hashes": {},
        "timestamps": {},
        "format_specific": None # { "type": "IMAGE"|"PDF", "data": {...} }
    }

    # 1. Hashes
    try:
        result["hashes"]["md5"] = hashlib.md5(file_data).hexdigest()
        result["hashes"]["sha1"] = hashlib.sha1(file_data).hexdigest()
        result["hashes"]["sha256"] = hashlib.sha256(file_data).hexdigest()
    except Exception as e:
        result["hashes"]["error"] = str(e)

    # 2. Timestamps (if path provided)
    if file_path and os.path.exists(file_path):
        try:
            stat = os.stat(file_path)
            # Timestamps are OS-dependent. usage in UI should note this.
            result["timestamps"]["created"] = datetime.datetime.fromtimestamp(stat.st_ctime).isoformat()
            result["timestamps"]["modified"] = datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
            result["timestamps"]["accessed"] = datetime.datetime.fromtimestamp(stat.st_atime).isoformat()
        except Exception as e:
            result["timestamps"]["error"] = str(e)

    # 3. Format Specific Metadata
    # Attempt Image
    img_meta = image_metadata.run_extract(file_data)
    if img_meta:
        result["format_specific"] = {
            "type": "Image",
            "data": img_meta
        }
    else:
        # Attempt PDF
        pdf_meta = pdf_metadata.run_extract(file_data)
        if pdf_meta:
            result["format_specific"] = {
                "type": "PDF",
                "data": pdf_meta
            }

    return result
