"""Generate checked-in JPEG sizes from the portfolio's original assets on macOS.

Uses the system sips encoder; originals are never overwritten. Production builds
serve these prepared files and do not require Python or sips.
"""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
images = root / "public/project-images"
output = images / "responsive"
output.mkdir(exist_ok=True)

for name in ("aiindex", "ainews", "chatlab", "bicares", "ai-classroom", "caphill"):
    for width in (480, 960):
        subprocess.run([
            "sips", "--resampleWidth", str(width), "-s", "formatOptions", "82",
            str(images / f"{name}.jpg"), "--out", str(output / f"{name}-{width}.jpg"),
        ], check=True, stdout=subprocess.DEVNULL)
    print(f"Prepared {name}: 480px / 960px, original retained")
