import cv2
import numpy as np

def find_rings(image_path, map_num):
    print(f"--- Analyzing {image_path} ---")
    img = cv2.imread(image_path)
    if img is None:
        print(f"Could not load {image_path}")
        return

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # We are looking for white/light dashed rings. Let's threshold for bright pixels.
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    height, width = img.shape[:2]
    
    possible_centers = []
    
    for c in contours:
        # Calculate bounding box
        x, y, w, h = cv2.boundingRect(c)
        aspect_ratio = float(w) / h
        
        # A ring should be roughly square
        if 0.8 < aspect_ratio < 1.2:
            # It should be a reasonable size (e.g. 5% to 20% of image height)
            if 0.05 * height < h < 0.25 * height:
                cx = x + w/2
                cy = y + h/2
                cx_pct = (cx / width) * 100
                cy_pct = (cy / height) * 100
                possible_centers.append((cx_pct, cy_pct))
                
    # Print distinct centers (filter out duplicates that are very close)
    filtered = []
    for c in possible_centers:
        is_new = True
        for f in filtered:
            if abs(c[0]-f[0]) < 5 and abs(c[1]-f[1]) < 5:
                is_new = False
                break
        if is_new:
            filtered.append(c)
            
    for c in filtered:
        print(f"Found a potential ring at left: {c[0]:.1f}%, top: {c[1]:.1f}%")

find_rings('Orthoptics Street.png', 1)
find_rings('Eye Town.jpeg', 2)
find_rings('Squint Quay1.png', 3)
