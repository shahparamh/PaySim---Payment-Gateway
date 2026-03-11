#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Render Build Process Started ---"

# 1. Oracle libaio1 dependency setup
echo "Setting up Oracle dependencies..."
mkdir -p ./lib_temp
cd ./lib_temp

# Download libaio1 from a more stable mirror if possible
LIB_URL="http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb"
echo "Downloading libaio1 from $LIB_URL..."
wget -q $LIB_URL || wget -q http://security.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb

echo "Extracting libaio1 using dpkg -x..."
dpkg -x *.deb .

echo "Merging libraries into instantclient_21_15..."
mkdir -p ../instantclient_21_15
# Use -f to overwrite and ensure symbolic links are preserved correctly
cp -af usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp -af usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# 2. Install Node.js dependencies
# We do this AFTER system libraries are prepared
echo "Installing npm dependencies..."
npm install

echo "--- Render Build Process Completed ---"
