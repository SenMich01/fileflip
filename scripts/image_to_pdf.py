import sys
import os
from PIL import Image

def image_to_pdf(input_path, output_path):
    try:
        # Open image and convert to RGB
        image = Image.open(input_path)
        image_converted = image.convert('RGB')

        # Save as PDF
        image_converted.save(output_path, 'PDF', resolution=100.0)
        print(f'Success: saved to {output_path}')

    except Exception as e:
        print(f'Error: {str(e)}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python3 image_to_pdf.py <input_image> <output.pdf>', file=sys.stderr)
        sys.exit(1)
    image_to_pdf(sys.argv[1], sys.argv[2])