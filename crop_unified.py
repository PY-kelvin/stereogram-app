import os
from PIL import Image

def get_bbox(img):
    pixels = img.load()
    width, height = img.size
    min_x = width
    min_y = height
    max_x = 0
    max_y = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if r < 250 or g < 250 or b < 250:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if min_x <= max_x and min_y <= max_y:
        return (min_x, min_y, max_x + 1, max_y + 1)
    return None

pairs = [
    ('New Stage 1/1a.png', 'New Stage 1/1b.png'),
    ('New Stage 1/2a.png', 'New Stage 1/2b.png'),
    ('New Stage 1/3a.png', 'New Stage 1/3b.png'),
    ('New Stage 1/4a.png', 'New Stage 1/4b.png'),
    ('New Stage 1/5a.png', 'New Stage 1/5b.png')
]

for a_path, b_path in pairs:
    if not os.path.exists(a_path) or not os.path.exists(b_path):
        continue
        
    img_a = Image.open(a_path).convert('RGB')
    img_b = Image.open(b_path).convert('RGB')
    
    bbox_a = get_bbox(img_a)
    bbox_b = get_bbox(img_b)
    
    if not bbox_a or not bbox_b:
        continue
        
    # Combine bounding boxes to preserve relative alignment
    min_x = min(bbox_a[0], bbox_b[0])
    min_y = min(bbox_a[1], bbox_b[1])
    max_x = max(bbox_a[2], bbox_b[2])
    max_y = max(bbox_a[3], bbox_b[3])
    
    pad = 40
    # Apply padding
    crop_box = (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(1920, max_x + pad),
        min(1080, max_y + pad)
    )
    
    # Crop both using the exact same box
    cropped_a = img_a.crop(crop_box)
    cropped_b = img_b.crop(crop_box)
    
    cropped_a.save(a_path)
    cropped_b.save(b_path)
    
    print(f"Processed pair {a_path}, unified bbox: {crop_box}")
