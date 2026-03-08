import { useState } from 'react'

export default function ImageToPdfPage() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleConvert = () => {
    // Handle image to PDF conversion
    console.log('Converting image to PDF:', file)
  }

  return (
    <div>
      <h1>Image to PDF Converter</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleConvert} disabled={!file}>
        Convert to PDF
      </button>
    </div>
  )
}