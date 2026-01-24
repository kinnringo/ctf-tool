from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import base64
# Import feature logic
from features.crypto import base64 as base64_tool
from features.stego import lsb as stego_lsb

# Initialize FastAPI
app = FastAPI()

class EchoRequest(BaseModel):
    message: str

class Payload(BaseModel):
    data: str

@app.get("/health")
def health_check():
    return {"status": "ok", "python_version": sys.version}

@app.post("/echo")
def echo(data: EchoRequest):
    print(f"Received echo request: {data.message}")
    return {"response": f"Python received: {data.message}", "original": data.message}

# --- Base64 Endpoints ---

@app.post("/crypto/base64/encode")
def base64_encode(payload: Payload):
    # String (UI) -> Bytes (Core)
    try:
        raw_data = payload.data.encode('utf-8')
        encoded_bytes = base64_tool.run_encode(raw_data)
        # Bytes (Core) -> String (UI)
        return {"result": encoded_bytes.decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/crypto/base64/decode")
def base64_decode(payload: Payload):
    try:
        # String (UI input is base64 string) -> Bytes API
        raw_data = payload.data.encode('utf-8')
        decoded_bytes = base64_tool.run_decode(raw_data)
        # Bytes (Result) -> String (UI)
        try:
            return {"result": decoded_bytes.decode('utf-8'), "is_binary": False}
        except UnicodeDecodeError:
            return {"result": str(decoded_bytes), "is_binary": True}
    except Exception as e:
         return {"error": "Invalid Base64"} # Soft error

# --- Stego Endpoints ---

@app.post("/stego/lsb")
def stego_lsb_extract(payload: Payload):
    try:
        # 1. Receive Base64 Image String (from frontend file reader)
        # 2. Decode to Image Bytes
        image_data = base64.b64decode(payload.data)
        
        # 3. Process (Extract LSB) -> Returns Bytes
        extracted_bytes = stego_lsb.run_extract(image_data)
        
        # 4. Encode Result Bytes to Base64 String for Transport
        # The UI will decode this back to bytes and display as Hex/ASCII
        result_b64 = base64.b64encode(extracted_bytes).decode('utf-8')
        
        return {"result": result_b64}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Forensics Endpoints ---
from features.forensics import file_info, strings_tool, entropy, patterns

@app.post("/forensics/file")
def forensics_file_analyze(payload: Payload):
    try:
        # Transport: Base64 -> Bytes
        raw_bytes = base64.b64decode(payload.data)
        
        # Logic: Analyze
        analysis_result = file_info.run_analyze(raw_bytes)
        
        # Transport: JSON (Result is alrady a serializable dict)
        return analysis_result
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/forensics/strings")
def forensics_strings(payload: Payload):
    try:
        raw_bytes = base64.b64decode(payload.data)
        strings_list = strings_tool.run_extract(raw_bytes)
        return {"result": strings_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forensics/entropy")
def forensics_entropy(payload: Payload):
    try:
        raw_bytes = base64.b64decode(payload.data)
        entropy_val = entropy.run_calculate(raw_bytes)
        return {"result": entropy_val}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forensics/entropy/graph")
def forensics_entropy_graph(payload: Payload):
    try:
        raw_bytes = base64.b64decode(payload.data)
        entropy_series = entropy.run_calculate_series(raw_bytes, block_size=256)
        return {"result": entropy_series}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forensics/scan")
def forensics_scan(payload: Payload):
    try:
        raw_bytes = base64.b64decode(payload.data)
        scan_results = patterns.run_scan(raw_bytes)
        return {"result": scan_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MetadataRequest(BaseModel):
    data: str
    file_path: Optional[str] = None

@app.post("/forensics/metadata")
async def forensics_metadata(req: MetadataRequest):
    try:
        raw_data = base64.b64decode(req.data)
        result = file_info.run_metadata(raw_data, req.file_path)
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Electron will likely pass a port, or we hardcode for dev
    # Using 8000 for now
    uvicorn.run(app, host="127.0.0.1", port=8000)
