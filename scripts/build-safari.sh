#!/bin/sh
# Convert the MV3 extension into a Safari (macOS) app extension Xcode project.
#
# Prerequisites
#   - macOS with Xcode installed (App Store). The Command Line Tools alone are
#     NOT enough: the converter ships with Xcode.
#   - Point xcode-select at Xcode if it currently points at the CLT:
#       sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
#   - Run once: `sudo xcodebuild -license accept` (if prompted).
#   - Make sure icons exist: `npm run icons`.
#
# Output: ../maple-check-safari/MapleCheck.xcodeproj (outside this repo; it
# is listed in .gitignore).
#
# After the conversion
#   1. `open ../maple-check-safari/MapleCheck/MapleCheck.xcodeproj` (the
#      converter prints the exact path; it opens Xcode automatically unless
#      --no-open is passed).
#   2. In Xcode, select the "MapleCheck" app target and, under
#      Signing & Capabilities, choose your Personal Team for both the app and
#      the extension targets.
#   3. Product > Run (Cmd-R). This builds the host app and registers the
#      extension with Safari.
#   4. Safari > Settings > Extensions > enable "MapleCheck".
#   5. For unsigned/dev builds: Safari > Settings > Advanced > "Show features
#      for web developers", then Develop > Allow Unsigned Extensions (must be
#      re-enabled after every Safari restart).
#   6. Re-run this script and Cmd-R again after changing any JS/HTML in this
#      repo (--copy-resources copies files rather than referencing them).
#
# Notes
#   - browser_specific_settings is intentionally absent from manifest.json;
#     the converter injects what Safari needs.
#   - The converter warns about unsupported keys; "options_page" and
#     "web_accessible_resources" with <all_urls> are fine on Safari 17+.

set -eu

cd "$(dirname "$0")/.."

if ! xcrun --find safari-web-extension-converter >/dev/null 2>&1; then
  echo "safari-web-extension-converter not found. Install Xcode and run:" >&2
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

if [ ! -f icons/icon128.png ]; then
  echo "Icons missing, generating..." >&2
  node scripts/make-icons.mjs
fi

xcrun safari-web-extension-converter . \
  --project-location ../maple-check-safari \
  --app-name MapleCheck \
  --bundle-identifier studio.blockzero.maplecheck \
  --macos-only \
  --copy-resources \
  --force

echo
echo "Done. Next: open the Xcode project, pick your Personal Team under"
echo "Signing & Capabilities, Run, then enable MapleCheck in Safari > Settings > Extensions."
echo "Dev builds also need Develop > Allow Unsigned Extensions."
