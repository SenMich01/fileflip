# Linux Installation Guide for FileFlip Dependencies

This guide provides instructions for installing LibreOffice and Calibre on Linux systems, which are required for the FileFlip file conversion system to work properly on Render deployment environment.

## Overview

The FileFlip application requires two key dependencies for high-quality file conversions:

1. **LibreOffice** - For PDF to DOCX conversion
2. **Calibre** - For EPUB to PDF conversion (using ebook-convert CLI)

## Installation Instructions

### Method 1: Using Package Manager (Recommended)

#### Ubuntu/Debian Systems

```bash
# Update package list
sudo apt update

# Install LibreOffice
sudo apt install -y libreoffice

# Install Calibre
sudo apt install -y calibre

# Verify installations
libreoffice --version
ebook-convert --version
```

#### CentOS/RHEL/Rocky Linux Systems

```bash
# Install EPEL repository (if not already installed)
sudo yum install -y epel-release

# Install LibreOffice
sudo yum install -y libreoffice

# Install Calibre
sudo yum install -y calibre

# Verify installations
libreoffice --version
ebook-convert --version
```

#### Fedora Systems

```bash
# Install LibreOffice
sudo dnf install -y libreoffice

# Install Calibre
sudo dnf install -y calibre

# Verify installations
libreoffice --version
ebook-convert --version
```

### Method 2: Using Snap (Alternative)

```bash
# Install LibreOffice via Snap
sudo snap install libreoffice

# Install Calibre via Snap
sudo snap install calibre

# Verify installations
libreoffice --version
ebook-convert --version
```

### Method 3: Manual Installation (Advanced)

#### LibreOffice Manual Installation

```bash
# Download LibreOffice
wget https://download.documentfoundation.org/libreoffice/stable/7.6.0/deb/x86_64/LibreOffice_7.6.0_Linux_x86-64_deb.tar.gz

# Extract
tar -xzf LibreOffice_7.6.0_Linux_x86-64_deb.tar.gz

# Install
sudo dpkg -i LibreOffice_7.6.0.3_Linux_x86-64_deb/DEBS/*.deb

# Clean up
rm -rf LibreOffice_7.6.0_Linux_x86-64_deb.tar.gz LibreOffice_7.6.0.3_Linux_x86-64_deb/
```

#### Calibre Manual Installation

```bash
# Download and install Calibre
sudo -v && wget -nv -O- https://download.calibre-ebook.com/linux-installer.sh | sudo sh /dev/stdin

# Verify installation
ebook-convert --version
```

## Verification Commands

After installation, verify that both tools are working correctly:

```bash
# Test LibreOffice
libreoffice --headless --convert-to docx --outdir /tmp /tmp/test.pdf

# Test Calibre
ebook-convert /tmp/test.epub /tmp/test.pdf

# Check if commands are available in PATH
which libreoffice
which ebook-convert
```

## Render Deployment Environment

For Render deployment, add the following to your `render.yaml` file:

```yaml
services:
  - type: web
    name: fileflip
    env: node
    buildCommand: |
      sudo apt update
      sudo apt install -y libreoffice calibre
      npm install && npm run build
    startCommand: node server.js
    envVars:
      - key: PORT
        value: 10000
      - key: NODE_ENV
        value: production
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: VITE_API_URL
        value: https://fileflip.onrender.com
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: PAYSTACK_SECRET_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://fileflip.onrender.com
```

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure the tools are in your PATH
2. **Permission denied**: Run commands with sudo
3. **Missing dependencies**: Install required system libraries

### Debug Commands

```bash
# Check if LibreOffice is installed
dpkg -l | grep libreoffice

# Check if Calibre is installed
dpkg -l | grep calibre

# Check PATH
echo $PATH

# Test conversion manually
echo "Test PDF content" > /tmp/test.txt
libreoffice --headless --convert-to pdf --outdir /tmp /tmp/test.txt
```

### System Requirements

- **Memory**: At least 2GB RAM recommended
- **Disk Space**: 500MB for LibreOffice, 200MB for Calibre
- **Permissions**: Root access required for installation

## Docker Alternative

If you're using Docker, add these lines to your Dockerfile:

```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    calibre \
    && rm -rf /var/lib/apt/lists/*

# Verify installation
RUN libreoffice --version
RUN ebook-convert --version
```

## Performance Notes

- LibreOffice conversions may take 10-30 seconds depending on PDF complexity
- Calibre EPUB conversions typically take 5-15 seconds
- Both tools are CPU-intensive during conversion
- Consider implementing conversion queuing for high-traffic applications

## Security Considerations

- Both tools process user-uploaded files
- Ensure proper file validation and sanitization
- Limit file sizes to prevent DoS attacks
- Run conversions in isolated environments when possible

## Support

For additional support:
- [LibreOffice Documentation](https://www.libreoffice.org/get-help/documentation/)
- [Calibre Documentation](https://manual.calibre-ebook.com/)
- [FileFlip GitHub Issues](https://github.com/your-repo/fileflip/issues)