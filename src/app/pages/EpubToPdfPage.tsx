import { useState } from 'react'

export default function EpubToPdfPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleConvert = () => {
    // Handle EPUB to PDF conversion
    console.log('Converting EPUB to PDF:', file)
  }

  return (
    <div>
      <h1>EPUB to PDF Converter</h1>
      <input type="file" accept=".epub" onChange={handleFileChange} />
      <button onClick={handleConvert} disabled={!file}>
        Convert to PDF
      </button>
    </div>
  )
}