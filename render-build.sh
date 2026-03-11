#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Render Build ---"

# Step 1: Install libaio1 dependencies (needed for Oracle Thick Mode)
echo "Installing libaio1..."
mkdir -p ./lib_temp
cd ./lib_temp
# Use a more stable Ubuntu archive link
wget http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-13build1_amd64.deb || wget http://security.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-13build1_amd64.deb
ar x libaio1_0.3.112-13build1_amd64.deb
tar -xvf data.tar.zst || tar -xvf data.tar.xz

# Step 2: Move the libraries to the instantclient directory
echo "Moving libaio to instantclient_21_15..."
# Ensure the target directory exists
mkdir -p ../instantclient_21_15
# Extract to current folder then copy
cp usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# Step 3: Install Node dependencies
echo "Installing npm dependencies..."
npm install

echo "--- Build Complete ---"
