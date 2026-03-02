export interface FormatConfig {
  value: string;
  label: string;
  icon?: string;
}

export interface ConversionConfig {
  inputFormats: FormatConfig[];
  outputFormats: FormatConfig[];
  supportedConversions: string[];
}

// Supported file formats
export const SUPPORTED_FORMATS: Record<string, FormatConfig> = {
  // Input formats
  pdf: { value: 'pdf', label: 'PDF' },
  epub: { value: 'epub', label: 'EPUB' },
  jpg: { value: 'jpg', label: 'JPG' },
  jpeg: { value: 'jpeg', label: 'JPEG' },
  png: { value: 'png', label: 'PNG' },
  gif: { value: 'gif', label: 'GIF' },
  webp: { value: 'webp', label: 'WebP' },
  doc: { value: 'doc', label: 'DOC' },
  docx: { value: 'docx', label: 'DOCX' },
  txt: { value: 'txt', label: 'TXT' },
  
  // Output formats
  pdf_out: { value: 'pdf', label: 'PDF' },
  epub_out: { value: 'epub', label: 'EPUB' },
  jpg_out: { value: 'jpg', label: 'JPG' },
  png_out: { value: 'png', label: 'PNG' },
  docx_out: { value: 'docx', label: 'DOCX' },
};

// Conversion mappings
export const CONVERSION_CONFIG: ConversionConfig = {
  inputFormats: [
    SUPPORTED_FORMATS.pdf,
    SUPPORTED_FORMATS.epub,
    SUPPORTED_FORMATS.jpg,
    SUPPORTED_FORMATS.jpeg,
    SUPPORTED_FORMATS.png,
    SUPPORTED_FORMATS.gif,
    SUPPORTED_FORMATS.webp,
    SUPPORTED_FORMATS.doc,
    SUPPORTED_FORMATS.docx,
    SUPPORTED_FORMATS.txt,
  ],
  outputFormats: [
    SUPPORTED_FORMATS.pdf_out,
    SUPPORTED_FORMATS.epub_out,
    SUPPORTED_FORMATS.jpg_out,
    SUPPORTED_FORMATS.png_out,
    SUPPORTED_FORMATS.docx_out,
  ],
  supportedConversions: [
    'pdf-to-epub',
    'pdf-to-jpg',
    'pdf-to-png',
    'pdf-to-docx',
    'epub-to-pdf',
    'jpg-to-pdf',
    'jpeg-to-pdf',
    'png-to-pdf',
    'gif-to-pdf',
    'webp-to-pdf',
    'doc-to-pdf',
    'docx-to-pdf',
    'txt-to-pdf',
  ],
};

// Image-specific formats for ImageToPdfPage
export const IMAGE_FORMATS = [
  SUPPORTED_FORMATS.jpg,
  SUPPORTED_FORMATS.jpeg,
  SUPPORTED_FORMATS.png,
  SUPPORTED_FORMATS.gif,
  SUPPORTED_FORMATS.webp,
];

// MIME types for file validation
export const MIME_TYPES = {
  pdf: ['application/pdf'],
  epub: ['application/epub+zip'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
};

// Get MIME types for a given format
export const getMimeTypes = (format: string): string[] => {
  return MIME_TYPES[format as keyof typeof MIME_TYPES] || [];
};

// Check if a conversion is supported
export const isConversionSupported = (fromFormat: string, toFormat: string): boolean => {
  const conversionKey = `${fromFormat}-to-${toFormat}`;
  return CONVERSION_CONFIG.supportedConversions.includes(conversionKey);
};

// Get all supported output formats for a given input format
export const getSupportedOutputFormats = (inputFormat: string): FormatConfig[] => {
  const supported = CONVERSION_CONFIG.supportedConversions
    .filter(conversion => conversion.startsWith(`${inputFormat}-to-`))
    .map(conversion => conversion.split('-to-')[1])
    .filter(format => SUPPORTED_FORMATS[`${format}_out`])
    .map(format => SUPPORTED_FORMATS[`${format}_out`]);
  
  return supported;
};