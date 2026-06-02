#!/usr/bin/env bash
set -e

echo "Installing LibreOffice..."
apt-get update -qq
apt-get install -y libreoffice --no-install-recommends

echo "Installing Node dependencies..."
npm install

echo "Build complete ✅"
