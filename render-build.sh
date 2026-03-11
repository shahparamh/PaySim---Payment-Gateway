#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Render Build ---"

# Step 1: Install libaio1 dependency (needed for Oracle Thick Mode)
# We use dpkg -x to extract the library without needing root permissions or zstd
echo "Downloading and extracting libaio1..."
mkdir -p ./lib_temp
cd ./lib_temp

# Use an older version (Ubuntu Focal) that uses xz compression to avoid the zstd error
# This version is stable and compatible.
wget http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb

# Extract using dpkg -x instead of tar to satisfy user requirement
# This handles the internal compression automatically if dpkg supports it
dpkg -x libaio1_0.3.112-5_amd64.deb .

# Step 2: Move the libraries to the instantclient directory
echo "Moving libaio to instantclient_21_15..."
mkdir -p ../instantclient_21_15
cp usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# Step 3: Install Node dependencies
echo "Installing npm dependencies..."
npm install

echo "--- Build Complete ---"
