const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv'); // For CSV export
const XLSX = require('xlsx'); // For XLSX export

// Open SQLite DB
const db = new sqlite3.Database('./labels1.db');

// Function to export records
function exportRecords(format) {
  db.all('SELECT * FROM custom_label_updated', (err, rows) => {
    if (err) {
      console.error('❌ Error reading from database:', err);
      return;
    }

    console.log('📥 Retrieved rows from database:', rows);

    if (format === 'csv') {
      // Export as CSV
      try {
        const csv = parse(rows);
        const outputPath = path.join(__dirname, 'exported_labels.csv');

        // Write CSV to a file
        fs.writeFileSync(outputPath, csv);
        console.log(`✅ Records exported successfully to ${outputPath}`);
      } catch (csvError) {
        console.error('❌ Error converting records to CSV:', csvError);
      }
    } else if (format === 'xlsx') {
      // Export as XLSX
      try {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CustomLabels');

        const outputPath = path.join(__dirname, 'exported_labels.xlsx');

        // Write XLSX to a file
        XLSX.writeFile(workbook, outputPath);
        console.log(`✅ Records exported successfully to ${outputPath}`);
      } catch (xlsxError) {
        console.error('❌ Error converting records to XLSX:', xlsxError);
      }
    } else {
      console.error('❌ Invalid format specified. Please choose "csv" or "xlsx".');
    }
  });
}

const userChoice = 'xlsx'; 
exportRecords(userChoice);