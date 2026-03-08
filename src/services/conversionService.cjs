const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runPythonConverter(type, inputPath, outputPath) {
  try {
    const result = execSync(
      `python3 ${path.join(__dirname, '../converter.py')} ${type} "${inputPath}" "${outputPath}"`,
      {
        timeout: 120000,
        env: {
          ...process.env,
          HOME: '/tmp',
          TMPDIR: '/tmp'
        }
      }
    )
    console.log('Converter output:', result.toString())
  } catch (err) {
    throw new Error(err.stderr ? err.stderr.toString() : err.message)
  }
}

async function pdfToWord(inputPath) {
  const outputPath = `/tmp/converted_${Date.now()}.docx`
  runPythonConverter('pdf-to-word', inputPath, outputPath)
  if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
  if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')
  console.log('PDF to Word success. Size:', fs.statSync(outputPath).size, 'bytes')
  return outputPath
}

async function epubToPdf(inputPath) {
  const outputPath = `/tmp/converted_${Date.now()}.pdf`
  runPythonConverter('epub-to-pdf', inputPath, outputPath)
  if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
  if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')
  console.log('EPUB to PDF success. Size:', fs.statSync(outputPath).size, 'bytes')
  return outputPath
}

async function imageToPdf(inputPath) {
  const outputPath = `/tmp/converted_${Date.now()}.pdf`
  runPythonConverter('image-to-pdf', inputPath, outputPath)
  if (!fs.existsSync(outputPath)) throw new Error('Output file not created')
  if (fs.statSync(outputPath).size === 0) throw new Error('Output file is empty')
  console.log('Image to PDF success. Size:', fs.statSync(outputPath).size, 'bytes')
  return outputPath
}

module.exports = { pdfToWord, epubToPdf, imageToPdf }