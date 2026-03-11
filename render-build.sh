#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Render Build Process Started ---"

# 1. Oracle libaio1 dependency setup
echo "Setting up Oracle dependencies..."
mkdir -p ./lib_temp
cd ./lib_temp

# Download libaio1 using curl (wget is often missing on PaaS like Render)
LIB_URL="http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb"
echo "Downloading libaio1 using curl..."
curl -sL $LIB_URL -o libaio1.deb || curl -sL http://security.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb -o libaio1.deb

echo "Extracting libaio1 using dpkg -x..."
# Note: dpkg -i requires root, so we use dpkg -x to extract to the current directory
dpkg -x libaio1.deb .

echo "Merging libraries into instantclient_21_15..."
# Ensure the target directory exists
mkdir -p ../instantclient_21_15
# Copy the extracted libraries to the instantclient folder where LD_LIBRARY_PATH can find them
cp -af usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp -af usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# 2. Install Node.js dependencies
echo "Installing npm dependencies..."
npm install

echo "--- Render Build Process Completed ---"
