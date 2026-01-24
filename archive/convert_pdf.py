#!/usr/bin/env python3
"""
Convert PDF to PNG images - one image per page
Saves images as 1.png, 2.png, etc. in public/pdf-pages/
"""

import os
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Error: PyMuPDF not installed. Install it with: pip install PyMuPDF")
    sys.exit(1)


def convert_pdf_to_images(pdf_path: str, output_dir: str, scale: float = 2.0, separate_cover_back: bool = True):
    """
    Convert PDF pages to PNG images
    
    Args:
        pdf_path: Path to the PDF file
        output_dir: Directory to save PNG images
        scale: Scale factor for image quality (higher = better quality, larger files)
        separate_cover_back: If True, export first page as Cover.png, last page as back.png,
                            and start counting from page 2 as 1.png. If False, export all as 1.png, 2.png, etc.
    """
    # Check if PDF exists
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return False
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Open PDF
        pdf_document = fitz.open(pdf_path)
        total_pages = len(pdf_document)
        
        print(f"Converting {total_pages} pages from {pdf_path}...")
        if separate_cover_back:
            print("Mode: Separate cover/back (Cover.png, back.png, then 1.png, 2.png, ...)")
        else:
            print("Mode: Sequential numbering (1.png, 2.png, ...)")
        
        converted_pages = []
        
        if separate_cover_back and total_pages >= 2:
            # Convert first page as Cover.png
            page = pdf_document[0]
            zoom = scale
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            output_path = os.path.join(output_dir, "Cover.png")
            pix.save(output_path)
            converted_pages.append("Cover.png")
            print(f"  ✓ Converted page 1/{total_pages} → Cover.png")
            
            # Convert middle pages as 1.png, 2.png, etc. (starting from page 2)
            for page_num in range(1, total_pages - 1):
                page = pdf_document[page_num]
                zoom = scale
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                output_path = os.path.join(output_dir, f"{page_num}.png")
                pix.save(output_path)
                converted_pages.append(f"{page_num}.png")
                print(f"  ✓ Converted page {page_num + 1}/{total_pages} → {page_num}.png")
            
            # Convert last page as back.png
            page = pdf_document[total_pages - 1]
            zoom = scale
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            output_path = os.path.join(output_dir, "back.png")
            pix.save(output_path)
            converted_pages.append("back.png")
            print(f"  ✓ Converted page {total_pages}/{total_pages} → back.png")
            
        elif separate_cover_back and total_pages == 1:
            # Only one page - save as Cover.png
            page = pdf_document[0]
            zoom = scale
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            output_path = os.path.join(output_dir, "Cover.png")
            pix.save(output_path)
            converted_pages.append("Cover.png")
            print(f"  ✓ Converted page 1/1 → Cover.png")
            
        else:
            # Sequential numbering mode
            for page_num in range(total_pages):
                page = pdf_document[page_num]
                zoom = scale
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                output_path = os.path.join(output_dir, f"{page_num + 1}.png")
                pix.save(output_path)
                converted_pages.append(f"{page_num + 1}.png")
                print(f"  ✓ Converted page {page_num + 1}/{total_pages} → {page_num + 1}.png")
        
        # Close PDF
        pdf_document.close()
        
        print(f"\nSuccess! Converted {len(converted_pages)} pages to {output_dir}")
        return True
        
    except Exception as e:
        print(f"Error converting PDF: {e}")
        return False


def main():
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Convert PDF to PNG images')
    parser.add_argument(
        '--no-separate-cover-back',
        action='store_true',
        help='Disable separate cover/back mode. All pages will be numbered sequentially (1.png, 2.png, ...)'
    )
    parser.add_argument(
        '--scale',
        type=float,
        default=2.0,
        help='Scale factor for image quality (default: 2.0)'
    )
    
    args = parser.parse_args()
    separate_cover_back = not args.no_separate_cover_back
    
    # Get script directory
    script_dir = Path(__file__).parent.absolute()
    
    # Set paths relative to project root
    pdf_path = script_dir / "public" / "Portfolio_EzzahirAnass_2024.pdf"
    output_dir = script_dir / "public" / "pdf-pages"
    
    # Convert PDF
    success = convert_pdf_to_images(
        str(pdf_path), 
        str(output_dir), 
        scale=args.scale,
        separate_cover_back=separate_cover_back
    )
    
    if success:
        print(f"\nImages saved to: {output_dir}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()

