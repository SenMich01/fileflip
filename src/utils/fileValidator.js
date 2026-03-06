const fs = require('fs');

/**
 * File validation utility for conversion system
 */
class FileValidator {
  static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  static ALLOWED_FORMATS = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/epub+zip': ['epub'],
    'application/octet-stream': ['epub'] // Fallback for EPUB
  };

  /**
   * Validate uploaded file
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    console.log('Validating file:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum file size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file size is not zero
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    // Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = this.getAllowedExtensions();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Invalid file format. Supported formats: ${allowedExtensions.join(', ')}`
      };
    }

    // Check MIME type
    const isValidMimeType = this.isValidMimeType(file.mimetype, fileExtension);
    if (!isValidMimeType) {
      return {
        valid: false,
        error: `Invalid file type for extension ${fileExtension}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate conversion target format
   * @param {string} inputExtension - Input file extension
   * @param {string} targetFormat - Target format
   * @returns {Object} Validation result
   */
  static validateConversion(inputExtension, targetFormat) {
    const supportedConversions = {
      'pdf': ['jpg', 'png', 'docx'],
      'jpg': ['pdf'],
      'jpeg': ['pdf'],
      'png': ['pdf'],
      'webp': ['pdf'],
      'epub': ['pdf']
    };

    const validTargets = supportedConversions[inputExtension] || [];
    const targetExtension = targetFormat.toLowerCase();

    if (!validTargets.includes(targetExtension)) {
      return {
        valid: false,
        error: `Invalid target format. Supported conversions for ${inputExtension.toUpperCase()}: ${validTargets.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate converted file
   * @param {string} filePath - Path to converted file
   * @returns {Object} Validation result
   */
  static validateConvertedFile(filePath) {
    console.log('Validating converted file:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: 'Conversion failed: output file not created'
      };
    }

    // Check file size
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      return {
        valid: false,
        error: 'Conversion failed: output file is empty'
      };
    }

    console.log('Converted file validation passed:', {
      path: filePath,
      size: fileStats.size
    });

    return {
      valid: true,
      size: fileStats.size
    };
  }

  /**
   * Get all allowed file extensions
   * @returns {Array} Array of allowed extensions
   */
  static getAllowedExtensions() {
    const extensions = new Set();
    Object.values(this.ALLOWED_FORMATS).forEach(extArray => {
      extArray.forEach(ext => extensions.add(ext));
    });
    return Array.from(extensions);
  }

  /**
   * Check if MIME type is valid for extension
   * @param {string} mimetype - File MIME type
   * @param {string} extension - File extension
   * @returns {boolean} True if valid
   */
  static isValidMimeType(mimetype, extension) {
    const allowedTypes = this.ALLOWED_FORMATS;
    
    for (const [type, exts] of Object.entries(allowedTypes)) {
      if (exts.includes(extension) && (mimetype === type || mimetype.startsWith(type.split('/')[0] + '/'))) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = FileValidator;
