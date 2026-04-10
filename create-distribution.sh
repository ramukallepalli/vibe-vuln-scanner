#!/bin/bash

# Create distribution package for Vibe Vulnerability Scanner
# This script creates a clean .tar.gz file for distribution to Product Managers

set -e  # Exit on error

DIST_DIR="dist"
PACKAGE_NAME="vibe-vuln-scanner"
VERSION="1.2.0"
OUTPUT_FILE="${PACKAGE_NAME}-v${VERSION}.tar.gz"

echo "Creating distribution package for Vibe Vulnerability Scanner v${VERSION}..."

# Get the absolute path of the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_PATH="${SCRIPT_DIR}/${DIST_DIR}"

# Create dist directory if it doesn't exist
mkdir -p "${DIST_PATH}"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/${PACKAGE_NAME}"
mkdir -p "${PACKAGE_DIR}"

echo "Copying files to temporary directory..."

# Copy essential files
cp manifest.json "${PACKAGE_DIR}/"
cp README.md "${PACKAGE_DIR}/"
cp INSTALL_GUIDE.md "${PACKAGE_DIR}/"
cp DISTRIBUTION_README.md "${PACKAGE_DIR}/" 2>/dev/null || echo "Note: DISTRIBUTION_README.md not found, skipping"

# Copy source code
cp -r src "${PACKAGE_DIR}/"

# Copy icons if they exist
if [ -d "icons" ]; then
    cp -r icons "${PACKAGE_DIR}/"
else
    echo "Warning: icons directory not found"
fi

# Copy public files if they exist
if [ -d "public" ]; then
    cp -r public "${PACKAGE_DIR}/"
fi

# Create the tarball
echo "Creating tarball..."
cd "${TEMP_DIR}"
tar -czf "${OUTPUT_FILE}" "${PACKAGE_NAME}"

# Move to dist directory
mv "${OUTPUT_FILE}" "${DIST_PATH}/"

# Clean up temp directory
cd -
rm -rf "${TEMP_DIR}"

# Calculate file size
FILE_SIZE=$(du -h "${DIST_PATH}/${OUTPUT_FILE}" | cut -f1)

echo "✅ Distribution package created successfully!"
echo ""
echo "📦 Package: ${DIST_PATH}/${OUTPUT_FILE}"
echo "📊 Size: ${FILE_SIZE}"
echo ""
echo "📋 Package contents:"
tar -tzf "${DIST_PATH}/${OUTPUT_FILE}" | head -20
echo ""
echo "🚀 Distribution package ready for Product Managers!"
echo ""
echo "To test the package:"
echo "  1. tar -xzf ${DIST_PATH}/${OUTPUT_FILE}"
echo "  2. Open chrome://extensions/"
echo "  3. Enable Developer mode"
echo "  4. Click 'Load unpacked' and select the '${PACKAGE_NAME}' folder"
