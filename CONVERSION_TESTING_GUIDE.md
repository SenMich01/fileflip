# FileFlip Conversion Testing Guide

This guide provides comprehensive testing procedures to verify that all file conversions work correctly and produce valid, openable files.

## Overview

The FileFlip application now uses a proper upload → convert → download pipeline with reliable libraries to ensure file integrity.

## Testing Requirements

All converted files must:
- Open normally in their respective applications
- Never be corrupted or unreadable
- Have proper file sizes (> 0 bytes)
- Use correct MIME types
- Download successfully using `res.download()`

## Testing Procedures

### 1. PDF to DOCX Conversion Testing

**Test Files Needed:**
- Sample PDF with text content
- PDF with multiple pages
- PDF with formatted text

**Testing Steps:**
1. Upload PDF file
2. Select "Convert to DOCX" option
3. Download converted file
4. Open in Microsoft Word - verify text is readable
5. Open in Google Docs - verify formatting is preserved
6. Open in Mac Pages - verify compatibility

**Expected Results:**
- DOCX file opens without errors
- Text content is preserved
- File size > 0 bytes
- MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 2. EPUB to PDF Conversion Testing

**Test Files Needed:**
- Sample EPUB book with multiple chapters
- EPUB with images
- EPUB with table of contents

**Testing Steps:**
1. Upload EPUB file
2. Select "Convert to PDF" option
3. Download converted file
4. Open in Adobe Reader - verify text is readable
5. Open in browser PDF viewer - verify chapters are accessible
6. Check table of contents navigation

**Expected Results:**
- PDF file opens without errors
- Chapter structure is preserved
- Text content is readable
- File size > 0 bytes
- MIME type: `application/pdf`

### 3. Image to PDF Conversion Testing

**Test Files Needed:**
- JPG image
- PNG image with transparency
- WebP image
- High-resolution image

**Testing Steps:**
1. Upload image file
2. Select "Convert to PDF" option
3. Download converted file
4. Open in Adobe Reader - verify image quality
5. Open in browser PDF viewer - verify image is centered
6. Check PDF dimensions match image aspect ratio

**Expected Results:**
- PDF file opens without errors
- Image is properly embedded and centered
- Image quality is preserved
- File size > 0 bytes
- MIME type: `application/pdf`

### 4. PDF to Image Conversion Testing

**Test Files Needed:**
- PDF with text content
- PDF with images
- Multi-page PDF

**Testing Steps:**
1. Upload PDF file
2. Select "Convert to JPG" or "Convert to PNG" option
3. Download converted file
4. Open image in viewer - verify content is readable
5. Check image dimensions and quality

**Expected Results:**
- Image file opens without errors
- Content is readable and clear
- File size > 0 bytes
- MIME type: `image/jpeg` or `image/png`

## Error Handling Testing

### 1. File Size Limits
- Upload file larger than 50MB
- Verify error message: "File too large. Maximum file size is 50MB"

### 2. Invalid File Types
- Upload unsupported file type (e.g., .exe, .txt)
- Verify error message: "Invalid file format. Supported formats: PDF, JPG, PNG, WebP, EPUB"

### 3. Empty Files
- Upload corrupted or empty file
- Verify error handling and appropriate error messages

### 4. Conversion Failures
- Test with files that might cause conversion errors
- Verify graceful error handling with user-friendly messages

## File Validation Testing

### 1. File Existence Check
- Verify converted files are created in `/tmp/converted/` directory
- Check that files are not empty (size > 0 bytes)

### 2. File Cleanup
- Verify uploaded files are deleted after conversion
- Verify converted files are deleted after download
- Check that temporary directories are properly managed

### 3. Buffer Safety
- Confirm no `buffer.toString()` or `JSON.stringify(buffer)` usage
- Verify all file operations use binary buffers
- Check that `res.download()` is used for all downloads

## Performance Testing

### 1. Conversion Speed
- Measure conversion times for different file sizes
- Verify reasonable performance for typical file sizes
- Check memory usage during conversion

### 2. Concurrent Conversions
- Test multiple simultaneous conversions
- Verify system stability under load
- Check for file conflicts or race conditions

## Security Testing

### 1. File Upload Security
- Test with malicious file names
- Verify proper file extension validation
- Check for path traversal attempts

### 2. Content Validation
- Test with files containing special characters
- Verify proper text extraction and sanitization
- Check for injection vulnerabilities

## Logging Verification

### 1. Conversion Logs
- Verify detailed logging for each conversion step
- Check that file sizes are logged before and after conversion
- Confirm conversion duration is logged

### 2. Error Logs
- Verify error conditions are properly logged
- Check that error messages include sufficient detail for debugging
- Confirm security-related events are logged

## Cross-Platform Testing

### 1. Application Compatibility
- Test DOCX files in Microsoft Word (Windows/Mac)
- Test DOCX files in Google Docs (Web)
- Test DOCX files in LibreOffice
- Test PDF files in Adobe Reader
- Test PDF files in browser viewers
- Test PDF files in mobile PDF readers

### 2. File Format Verification
- Use file format validation tools
- Check file headers and structure
- Verify MIME type detection

## Automated Testing

### 1. Unit Tests
Create unit tests for each conversion function:
- PDF to DOCX conversion
- EPUB to PDF conversion
- Image to PDF conversion
- PDF to image conversion

### 2. Integration Tests
Create integration tests for the complete pipeline:
- File upload → conversion → download
- Error handling scenarios
- File validation checks

### 3. Performance Tests
Create performance benchmarks:
- Conversion speed measurements
- Memory usage monitoring
- Concurrent conversion testing

## Manual Testing Checklist

- [ ] PDF to DOCX opens in Microsoft Word
- [ ] PDF to DOCX opens in Google Docs
- [ ] EPUB to PDF opens in Adobe Reader
- [ ] EPUB to PDF opens in browser viewer
- [ ] Image to PDF opens in PDF readers
- [ ] PDF to JPG/PNG opens in image viewers
- [ ] All files have proper MIME types
- [ ] All files have size > 0 bytes
- [ ] Error messages are user-friendly
- [ ] File cleanup works correctly
- [ ] Logging provides sufficient detail
- [ ] Security validation works properly

## Troubleshooting

### Common Issues

1. **Files won't open**: Check file size and corruption
2. **Wrong MIME type**: Verify response headers
3. **Empty files**: Check conversion logic and file writing
4. **Slow conversions**: Check file size and system resources
5. **Permission errors**: Verify file system permissions

### Debug Commands

```bash
# Check temp directories
ls -la /tmp/fileflip/uploads/
ls -la /tmp/fileflip/converted/

# Check file sizes
stat /tmp/fileflip/converted/converted.docx
stat /tmp/fileflip/converted/converted.pdf

# Check file types
file /tmp/fileflip/converted/converted.docx
file /tmp/fileflip/converted/converted.pdf

# Monitor logs
tail -f /var/log/fileflip/conversion.log
```

## Success Criteria

All conversions must meet these criteria:
- ✅ Files open in their respective applications
- ✅ No corruption or readability issues
- ✅ Proper file sizes and MIME types
- ✅ Clean error handling and logging
- ✅ Secure file upload and processing
- ✅ Proper cleanup of temporary files
- ✅ Performance within acceptable limits

## Reporting Issues

When reporting conversion issues, include:
- Input file type and size
- Target format
- Error messages (if any)
- File sizes before and after conversion
- Application used to open the file
- Operating system and version
- Browser version (for web-based testing)