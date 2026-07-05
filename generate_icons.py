from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Draw rounded rectangle background (gradient effect)
    # We will simulate a linear gradient from top-left (lavender #9d8dfa) to bottom-right (warm coral #ffaa9d)
    # To do a gradient, we can draw line segments or step-by-step masks.
    # An easier way is to create a small gradient image and scale it up.
    grad = Image.new("RGBA", (100, 100))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(100):
        for x in range(100):
            # Calculate gradient factor (0 to 1) along diagonal
            factor = (x + y) / 200.0
            # Blend between (109, 88, 255) #6D58FF and (255, 170, 157) #FFAA9D
            r = int(109 + (255 - 109) * factor)
            g = int(88 + (170 - 88) * factor)
            b = int(255 + (157 - 255) * factor)
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
    
    # Apply rounded rectangle mask to the gradient
    background = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    background.paste(grad_large, (0, 0), mask)
    
    # 2. Draw a cute baby/family icon in the center (White)
    # Let's draw hands forming a heart or a stylized cute smiling face with bear ears
    icon_draw = ImageDraw.Draw(background)
    center = size // 2
    r_face = int(size * 0.18)
    
    # Let's draw a cute baby face:
    # Circle for face
    # Left ear (small circle), Right ear (small circle)
    # Closed smiling eyes, smiley mouth
    
    # Ears
    ear_r = int(size * 0.07)
    # Left ear
    icon_draw.ellipse(
        [center - r_face - ear_r//2, center - r_face, center - r_face + ear_r*1.5, center - r_face + ear_r*2],
        fill=(255, 255, 255, 255)
    )
    # Right ear
    icon_draw.ellipse(
        [center + r_face - ear_r*1.5, center - r_face, center + r_face + ear_r//2, center - r_face + ear_r*2],
        fill=(255, 255, 255, 255)
    )
    
    # Main face
    icon_draw.ellipse(
        [center - r_face, center - r_face + int(size*0.03), center + r_face, center + r_face + int(size*0.03)],
        fill=(255, 255, 255, 255)
    )
    
    # Inner details (in background gradient color, let's use the theme purple #6D58FF)
    detail_color = (109, 88, 255, 255)
    
    # Smiley eyes (arcs)
    eye_w = int(size * 0.04)
    # Left eye arc
    icon_draw.arc(
        [center - int(size*0.10), center - int(size*0.03), center - int(size*0.04), center + int(size*0.01)],
        start=180, end=360, fill=detail_color, width=max(2, int(size*0.015))
    )
    # Right eye arc
    icon_draw.arc(
        [center + int(size*0.04), center - int(size*0.03), center + int(size*0.10), center + int(size*0.01)],
        start=180, end=360, fill=detail_color, width=max(2, int(size*0.015))
    )
    
    # Smiley mouth
    icon_draw.arc(
        [center - int(size*0.04), center + int(size*0.04), center + int(size*0.04), center + int(size*0.09)],
        start=0, end=180, fill=detail_color, width=max(2, int(size*0.015))
    )
    
    # Rosy cheeks (soft red circles)
    cheek_r = int(size * 0.03)
    icon_draw.ellipse(
        [center - int(size*0.11), center + int(size*0.03), center - int(size*0.11) + cheek_r*2, center + int(size*0.03) + cheek_r*2],
        fill=(255, 180, 180, 255)
    )
    icon_draw.ellipse(
        [center + int(size*0.11) - cheek_r*2, center + int(size*0.03), center + int(size*0.11), center + int(size*0.03) + cheek_r*2],
        fill=(255, 180, 180, 255)
    )
    
    return background

# Generate 192x192 and 512x512 icons
print("Generating PWA icons...")
icon_192 = create_icon(192)
icon_192.save("/Users/linqirui/pCloud Drive/Antigravity/Parenting-Form-Prefiller-PWA/icons/icon-192.png")
print("Saved icon-192.png")

icon_512 = create_icon(512)
icon_512.save("/Users/linqirui/pCloud Drive/Antigravity/Parenting-Form-Prefiller-PWA/icons/icon-512.png")
print("Saved icon-512.png")
print("Icon generation completed!")
