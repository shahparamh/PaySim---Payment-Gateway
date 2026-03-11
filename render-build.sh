#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Render Build Process Started ---"

# Note: Oracle libaio dependencies are now bundled in the repository
# inside the ./instantclient_21_15 folder. No external downloads are 
# needed, making the build 100% stable without wget, curl, or dpkg.

echo "Installing npm dependencies..."
# We use --legacy-peer-deps manually here just in case, 
# although our package.json upgrade to connect-typeorm@2.0 should have fixed it.
npm install

echo "--- Render Build Process Completed ---"
