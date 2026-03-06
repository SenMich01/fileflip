const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

// PDF to Word
async function pdfToWord(inputPath) {
  try {
    console.log('Starting PDF to Word conversion...');
    console.log('Input file size:', fs.statSync(inputPath).size, 'bytes');
    execSync(`libreoffice --headless --convert-to docx "${inputPath}" --outdir /tmp`, {
      timeout: 60000
    });
    const filename = path.basename(inputPath).replace(/\.pdf$/i, '.docx');
    const outputPath = `/tmp/${filename}`;
    if (!fs.existsSync(outputPath)) throw new Error('Output file not created');
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty');
    console.log('PDF to Word success. Output size:', fs.statSync(outputPath).size, 'bytes');
    return outputPath;
  } catch (err) {
    throw new Error('PDF to Word failed: ' + err.message);
  }
}

// EPUB to PDF
async function epubToPdf(inputPath) {
  try {
    console.log('Starting EPUB to PDF conversion...');
    console.log('Input file size:', fs.statSync(inputPath).size, 'bytes');
    const outputPath = `/tmp/converted_${Date.now()}.pdf`;
    execSync(`ebook-convert "${inputPath}" "${outputPath}"`, {
      timeout: 60000
    });
    if (!fs.existsSync(outputPath)) throw new Error('Output file not created');
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty');
    console.log('EPUB to PDF success. Output size:', fs.statSync(outputPath).size, 'bytes');
    return outputPath;
  } catch (err) {
    throw new Error('EPUB to PDF failed: ' + err.message);
  }
}

// Image to PDF
async function imageToPdf(inputPath) {
  try {
    console.log('Starting Image to PDF conversion...');
    console.log('Input file size:', fs.statSync(inputPath).size, 'bytes');
    const outputPath = `/tmp/converted_${Date.now()}.pdf`;
    const imageBuffer = await sharp(inputPath).png().toBuffer();
    const metadata = await sharp(inputPath).metadata();
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(imageBuffer);
    const page = pdfDoc.addPage([metadata.width, metadata.height]);
    page.drawImage(image, {
      x: 0, y: 0,
      width: metadata.width,
      height: metadata.height
    });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty');
    console.log('Image to PDF success. Output size:', fs.statSync(outputPath).size, 'bytes');
    return outputPath;
  } catch (err) {
    throw new Error('Image to PDF failed: ' + err.message);
  }
}

module.exports = { pdfToWord, epubToPdf, imageToPdf };