from PIL import Image, ImageChops
import os
import glob

def trim(im):
    # Get the top-left pixel color as the background color
    bg_color = im.getpixel((0, 0))
    bg = Image.new(im.mode, im.size, bg_color)
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    # Bounding box of the non-background area
    bbox = diff.getbbox()
    if bbox:
        # Pad the bbox slightly to avoid cutting off anti-aliasing edges (optional, let's leave 5px margin)
        left, upper, right, lower = bbox
        margin = 10
        left = max(0, left - margin)
        upper = max(0, upper - margin)
        right = min(im.width, right + margin)
        lower = min(im.height, lower + margin)
        return im.crop((left, upper, right, lower))
    return im

folders = ["stage 1", "stage 2", "stage 3"]
extensions = ["*.png", "*.jpg", "*.jpeg", "*.PNG", "*.JPG"]

for folder in folders:
    for ext in extensions:
        files = glob.glob(os.path.join(folder, ext))
        for file in files:
            print(f"Processing {file}...")
            try:
                im = Image.open(file)
                # Convert to RGB to ensure getpixel works predictably if it has an alpha channel
                if im.mode == 'RGBA':
                    # Create a white background image
                    background = Image.new('RGBA', im.size, (255, 255, 255, 255))
                    # Paste the image on top of the background
                    im = Image.alpha_composite(background, im).convert('RGB')
                elif im.mode != 'RGB':
                    im = im.convert('RGB')
                    
                cropped = trim(im)
                if cropped.size != im.size:
                    cropped.save(file)
                    print(f"Cropped {file} from {im.size} to {cropped.size}")
                else:
                    print(f"No cropping needed for {file}")
            except Exception as e:
                print(f"Failed to process {file}: {e}")
