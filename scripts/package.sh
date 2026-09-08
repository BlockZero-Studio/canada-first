#!/bin/sh
# Build the store-submission zip: manifest at the root, runtime files only.
# Output: dist/canadafirst-<version>-chrome.zip (same zip works for Edge).
set -eu
cd "$(dirname "$0")/.."
VERSION="$(node -p "require('./manifest.json').version")"
mkdir -p dist
OUT="dist/canadafirst-$VERSION-chrome.zip"
rm -f "$OUT"
zip -qr "$OUT" manifest.json src data icons -x '.DS_Store' '*/.DS_Store'
unzip -l "$OUT" | tail -1
echo "$OUT"
