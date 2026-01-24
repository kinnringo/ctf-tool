import io
import pypdf
from datetime import datetime

def run_extract(file_data: bytes) -> dict:
    """
    Extracts PDF metadata using pypdf.
    Returns None if not a valid PDF.
    """
    try:
        # Check signature lightly to avoid heavy parsing if not PDF
        if not file_data.startswith(b'%PDF-'):
             return None

        reader = pypdf.PdfReader(io.BytesIO(file_data))
        info = reader.metadata
        
        if not info:
            return None

        meta = {}
        # Standard PDF keys
        keys_to_extract = ['/Title', '/Author', '/Subject', '/Producer', '/Creator', '/CreationDate', '/ModDate']
        
        for key in keys_to_extract:
            if key in info:
                # Remove slash from key name for cleaner UI (e.g. "/Author" -> "Author")
                clean_key = key.replace('/', '')
                value = info[key]
                
                # Handle PDF dates (e.g. D:20250627111832-07'00') if needed, 
                # but raw string is often fine for CTF. 
                # Let's keep it raw or basic cleanup if it's text.
                if isinstance(value, pypdf.generic.TextStringObject):
                    meta[clean_key] = str(value)
                elif isinstance(value, pypdf.generic.ByteStringObject):
                     try:
                         meta[clean_key] = value.decode('utf-8')
                     except:
                         meta[clean_key] = str(value)
                else:
                    meta[clean_key] = str(value)

        # Count pages
        try:
             meta["PageCount"] = len(reader.pages)
        except:
             pass

        if not meta:
            return None
            
        return meta

    except Exception:
        return None
