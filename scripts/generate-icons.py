#!/usr/bin/env python3
"""Generate crisp multi-resolution Windows & Tauri icon assets for WEJET."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = ROOT / "src-tauri" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)


def render_master_icon(size: int = 1024) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    margin = int(size * 0.0625)
    outer = [margin, margin, size - margin, size - margin]
    radius = int(size * 0.215)

    # Layered dark glass squircle background
    draw.rounded_rectangle(outer, radius=radius, fill=(15, 23, 42, 255))
    inner_glow = [margin + 6, margin + 6, size - margin - 6, size - margin - 6]
    draw.rounded_rectangle(
        inner_glow,
        radius=radius - 4,
        fill=(21, 32, 56, 255),
        outline=(148, 197, 255, 88),
        width=max(2, size // 96),
    )

    # Modular Bento Glass tiles symbolizing WEJET's desktop widget canvas
    pad = int(size * 0.175)
    gap = int(size * 0.055)
    col_w = (size - 2 * pad - gap) // 2

    # Top-left primary sky-cyan glass tile
    tl = [pad, pad, pad + col_w, pad + int(col_w * 1.05)]
    draw.rounded_rectangle(
        tl,
        radius=int(size * 0.078),
        fill=(72, 187, 255, 242),
        outline=(224, 247, 255, 165),
        width=max(2, size // 128),
    )

    # Top-right frosted neutral tile
    tr_bottom = pad + int(col_w * 0.60)
    tr = [pad + col_w + gap, pad, size - pad, tr_bottom]
    draw.rounded_rectangle(
        tr,
        radius=int(size * 0.062),
        fill=(226, 236, 252, 74),
        outline=(248, 250, 252, 118),
        width=max(2, size // 140),
    )

    # Bottom-right indigo-ice tall glass tile
    br = [pad + col_w + gap, tr_bottom + gap, size - pad, size - pad]
    draw.rounded_rectangle(
        br,
        radius=int(size * 0.082),
        fill=(129, 168, 255, 226),
        outline=(224, 235, 255, 150),
        width=max(2, size // 128),
    )

    # Bottom-left translucent mist tile
    bl = [pad, pad + int(col_w * 1.05) + gap, pad + col_w, size - pad]
    draw.rounded_rectangle(
        bl,
        radius=int(size * 0.074),
        fill=(148, 197, 255, 58),
        outline=(125, 211, 252, 128),
        width=max(2, size // 140),
    )

    return canvas


def main() -> None:
    master = render_master_icon(1024)

    png_targets = {
        "32x32.png": 32,
        "64x64.png": 64,
        "128x128.png": 128,
        "128x128@2x.png": 256,
        "icon.png": 512,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50,
    }

    for filename, px in png_targets.items():
        resized = master.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(ICONS_DIR / filename, format="PNG", optimize=True)

    # Multi-size Windows ICO (16, 24, 32, 48, 64, 128, 256)
    ico_base = master.resize((256, 256), Image.Resampling.LANCZOS)
    ico_base.save(
        ICONS_DIR / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    # macOS placeholder bundle safety for cross-platform `tauri build`
    icns_base = master.resize((256, 256), Image.Resampling.LANCZOS)
    icns_base.save(ICONS_DIR / "icon.icns", format="ICNS")
    print(f"Generated {len(png_targets) + 2} icon assets in {ICONS_DIR}")


if __name__ == "__main__":
    main()
