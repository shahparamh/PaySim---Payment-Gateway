#!/usr/bin/env bash
# exit on error
set -o errexit

# Install libaio1 dependencies (workaround for Render native environment)
mkdir -p ./lib_temp
cd ./lib_temp
wget http://archive.ubuntu.com/ubuntu/pool/main/liba/libaio/libaio1_0.3.112-5_amd64.deb
ar x libaio1_0.3.112-5_amd64.deb
tar -xvf data.tar.xz

# Move the libraries to the instantclient directory so LD_LIBRARY_PATH finds them
# Check the architecture path (might vary by OS, but usually usr/lib/x86_64-linux-gnu on Ubuntu)
cp usr/lib/x86_64-linux-gnu/libaio.so.1* ../instantclient_21_15/ || cp usr/lib/libaio.so.1* ../instantclient_21_15/

cd ..
rm -rf ./lib_temp

# Install Node dependencies
npm install
