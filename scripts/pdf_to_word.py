import sys
import PyPDF2
from docx import Document

def pdf_to_word(input_path, output_path):
    try:
        # Open PDF in read binary mode
        with open(input_path, 'rb') as file:
            pdf = PyPDF2.PdfReader(file)
            document = Document()

            for page_num in range(len(pdf.pages)):
                # Extract text from current page
                text = pdf.pages[page_num].extract_text()
                if text:
                    document.add_paragraph(text)
                # Add page break between pages
                if page_num < len(pdf.pages) - 1:
                    document.add_page_break()

            document.save(output_path)
            print(f'Success: saved to {output_path}')

    except Exception as e:
        print(f'Error: {str(e)}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python3 pdf_to_word.py <input.pdf> <output.docx>', file=sys.stderr)
        sys.exit(1)
    pdf_to_word(sys.argv[1], sys.argv[2])