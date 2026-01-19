import base64

def run_encode(data: bytes) -> bytes:
    """
    Encodes bytes to Base64 bytes.
    """
    return base64.b64encode(data)

def run_decode(data: bytes) -> bytes:
    """
    Decodes Base64 bytes to raw bytes.
    Returns empty bytes if input is invalid basic check (or lets error propagate,
    but we want to be safe).
    For now, let's allow errors to propagate so the UI sees them, 
    or catch and return valid indicator.
    
    The philosophy says "Plugins usually don't fail, they return empty".
    However, for explicit decode tool, seeing the error is useful.
    Let's try standard decode.
    """
    try:
        # validate validation or just try
        return base64.b64decode(data, validate=True)
    except Exception:
        # For a "Tool", returning empty might be confusing if user typed garbage.
        # But per philosophy "Success/Fail -> Result/Empty", let's return empty for now
        # or handle in wrapper. 
        # Let's return raw result and let wrapper handle exception -> text.
        raise
