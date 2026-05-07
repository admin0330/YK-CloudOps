#!/bin/bash
set -e

APP_NAME="ym1r"
RELEASE_ROOT="release"
RELEASE_DIR="$RELEASE_ROOT/$APP_NAME"
ZIP_NAME="ym1r-release.zip"

# Clean old
rm -rf "$RELEASE_ROOT"
rm -f "$ZIP_NAME"

mkdir -p "$RELEASE_DIR"

echo "[1/4] Copying project files..."

rsync -av ./ "$RELEASE_DIR" \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  --exclude "*.log" \
  --exclude logs \
  --exclude "*.db" \
  --exclude "*.sqlite" \
  --exclude "*.db-wal" \
  --exclude "*.db-shm" \
  --exclude ".DS_Store" \
  --exclude release \
  --exclude "$ZIP_NAME" \
  --exclude "ym1r-release.zip" \
  --exclude uploads

echo "[2/4] Creating zip via Python..."
python3 -c "
import zipfile, os, sys

root = '$RELEASE_ROOT'
app = '$APP_NAME'
zip_name = '$ZIP_NAME'

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
    base = os.path.join(root, app)
    for dirpath, dirnames, filenames in os.walk(base):
        for fn in filenames:
            fp = os.path.join(dirpath, fn)
            arcname = os.path.relpath(fp, root)
            zf.write(fp, arcname)

size_mb = os.path.getsize(zip_name) / (1024 * 1024)
print(f'Created: {zip_name} ({size_mb:.1f} MB)')
"

echo "[3/4] Cleaning temp dir..."
rm -rf "$RELEASE_ROOT"

echo ""
echo "Done. Zip release: $ZIP_NAME"
echo ""
echo "[4/4] Preview (first 80 entries):"
python3 -c "
import zipfile
with zipfile.ZipFile('$ZIP_NAME', 'r') as zf:
    for i, info in enumerate(zf.infolist()):
        if i >= 80:
            print(f'  ... ({len(zf.infolist()) - 80} more entries)')
            break
        print(f'  {info.filename}  ({info.file_size} bytes)')
print(f'Total entries: {len(zf.infolist())}')
"
