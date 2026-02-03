from PIL import Image, ExifTags
import io

def run_extract(file_data: bytes) -> dict:
    """
    Extracts image metadata using Pillow.
    Returns None if not a valid image.
    """
    try:
        with Image.open(io.BytesIO(file_data)) as img:
            meta = {
                "format": img.format,
                "mode": img.mode,
                "size": f"{img.width}x{img.height}",
                "exif": {}
            }
            
            # Basic Exif Extraction
            exif_data = img.getexif()
            if exif_data:
                exif_dict = {}
                for tag_id, value in exif_data.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    # Helper to make data JSON serializable
                    if isinstance(value, bytes):
                        try:
                            value = value.decode()
                        except:
                            value = str(value)
                    exif_dict[str(tag)] = str(value)
                meta["exif"] = exif_dict
            return meta
    except Exception:
        return None
