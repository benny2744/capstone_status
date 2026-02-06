import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';

async function extractPDF() {
    const pdfPath = '/Users/bennyz/Documents/~004 Capstone/26-27 Cycle/高中2025-2026学年第一学期成长画像——蒋礼泽 Eason Jiang.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    console.log('=== FULL PDF TEXT ===');
    console.log(data.text);
}
extractPDF();
