from PIL import Image
import io

def run_extract(image_bytes: bytes) -> bytes:
    """
    Extracts LSB from image bytes.
    Converts image to RGB, iterates over pixels, collects LSBs from R, G, B channels,
    and assembles them into bytes.
    Returns raw bytes.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        width, height = img.size
        
        bits = []
        # Basic approach: Row by row, pixel by pixel, R->G->B
        # This is a common simple LSB pattern.
        pixels = list(img.getdata())
        
        for r, g, b in pixels:
            bits.append(r & 1)
            bits.append(g & 1)
            bits.append(b & 1)
            
        # Convert collected bits to bytes
        byte_output = bytearray()
        
        # Process 8 bits at a time
        for i in range(0, len(bits), 8):
            chunk = bits[i:i+8]
            if len(chunk) < 8:
                break
            
            val = 0
            for bit in chunk:
                val = (val << 1) | bit
            byte_output.append(val)
            
        return bytes(byte_output)
        
    except Exception as e:
        # In case of image load failure or other issues
        # Ideally we propagate error or return empty with log
        # For now, propagate to let the API layer handle it (500 or 400)
        raise ValueError(f"LSB Extraction failed: {str(e)}")
