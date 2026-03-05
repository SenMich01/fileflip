# EPUB to PDF Conversion Testing Guide

This guide provides specific testing procedures for the Calibre-based EPUB to PDF conversion system.

## Overview

The EPUB to PDF conversion now uses Calibre's `ebook-convert` CLI tool for professional-grade conversion with a fallback to pdfkit for basic text extraction.

## Testing Requirements

All converted EPUB files must:
- Open normally in Adobe Reader and browser PDF viewers
- Preserve chapter structure and formatting when possible
- Have proper file sizes (> 0 bytes)
- Use correct MIME type: `application/pdf`
- Download successfully using `res.download()`

## Testing Procedures

### 1. Calibre Installation Verification

**Test Commands:**
```bash
# Check if Calibre is installed
which ebook-convert

# Check Calibre version
ebook-convert --version

# Test basic conversion
echo "Test EPUB content" > /tmp/test.epub
ebook-convert /tmp/test.epub /tmp/test.pdf
```

**Expected Results:**
- `ebook-convert` command is available in PATH
- Version information is displayed
- Test conversion completes without errors

### 2. EPUB File Testing

**Test Files Needed:**
- Sample EPUB with multiple chapters
- EPUB with images and formatting
- EPUB with table of contents
- Simple text-only EPUB

**Testing Steps:**
1. Upload EPUB file through the web interface
2. Select "Convert to PDF" option
3. Download converted file
4. Open in Adobe Reader - verify text is readable
5. Open in browser PDF viewer - verify chapters are accessible
6. Check PDF structure and formatting

**Expected Results:**
- PDF file opens without errors
- Chapter structure is preserved
- Text content is readable
- File size > 0 bytes
- Proper PDF headers and structure

### 3. Fallback Conversion Testing

**Test Scenarios:**
- Test on system without Calibre installed
- Test with corrupted EPUB files
- Test with very large EPUB files

**Testing Steps:**
1. Remove or disable Calibre temporarily
2. Upload EPUB file
3. Verify fallback conversion activates
4. Check that basic text content is extracted
5. Verify PDF is still generated

**Expected Results:**
- Fallback conversion activates when Calibre is unavailable
- Basic text content is extracted and formatted
- PDF file is generated with readable content
- Error handling is graceful

### 4. Error Handling Testing

**Test Scenarios:**
- Upload corrupted EPUB file
- Upload empty EPUB file
- Upload unsupported file format with .epub extension

**Testing Steps:**
1. Upload problematic EPUB files
2. Verify appropriate error messages
3. Check that system doesn't crash
4. Verify temp files are cleaned up

**Expected Results:**
- Clear error messages for invalid files
- System remains stable
- No temp files left behind
- Proper error logging

### 5. Performance Testing

**Test Scenarios:**
- Large EPUB files (10MB+)
- Multiple concurrent conversions
- Memory usage monitoring

**Testing Steps:**
1. Upload large EPUB files
2. Measure conversion time
3. Monitor memory usage
4. Test multiple simultaneous conversions

**Expected Results:**
- Reasonable conversion times for large files
- Memory usage remains stable
- Concurrent conversions work without conflicts
- No memory leaks

### 6. File Validation Testing

**Test Scenarios:**
- Verify file size checking
- Test file existence validation
- Check temp file cleanup

**Testing Steps:**
1. Monitor conversion logs for file size information
2. Verify converted files exist before download
3. Check that temp files are deleted after conversion
4. Verify file size > 0 before sending to user

**Expected Results:**
- File sizes are logged correctly
- Converted files exist and have proper size
- Temp files are cleaned up automatically
- Empty files are rejected with error

## Debugging Commands

### Calibre Debugging
```bash
# Test Calibre conversion manually
ebook-convert input.epub output.pdf --verbose

# Check Calibre options
ebook-convert --help

# Test with specific options
ebook-convert input.epub output.pdf --pdf-page-margin-top=20 --pdf-page-margin-bottom=20
```

### File System Debugging
```bash
# Check temp directories
ls -la /tmp/fileflip/uploads/
ls -la /tmp/fileflip/converted/

# Check file sizes
stat /tmp/fileflip/converted/converted.pdf

# Check file type
file /tmp/fileflip/converted/converted.pdf

# Monitor logs
tail -f /var/log/fileflip/conversion.log
```

### Node.js Debugging
```bash
# Start server with debug logging
DEBUG=* node server.js

# Check process memory
ps aux | grep node

# Monitor file descriptors
lsof -p <node_pid>
```

## Success Criteria

### Calibre Conversion
- ✅ EPUB files convert to valid PDFs
- ✅ Chapter structure is preserved
- ✅ Text formatting is maintained
- ✅ Images are properly embedded
- ✅ Conversion time is reasonable

### Fallback Conversion
- ✅ Basic text extraction works
- ✅ PDF structure is valid
- ✅ Content is readable
- ✅ Graceful degradation

### Error Handling
- ✅ Invalid files are rejected
- ✅ System remains stable
- ✅ Proper cleanup occurs
- ✅ User-friendly error messages

### Performance
- ✅ Large files convert successfully
- ✅ Memory usage is reasonable
- ✅ Concurrent conversions work
- ✅ No resource leaks

## Troubleshooting

### Common Issues

1. **Calibre not found**: Check installation and PATH
2. **Conversion fails**: Check EPUB file integrity
3. **Empty PDF**: Check file size validation
4. **Slow conversion**: Monitor system resources
5. **Memory issues**: Check for memory leaks

### Resolution Steps

1. **Verify Calibre installation**: `ebook-convert --version`
2. **Test manual conversion**: `ebook-convert test.epub test.pdf`
3. **Check file permissions**: Ensure write access to temp directories
4. **Monitor logs**: Check conversion logs for errors
5. **Test fallback**: Disable Calibre and test fallback conversion

## Production Deployment

### Render Environment
- Calibre is installed via `sudo apt install calibre`
- Verify installation in build logs
- Test conversion after deployment
- Monitor performance and error rates

### Monitoring
- Set up error tracking
- Monitor conversion success rates
- Track conversion times
- Watch for memory usage patterns

## Reporting Issues

When reporting EPUB to PDF conversion issues, include:
- Input EPUB file details (size, structure)
- Calibre version information
- Conversion error messages
- File sizes before and after conversion
- System environment details
- Whether Calibre or fallback was used