const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, '../scripts');

// PDF to Word using LibreOffice with isolated user profile
async function pdfToWord(inputPath) {
  try {
    console.log('Starting PDF to Word conversion...')
    const outputDir = '/tmp'
    
    // Set LibreOffice user profile to avoid conflicts
    const userProfile = `/tmp/lo_profile_${Date.now()}`
    fs.mkdirSync(userProfile, { recursive: true })

    execSync(
      `libreoffice --headless -env:UserInstallation=file://${userProfile} --convert-to docx:"Microsoft Word 2007-2019 XML" "${inputPath}" --outdir ${outputDir}`,
      {
        timeout: 120000,
        env: {
          ...process.env,
          HOME: userProfile,
          TMPDIR: '/tmp'
        }
      }
    )

    // Clean up profile
    try { execSync(`rm -rf ${userProfile}`) } catch(e) {}

    const filename = path.basename(inputPath).replace(/\.[^.]+$/i, '.docx')
    const outputPath = `/tmp/${filename}`

    if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')

    console.log('PDF to Word success. Output size:', fs.statSync(outputPath).size, 'bytes')
    return outputPath
  } catch (err) {
    throw new Error('PDF to Word failed: ' + err.message)
  }
}

// EPUB to PDF with proper environment settings
async function epubToPdf(inputPath) {
  try {
    console.log('Starting EPUB to PDF conversion...')
    const outputPath = `/tmp/converted_${Date.now()}.pdf`

    execSync(`ebook-convert "${inputPath}" "${outputPath}" --enable-heuristics`, {
      timeout: 120000,
      env: {
        ...process.env,
        HOME: '/tmp'
      }
    })

    if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')

    console.log('EPUB to PDF success. Output size:', fs.statSync(outputPath).size, 'bytes')
    return outputPath
  } catch (err) {
    throw new Error('EPUB to PDF failed: ' + err.message)
  }
}

// Image to PDF using Python + Pillow with proper environment
async function imageToPdf(inputPath) {
  try {
    console.log('Starting Image to PDF conversion...')
    const outputPath = `/tmp/converted_${Date.now()}.pdf`

    execSync(
      `python3 ${scriptsDir}/image_to_pdf.py "${inputPath}" "${outputPath}"`,
      {
        timeout: 120000,
        env: {
          ...process.env,
          HOME: '/tmp',
          TMPDIR: '/tmp'
        }
      }
    )

    if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
    if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')

    console.log('Image to PDF success. Output size:', fs.statSync(outputPath).size, 'bytes')
    return outputPath
  } catch (err) {
    throw new Error('Image to PDF failed: ' + err.message)
  }
}

module.exports = { pdfToWord, epubToPdf, imageToPdf };