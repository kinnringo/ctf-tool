import math
from collections import Counter

def run_calculate(data: bytes) -> float:
    """
    Calculates Shannon Entropy of the byte data.
    Returns a float between 0.0 (constant) and 8.0 (random/encrypted).
    """
    if not data:
        return 0.0
        
    length = len(data)
    counts = Counter(data)
    
    entropy = 0.0
    for count in counts.values():
        probability = count / length
        entropy -= probability * math.log2(probability)
        
    return entropy

def run_calculate_series(data: bytes, block_size: int = 256) -> list[float]:
    """
    Calculates entropy for each block of data.
    Returns a list of entropy values.
    """
    if not data:
        return []
        
    results = []
    # Simple block iteration (non-overlapping for speed)
    for i in range(0, len(data), block_size):
        chunk = data[i:i + block_size]
        # Calculate entropy for this chunk
        # Re-use logic or call run_calculate (overhead?)
        # Let's inline for clarity in series
        if not chunk:
            continue
            
        length = len(chunk)
        counts = Counter(chunk)
        ent = 0.0
        for count in counts.values():
            p = count / length
            ent -= p * math.log2(p)
        results.append(ent)
        
    return results
