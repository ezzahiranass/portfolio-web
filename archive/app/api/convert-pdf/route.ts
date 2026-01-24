import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore - canvas doesn't have perfect TypeScript support
import { createCanvas } from 'canvas';
// @ts-ignore - pdfjs-dist legacy build path
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Disable worker for Node.js (not needed for server-side rendering)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'Portfolio_EzzahirAnass_2024.pdf');
    const outputDir = path.join(process.cwd(), 'public', 'pdf-pages');

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      );
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read PDF file
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    const convertedPages: number[] = [];

    // Convert each page to PNG
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for good quality

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render PDF page to canvas
      await page.render({
        canvasContext: context as any,
        viewport: viewport
      }).promise;

      // Convert canvas to PNG buffer
      const buffer = canvas.toBuffer('image/png');

      // Save image
      const outputPath = path.join(outputDir, `${pageNum}.png`);
      fs.writeFileSync(outputPath, buffer);

      convertedPages.push(pageNum);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully converted ${convertedPages.length} pages`,
      pagesConverted: convertedPages.length,
      pages: convertedPages
    });

  } catch (error: any) {
    console.error('Error converting PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

