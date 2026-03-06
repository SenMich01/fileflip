import fs from 'fs';
import path from 'path';

/**
 * Temporary file management utility
 */
export class TempFileManager {
  static TEMP_DIR = '/tmp/fileflip';
  static UPLOAD_DIR = path.join(this.TEMP_DIR, 'uploads');
  static CONVERTED_DIR = path.join(this.TEMP_DIR, 'converted');

  /**
   * Initialize temp directories
   */
  static init() {
    try {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      fs.mkdirSync(this.CONVERTED_DIR, { recursive: true });
      console.log('Temp directories initialized:', {
        uploadDir: this.UPLOAD_DIR,
        convertedDir: this.CONVERTED_DIR
      });
    } catch (error) {
      console.log('Temp directories already exist or created successfully');
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  static generateFilename(originalName) {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}_${timestamp}_${randomSuffix}${extension}`;
  }

  /**
   * Save uploaded file to temp directory
   * @param {Buffer} buffer - File buffer
   * @param {string} originalName - Original filename
   * @returns {string} File path
   */
  static saveUploadedFile(buffer, originalName) {
    const filename = this.generateFilename(originalName);
    const filePath = path.join(this.UPLOAD_DIR, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    const stats = fs.statSync(filePath);
    console.log('Uploaded file saved:', {
      path: filePath,
      size: stats.size,
      originalName: originalName
    });

    return filePath;
  }

  /**
   * Save converted file to temp directory
   * @param {Buffer} buffer - Converted file buffer
   * @param {string} filename - Desired filename
   * @returns {string} File path
   */
  static saveConvertedFile(buffer, filename) {
    const filePath = path.join(this.CONVERTED_DIR, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    const stats = fs.statSync(filePath);
    console.log('Converted file saved:', {
      path: filePath,
      size: stats.size,
      filename: filename
    });

    return filePath;
  }

  /**
   * Delete file
   * @param {string} filePath - Path to file
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted:', filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', filePath, error);
    }
  }

  /**
   * Delete directory and all its contents
   * @param {string} dirPath - Path to directory
   */
  static deleteDirectory(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          this.deleteFile(filePath);
        });
        fs.rmdirSync(dirPath);
        console.log('Directory deleted:', dirPath);
      }
    } catch (error) {
      console.error('Error deleting directory:', dirPath, error);
    }
  }

  /**
   * Clean up all temp files
   */
  static cleanup() {
    console.log('Cleaning up temp files...');
    this.deleteDirectory(this.UPLOAD_DIR);
    this.deleteDirectory(this.CONVERTED_DIR);
    console.log('Temp files cleaned up');
  }

  /**
   * Get file size
   * @param {string} filePath - Path to file
   * @returns {number} File size in bytes
   */
  static getFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
      return 0;
    }
    return fs.statSync(filePath).size;
  }

  /**
   * Check if file exists and has content
   * @param {string} filePath - Path to file
   * @returns {boolean} True if file exists and has content
   */
  static isValidFile(filePath) {
    return this.getFileSize(filePath) > 0;
  }
}

// Initialize temp directories on import
TempFileManager.init();

export default TempFileManager;