#!/bin/sh
# Build the Safari app ad-hoc signed (no Apple developer identity needed),
# install it to ~/Applications and launch it once so Safari registers the
# extension. Run scripts/build-safari.sh first (and again after JS changes).
#
# Pitfalls this script avoids (learned the hard way):
#   - Never `cp` the .app into ~/Documents or another iCloud/Finder-tagged
#     folder: the com.apple.FinderInfo xattr breaks the signature and Safari
#     silently ignores the extension. `ditto --noextattr` to ~/Applications.
#   - Never re-sign with `codesign --deep -s -` afterwards: it drops the
#     app-sandbox entitlement, and pkd refuses un-sandboxed extensions.
#   - Safari caches its code-signing verdict per extension identifier for the
#     whole Safari session. After reinstalling, quit and relaunch Safari
#     (then re-enable Develop > Allow Unsigned Extensions).
#
# Then: Safari > Develop > Allow Unsigned Extensions (each Safari launch) and
# Safari > Settings > Extensions > CanadaFirst.

set -eu

PROJECT="$(cd "$(dirname "$0")/.." && pwd)/../canada-first-safari/CanadaFirst/CanadaFirst.xcodeproj"
DD="$HOME/Library/Caches/canada-first-dd"
DEST="/Applications/CanadaFirst.app"
LSREG=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister

[ -d "$PROJECT" ] || { echo "Xcode project missing; run scripts/build-safari.sh first" >&2; exit 1; }

xcodebuild -project "$PROJECT" -scheme CanadaFirst -configuration Debug \
  -derivedDataPath "$DD" CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY="-" DEVELOPMENT_TEAM="" \
  build 2>&1 | grep -E "error:|BUILD (SUCCEEDED|FAILED)"

BUILT="$DD/Build/Products/Debug/CanadaFirst.app"
pkill -x CanadaFirst 2>/dev/null || true
rm -rf "$DEST"
ditto --norsrc --noextattr --noqtn "$BUILT" "$DEST"
codesign -vv --deep --strict "$DEST"
"$LSREG" -f -R "$DEST"
open "$DEST"
sleep 5
pluginkit -m -v -i studio.blockzero.canadafirst.Extension
echo "Installed to $DEST. Quit and relaunch Safari, re-enable Develop > Allow Unsigned"
echo "Extensions, then enable CanadaFirst in Safari > Settings > Extensions."
