
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path: parent of student-dashboard (where the PDFs are)
const dataDir = path.resolve(__dirname, '../../');
const outputDir = __dirname; // Save in scripts folder

async function extractText() {
    try {
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf') && f.includes('成长画像'));
        const results = [];

        console.log(`Found ${files.length} PDFs in ${dataDir}`);

        for (const file of files) {
            const filePath = path.join(dataDir, file);
            const dataBuffer = fs.readFileSync(filePath);

            try {
                // Initialize parser with data
                const parser = new PDFParse({ data: dataBuffer });
                const data = await parser.getText();

                results.push({
                    filename: file,
                    text: data.text
                });
                console.log(`Processed ${file}`);
            } catch (error) {
                console.error(`Error processing ${file}:`, error);
            }
        }

        fs.writeFileSync(path.join(outputDir, 'temp_raw_data.json'), JSON.stringify(results, null, 2));
        console.log('Extraction complete. Saved to scripts/temp_raw_data.json');
    } catch (err) {
        console.error("Error detecting files:", err);
    }
}

extractText();
