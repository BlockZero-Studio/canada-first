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
# Output: ../canada-first-safari/CanadaFirst.xcodeproj (outside this repo; it
# is listed in .gitignore).
#
# After the conversion
#   1. `open ../canada-first-safari/CanadaFirst/CanadaFirst.xcodeproj` (the
#      converter prints the exact path; it opens Xcode automatically unless
#      --no-open is passed).
#   2. In Xcode, select the "CanadaFirst" app target and, under
#      Signing & Capabilities, choose your Personal Team for both the app and
#      the extension targets.
#   3. Product > Run (Cmd-R). This builds the host app and registers the
#      extension with Safari.
#   4. Safari > Settings > Extensions > enable "CanadaFirst".
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

# Stage only the runtime files so .git, tests, docs and scripts are not
# bundled into the Safari app.
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/canada-first-stage.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
cp -R manifest.json README.md src data icons "$STAGE"/
find "$STAGE" -name .DS_Store -delete

xcrun safari-web-extension-converter "$STAGE" \
  --project-location ../canada-first-safari \
  --app-name CanadaFirst \
  --bundle-identifier studio.blockzero.canadafirst \
  --macos-only \
  --copy-resources \
  --force

# The converter derives the app id from --app-name (studio.blockzero.CanadaFirst)
# but the extension id from --bundle-identifier (…canadafirst.Extension); the
# case mismatch fails Xcode's "embedded binary prefix" check. Normalize, and
# align the marketing version with manifest.json.
PBX="../canada-first-safari/CanadaFirst/CanadaFirst.xcodeproj/project.pbxproj"
VERSION="$(node -p "require('./manifest.json').version")"
sed -i '' \
  -e 's/PRODUCT_BUNDLE_IDENTIFIER = studio\.blockzero\.CanadaFirst;/PRODUCT_BUNDLE_IDENTIFIER = studio.blockzero.canadafirst;/' \
  -e "s/MARKETING_VERSION = 1\.0;/MARKETING_VERSION = $VERSION;/" \
  "$PBX"

echo
echo "Done. Next: open the Xcode project, pick your Personal Team under"
echo "Signing & Capabilities, Run, then enable CanadaFirst in Safari > Settings > Extensions."
echo "Dev builds also need Develop > Allow Unsigned Extensions."
