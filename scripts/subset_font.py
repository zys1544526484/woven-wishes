"""Build the OFL Noto Serif CJK SC WOFF2 subset used by static UI copy."""

from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "third_party" / "noto-serif-sc" / "NotoSerifCJKsc-Regular.otf"
OUTPUT = ROOT / "src" / "assets" / "fonts" / "noto-serif-sc-subset.woff2"

text = ""
for pattern in ("src/**/*.ts", "src/**/*.tsx", "*.html"):
    for path in ROOT.glob(pattern):
        # Generated classifier weights only contain Base64 ASCII already represented
        # elsewhere, so skipping them makes corpus inspection much faster.
        if path.name == "model.generated.ts":
            continue
        text += path.read_text(encoding="utf-8")
text += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。；：！？（）《》“”‘’·—/ .:%+"

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
subset.main([
    str(SOURCE),
    f"--output-file={OUTPUT}",
    f"--text={''.join(sorted(set(text)))}",
    "--flavor=woff2",
    "--layout-features=*",
    "--name-IDs=*",
    "--name-legacy",
    "--glyph-names",
    "--symbol-cmap",
])
print(f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes).")
