from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create image with transparent background
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # We will simulate a linear gradient from top-left (sweet pink #FF82B4) to bottom-right (peach #FFD296)
    grad = Image.new("RGBA", (100, 100))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(100):
        for x in range(100):
            factor = (x + y) / 200.0
            r = int(255)
            g = int(130 + (210 - 130) * factor)
            b = int(180 + (150 - 180) * factor)
            grad_draw.point((x, y), (r, g, b, 255))
            
    # Resize gradient to icon size
    grad_large = grad.resize((size, size), Image.Resampling.LANCZOS)
    
    # Create mask for rounded rectangle
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    padding = int(size * 0.05) # 5% padding
    corner_radius = int(size * 0.22) # rounded corners
    mask_draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding], 
        radius=corner_radius, 
        fill=255
    )
    
    background = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    background.paste(grad_large, (0, 0), mask)
    
    # 2. Draw Chinese text "四維" in the center (White)
    font_paths = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Cache/PingFang.ttc"
    ]
    font_path = None
    for p in font_paths:
        if os.path.exists(p):
            font_path = p
            break
            
    # Set font size relative to icon size
    font_size = int(size * 0.33)
    
    try:
        if font_path:
            # Index 4 in PingFang.ttc is usually PingFang-SC-Semibold or Bold
            font = ImageFont.truetype(font_path, font_size, index=4)
        else:
            font = ImageFont.load_default()
    except Exception as e:
        print("Error loading font collection index, falling back to index 0:", e)
        try:
            font = ImageFont.truetype(font_path, font_size, index=0)
        except:
            font = ImageFont.load_default()

    # Draw the text in the center
    text = "四維"
    text_draw = ImageDraw.Draw(background)
    
    # Calculate text bounding box to center it
    try:
        bbox = text_draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) / 2 - bbox[0]
        y = (size - text_height) / 2 - bbox[1]
    except AttributeError:
        text_width, text_height = text_draw.textsize(text, font=font)
        x = (size - text_width) / 2
        y = (size - text_height) / 2
        
    # Draw white text
    text_draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    return background

# Generate 192x192 and 512x512 icons
print("Generating PWA icons with '四維' text...")
icon_192 = create_icon(192)
icon_192.save("/Users/linqirui/pCloud Drive/Antigravity/Parenting-Form-Prefiller-PWA/icons/icon-192.png")
print("Saved icon-192.png")

icon_512 = create_icon(512)
icon_512.save("/Users/linqirui/pCloud Drive/Antigravity/Parenting-Form-Prefiller-PWA/icons/icon-512.png")
print("Saved icon-512.png")
print("Icon generation completed!")
