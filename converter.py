import sys
import os
from pathlib import Path

def pdf_to_word(input_path, output_path):
    try:
        import PyPDF2
        from docx import Document

        with open(input_path, 'rb') as file:
            pdf = PyPDF2.PdfReader(file)
            document = Document()

            for page in range(len(pdf.pages)):
                text = pdf.pages[page].extract_text()
                if text:
                    document.add_paragraph(text)

        document.save(output_path)

        if not os.path.exists(output_path):
            raise Exception('Output file not created')
        if os.path.getsize(output_path) == 0:
            raise Exception('Output file is empty')

        print(f'SUCCESS: PDF to Word completed. Output: {output_path}')

    except Exception as e:
        print(f'ERROR: PDF to Word failed: {str(e)}', file=sys.stderr)
        sys.exit(1)


def epub_to_pdf(input_path, output_path):
    try:
        import subprocess
        result = subprocess.run(
            ['ebook-convert', input_path, output_path],
            timeout=120,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            raise Exception(result.stderr)
        if not os.path.exists(output_path):
            raise Exception('Output file not created')
        if os.path.getsize(output_path) == 0:
            raise Exception('Output file is empty')

        print(f'SUCCESS: EPUB to PDF completed. Output: {output_path}')

    except Exception as e:
        print(f'ERROR: EPUB to PDF failed: {str(e)}', file=sys.stderr)
        sys.exit(1)


def image_to_pdf(input_path, output_path):
    try:
        from PIL import Image

        file = os.path.basename(input_path)
        ext = file.split('.')[-1].lower()

        if ext not in ('png', 'jpg', 'jpeg'):
            raise Exception(f'Unsupported image format: {ext}')

        image = Image.open(input_path)
        image_converted = image.convert('RGB')
        image_converted.save(output_path)

        if not os.path.exists(output_path):
            raise Exception('Output file not created')
        if os.path.getsize(output_path) == 0:
            raise Exception('Output file is empty')

        print(f'SUCCESS: Image to PDF completed. Output: {output_path}')

    except Exception as e:
        print(f'ERROR: Image to PDF failed: {str(e)}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print('Usage: python3 converter.py <conversion-type> <input-path> <output-path>')
        print('Types: pdf-to-word, epub-to-pdf, image-to-pdf')
        sys.exit(1)

    conversion_type = sys.argv[1]
    input_path = sys.argv[2]
    output_path = sys.argv[3]

    if not os.path.exists(input_path):
        print(f'ERROR: Input file not found: {input_path}', file=sys.stderr)
        sys.exit(1)

    if conversion_type == 'pdf-to-word':
        pdf_to_word(input_path, output_path)
    elif conversion_type == 'epub-to-pdf':
        epub_to_pdf(input_path, output_path)
    elif conversion_type == 'image-to-pdf':
        image_to_pdf(input_path, output_path)
    else:
        print(f'ERROR: Unknown conversion type: {conversion_type}', file=sys.stderr)
        sys.exit(1)