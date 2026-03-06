import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { Document, Packer } from 'docx';
import { Paragraph, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import EPub from 'epub-parser';
import TempFileManager from '../utils/tempFileManager.js';

/**
 * Conversion service for file conversions
 */
export class ConversionService {
  /**
   * Convert PDF to DOCX
   * @param {string} inputPath - Path to input PDF file
   * @param {string} outputFilename - Desired output filename
   * @returns {string} Path to converted file
   */
  static async convertPdfToDocx(inputPath, outputFilename) {
    console.log('Starting PDF to DOCX conversion...');
    console.log(`Input file size: ${TempFileManager.getFileSize(inputPath)} bytes`);
    
    const startTime = Date.now();
    
    try {
      // Read PDF file
      const pdfBuffer = fs.readFileSync(inputPath);
      
      // Extract text from PDF using pdf-parse
      const pdfData = await pdfParse(pdfBuffer);
      const textContent = pdfData.text || '';
      
      console.log(`Extracted text length: ${textContent.length} characters`);
      
      if (!textContent.trim()) {
        throw new Error('No text content found in PDF');
      }
      
      // Split text into paragraphs
      const paragraphs = textContent.split('\n\n').filter(p => p.trim().length > 0);
      
      // Create DOCX document using docx library
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.map(paragraph => {
            return new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  font: 'Arial',
                  size: 24 // 12pt
                })
              ],
              spacing: {
                after: 120 // 6pt spacing after paragraph
              }
            });
          })
        }]
      });

      // Generate DOCX buffer
      const docxBinary = await Packer.toBuffer(doc);
      
      // Save to temp directory
      const outputPath = TempFileManager.saveConvertedFile(docxBinary, outputFilename);
      
      const endTime = Date.now();
      const fileSize = TempFileManager.getFileSize(outputPath);
      
      console.log(`DOCX conversion completed in ${endTime - startTime}ms`);
      console.log(`Output file size: ${fileSize} bytes`);
      
      if (!TempFileManager.isValidFile(outputPath)) {
        throw new Error('Generated DOCX file is empty or invalid');
      }
      
      return outputPath;
    } catch (error) {
      console.error('PDF to DOCX conversion error:', error);
      throw new Error(`PDF to Word conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert Image to PDF
   * @param {string} inputPath - Path to input image file
   * @param {string} outputFilename - Desired output filename
   * @returns {string} Path to converted file
   */
  static async convertImageToPdf(inputPath, outputFilename) {
    console.log('Starting Image to PDF conversion...');
    console.log(`Input file size: ${TempFileManager.getFileSize(inputPath)} bytes`);
    
    const startTime = Date.now();
    
    try {
      // Process image with sharp
      const imageBuffer = fs.readFileSync(inputPath);
      
      // Convert image to RGB format and ensure proper quality
      const processedImage = await sharp(imageBuffer)
        .ensureAlpha()
        .toColorspace('rgb16')
        .jpeg({ quality: 90 })
        .toBuffer();

      // Create PDF with pdf-lib
      const pdfDoc = await PDFLibDocument.create();
      
      // Embed the image based on its format
      let image;
      try {
        image = await pdfDoc.embedJpg(processedImage);
      } catch (jpgError) {
        try {
          image = await pdfDoc.embedPng(processedImage);
        } catch (pngError) {
          // Fallback: try to embed as is
          image = await pdfDoc.embedJpg(imageBuffer);
        }
      }

      // Get image dimensions and calculate page size
      const { width, height } = image.scale(1.0);
      
      // Create page with proper dimensions (A4 aspect ratio or image aspect ratio)
      const pageWidth = Math.min(612, width); // Max width for standard PDF
      const pageHeight = Math.min(792, height); // Max height for standard PDF
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Calculate proper positioning to center the image
      const margin = 20;
      const imageWidth = Math.min(width, pageWidth - (margin * 2));
      const imageHeight = (imageWidth / width) * height;
      
      page.drawImage(image, {
        x: margin,
        y: pageHeight - imageHeight - margin,
        width: imageWidth,
        height: imageHeight,
      });

      const pdfBuffer = await pdfDoc.save();
      
      // Save to temp directory
      const outputPath = TempFileManager.saveConvertedFile(pdfBuffer, outputFilename);
      
      const endTime = Date.now();
      const fileSize = TempFileManager.getFileSize(outputPath);
      
      console.log(`Image to PDF conversion completed in ${endTime - startTime}ms`);
      console.log(`Output file size: ${fileSize} bytes`);
      
      if (!TempFileManager.isValidFile(outputPath)) {
        throw new Error('Generated PDF file is empty or invalid');
      }
      
      return outputPath;
    } catch (error) {
      console.error('Image to PDF conversion error:', error);
      throw new Error(`Image to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert EPUB to PDF
   * @param {string} inputPath - Path to input EPUB file
   * @param {string} outputFilename - Desired output filename
   * @returns {string} Path to converted file
   */
  static async convertEpubToPdf(inputPath, outputFilename) {
    console.log('Starting EPUB to PDF conversion...');
    console.log(`Input file size: ${TempFileManager.getFileSize(inputPath)} bytes`);
    
    const startTime = Date.now();
    
    try {
      // Parse EPUB using epub-parser
      const epub = await EPub.parse(inputPath);
      
      // Create PDF document using pdfkit
      const pdfDoc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      // Create write stream
      const outputPath = path.join(TempFileManager.CONVERTED_DIR, outputFilename);
      const writeStream = fs.createWriteStream(outputPath);
      pdfDoc.pipe(writeStream);
      
      // Set up PDF styling
      pdfDoc.font('Helvetica');
      pdfDoc.fontSize(12);
      
      // Add title
      pdfDoc.moveDown();
      pdfDoc.text('Converted from EPUB', { align: 'center' });
      pdfDoc.moveDown(2);
      
      // Add table of contents if available
      if (epub.toc && epub.toc.length > 0) {
        pdfDoc.text('Table of Contents', { underline: true });
        pdfDoc.moveDown();
        
        epub.toc.forEach((chapter, index) => {
          pdfDoc.text(`${index + 1}. ${chapter.title}`, {
            link: chapter.href,
            continued: true
          });
          pdfDoc.text(' ...');
          pdfDoc.moveDown(0.5);
        });
        
        pdfDoc.moveDown(2);
      }
      
      // Add chapters
      if (epub.chapters && epub.chapters.length > 0) {
        for (const chapter of epub.chapters) {
          // Add chapter title
          if (chapter.title) {
            pdfDoc.text(chapter.title, { underline: true });
            pdfDoc.moveDown();
          }
          
          // Add chapter content (remove HTML tags)
          const cleanText = chapter.content ? chapter.content.replace(/<[^>]*>/g, '') : '';
          if (cleanText.trim()) {
            pdfDoc.text(cleanText, {
              lineGap: 2,
              indent: 20
            });
          }
          
          pdfDoc.moveDown(2);
          
          // Check if we need a new page
          if (pdfDoc.y > 700) {
            pdfDoc.addPage();
          }
        }
      } else {
        // Fallback: extract text from all content
        const allContent = epub.content || '';
        const cleanText = allContent.replace(/<[^>]*>/g, '');
        if (cleanText.trim()) {
          pdfDoc.text(cleanText, {
            lineGap: 2,
            indent: 20
          });
        }
      }
      
      pdfDoc.end();
      
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          const endTime = Date.now();
          const fileSize = TempFileManager.getFileSize(outputPath);
          
          console.log(`EPUB to PDF conversion completed in ${endTime - startTime}ms`);
          console.log(`Output file size: ${fileSize} bytes`);
          
          if (!TempFileManager.isValidFile(outputPath)) {
            reject(new Error('Generated PDF file is empty or invalid'));
          } else {
            resolve(outputPath);
          }
        });
        
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('EPUB to PDF conversion error:', error);
      throw new Error(`EPUB to PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF to Image
   * @param {string} inputPath - Path to input PDF file
   * @param {string} outputFilename - Desired output filename
   * @param {string} format - Output format (jpg or png)
   * @returns {string} Path to converted file
   */
  static async convertPdfToImage(inputPath, outputFilename, format) {
    console.log(`Starting PDF to ${format.toUpperCase()} conversion...`);
    console.log(`Input file size: ${TempFileManager.getFileSize(inputPath)} bytes`);
    
    const startTime = Date.now();
    
    try {
      // Read PDF file
      const pdfBuffer = fs.readFileSync(inputPath);
      
      // Extract text from PDF
      const pdfData = await pdfParse(pdfBuffer);
      const textContent = pdfData.text || '';
      
      console.log(`Extracted text length: ${textContent.length} characters`);
      
      // Create image with the text content using sharp
      const text = textContent || 'PDF content extraction failed';
      
      // Create a simple image with the text
      const imageBuffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .composite([{
        input: Buffer.from(`<svg width="800" height="600">
          <rect width="800" height="600" fill="white"/>
          <text x="20" y="40" font-family="Arial" font-size="14" fill="black">${text}</text>
        </svg>`),
        top: 0,
        left: 0
      }])
      .toFormat(format)
      .toBuffer();

      // Save to temp directory
      const outputPath = TempFileManager.saveConvertedFile(imageBuffer, outputFilename);
      
      const endTime = Date.now();
      const fileSize = TempFileManager.getFileSize(outputPath);
      
      console.log(`PDF to ${format.toUpperCase()} conversion completed in ${endTime - startTime}ms`);
      console.log(`Output file size: ${fileSize} bytes`);
      
      if (!TempFileManager.isValidFile(outputPath)) {
        throw new Error(`Generated ${format.toUpperCase()} file is empty or invalid`);
      }
      
      return outputPath;
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error(`PDF to image conversion failed: ${error.message}`);
    }
  }

  /**
   * Get MIME type for file format
   * @param {string} format - File format
   * @returns {string} MIME type
   */
  static getMimeType(format) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };
    
    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get file extension from format
   * @param {string} format - Format name
   * @returns {string} File extension
   */
  static getFileExtension(format) {
    const extensions = {
      'pdf': 'pdf',
      'docx': 'docx',
      'jpg': 'jpg',
      'jpeg': 'jpeg',
      'png': 'png'
    };
    
    return extensions[format.toLowerCase()] || format.toLowerCase();
  }
}

export default ConversionService;