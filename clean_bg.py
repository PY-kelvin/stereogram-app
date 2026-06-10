import glob
from PIL import Image

def clean_background():
    files = glob.glob('stage 1/*.png')
    for f in files:
        img = Image.open(f).convert("RGBA")
        pixels = img.load()
        width, height = img.size
        
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                # If it's a very light gray/off-white (e.g., > 220), force it to pure white
                if r > 220 and g > 220 and b > 220:
                    pixels[x, y] = (255, 255, 255, a)
                    
        img.save(f)
        print(f"Cleaned {f}")

clean_background()
