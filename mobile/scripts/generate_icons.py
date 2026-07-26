from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\manix\.cursor\projects\c-Users-manix-Documents-Caisse-Judo\assets\c__Users_manix_AppData_Roaming_Cursor_User_workspaceStorage_921f72c665a05936b82108bcbbc8eb62_images_Icon-Judo-Caisse-f117dff3-de5b-4af5-9c3d-7022d81f1a84.png"
)
res = Path(r"c:\Users\manix\Documents\Caisse Judo\mobile\android\app\src\main\res")
brand = Path(r"c:\Users\manix\Documents\Caisse Judo\mobile\assets")
brand.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size
cx, cy = w / 2, h / 2
r_max = min(cx, cy) * 0.98

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        dx, dy = x - cx, y - cy
        if dx * dx + dy * dy > r_max * r_max or (r < 25 and g < 25 and b < 25):
            pixels[x, y] = (0, 0, 0, 0)

blues = []
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a > 200 and b > r and b > g and r < 120:
            blues.append((r, g, b))

if blues:
    avg = tuple(sum(c[i] for c in blues) // len(blues) for i in range(3))
else:
    avg = (68, 114, 196)

print("bg", "#%02x%02x%02x" % avg)

master = img.resize((512, 512), Image.Resampling.LANCZOS)
master.save(brand / "icon.png")

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
fg_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, size in sizes.items():
    out_dir = res / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    icon = master.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(out_dir / "ic_launcher.png")
    icon.save(out_dir / "ic_launcher_round.png")

for folder, size in fg_sizes.items():
    out_dir = res / folder
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    logo_size = int(size * 0.72)
    logo = master.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    offset = (size - logo_size) // 2
    canvas.paste(logo, (offset, offset), logo)
    canvas.save(out_dir / "ic_launcher_foreground.png")

color_xml = res / "values" / "ic_launcher_background.xml"
color_xml.write_text(
    f'''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#{avg[0]:02X}{avg[1]:02X}{avg[2]:02X}</color>
</resources>
''',
    encoding="utf-8",
)

splash = Image.new("RGBA", (480, 480), (*avg, 255))
logo = master.resize((220, 220), Image.Resampling.LANCZOS)
splash.paste(logo, ((480 - 220) // 2, (480 - 220) // 2), logo)
splash.convert("RGB").save(res / "drawable" / "splash.png")

print("icons generated")
