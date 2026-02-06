
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../');
const outputDir = path.join(__dirname, '../src/data');

// Create output dir if not exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function extractExcel() {
    const excelFile = path.join(dataDir, '27届.xlsx');

    if (!fs.existsSync(excelFile)) {
        console.error("Excel file not found:", excelFile);
        return;
    }

    const workbook = xlsx.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Normalize keys if needed (assuming headers like "Name", "GPA", etc.)
    // We'll log the first row to check structure
    if (data.length > 0) {
        console.log("First row keys:", Object.keys(data[0]));
    }

    fs.writeFileSync(path.join(outputDir, 'excel_data.json'), JSON.stringify(data, null, 2));
    console.log(`Extracted ${data.length} records to src/data/excel_data.json`);
}

extractExcel();
