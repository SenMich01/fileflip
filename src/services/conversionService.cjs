const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../scripts');

// PDF to Word using Python + PyPDF2
async function pdfToWord(inputPath) {
  try {
    console.log('Starting PDF to Word conversion...');
    console.log('Input file size:', fs.statSync(inputPath).size, 'bytes');

    const outputPath = `/tmp/converted_${Date.now()}.docx`;

    execSync(
      `python3 ${scriptsDir}/pdf_to_word.py "${inputPath}" "${outputPath}"`,
      { timeout: 60000 }
    );

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

// Image to PDF using Python + Pillow
async function imageToPdf(inputPath) {
  try {
    console.log('Starting Image to PDF conversion...');
    console.log('Input file size:', fs.statSync(inputPath).size, 'bytes');

    const outputPath = `/tmp/converted_${Date.now()}.pdf`;

    execSync(
      `python3 ${scriptsDir}/image_to_pdf.py "${inputPath}" "${outputPath}"`,
      { timeout: 60000 }
    );

    if (!fs.existsSync(outputPath)) throw new Error('Output file not created');
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty');

    console.log('Image to PDF success. Output size:', fs.statSync(outputPath).size, 'bytes');
    return outputPath;
  } catch (err) {
    throw new Error('Image to PDF failed: ' + err.message);
  }
}

module.exports = { pdfToWord, epubToPdf, imageToPdf };