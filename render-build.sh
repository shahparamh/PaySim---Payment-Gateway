#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Render Build Process Started ---"

# 1. Oracle libaio1 dependency setup
# We use a stable Ubuntu Focal package (uses xz compression, NOT zstd)
# This avoids the "tar: zstd: Cannot exec" error on Render's build environment.
echo "Downloading libaio1 (Ubuntu Focal)..."
mkdir -p ./lib_temp
cd ./lib_temp
wget -q http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb

echo "Extracting libaio1 using dpkg -x..."
# dpkg -x handles the internal compression automatically
dpkg -x libaio1_0.3.112-5_amd64.deb .

echo "Merging libraries into instantclient_21_15..."
# Ensure the target directory exists (it should as it's in the repo)
mkdir -p ../instantclient_21_15
# Use -a to preserve symbolic links (libaio.so.1 -> libaio.so.1.0.1)
cp -a usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp -a usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# 2. Install Node.js dependencies
# We do this AFTER system libraries are prepared
# We use --legacy-peer-deps to fix the conflict between typeorm-0.3 and connect-typeorm-1.1
echo "Installing npm dependencies..."
npm install --legacy-peer-deps

echo "--- Render Build Process Completed ---"
