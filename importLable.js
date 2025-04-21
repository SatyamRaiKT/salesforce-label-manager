const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');

// Open SQLite DB
const db = new sqlite3.Database('./labels1.db');

// Function to insert or update into DB manually
/*function upsertRecord(row) {
  const {
    fullName,
    value,
    language,
    shortDescription,
    de,
    zh_CN,
    zh_TW,
    protected: isProtected, // Avoid using reserved word
  } = row;

  const labelName = fullName;
  const translationText = value;
  const protectedVal = isProtected;

  // Step 1: Check if record exists
  const checkSql = `
    SELECT COUNT(*) as count
    FROM custom_label_updated
    WHERE fullName = ? AND language = ?
  `;

  db.get(checkSql, [labelName, language], (err, result) => {
    if (err) {
      console.error(`❌ Error checking existence for "${labelName}" (${language})`, err);
      return;
    }

    if (result.count > 0) {
      // Record exists → UPDATE
      const updateSql = `
        UPDATE custom_label_updated
        SET value = ?, protected = ?
        WHERE fullName = ? AND language = ?
      `;
      db.run(updateSql, [translationText, protectedVal, labelName, language], (err) => {
        if (err) {
          console.error(`❌ Failed to update "${labelName}" (${language})`, err);
        } else {
          console.log(`🔄 Updated: ${labelName} (${language})`);
        }
      });
    } else {
      // Record does not exist → INSERT
      const insertSql = `
        INSERT INTO custom_label_updated (fullName, value, language, protected)
        VALUES (?, ?, ?, ?)
      `;
      db.run(insertSql, [labelName, translationText, language, protectedVal], (err) => {
        if (err) {
          console.error(`❌ Failed to insert "${labelName}" (${language})`, err);
        } else {
          console.log(`✅ Inserted: ${labelName} (${language})`);
        }
      });
    }
  });
}*/
function upsertRecord(row) {
  const {
    fullName,
    value,
    language,
    shortDescription,
    de,
    zh_CN,
    zh_TW,
    protected: isProtected,
  } = row;

  const labelName = fullName;
  const protectedVal = isProtected ?? 0;

  const checkSql = `
    SELECT COUNT(*) as count
    FROM custom_label_updated
    WHERE fullName = ? AND language = ?
  `;

  db.get(checkSql, [labelName, language], (err, result) => {
    if (err) {
      console.error(`❌ Error checking existence for "${labelName}" (${language})`, err);
      return;
    }

    if (result.count > 0) {
      // Update existing record
      const updateSql = `
        UPDATE custom_label_updated
        SET value = ?, shortDescription = ?, protected = ?, de = ?, zh_CN = ?, zh_TW = ?
        WHERE fullName = ? AND language = ?
      `;
      db.run(updateSql, [value, shortDescription, protectedVal, de, zh_CN, zh_TW, labelName, language], (err) => {
        if (err) {
          console.error(`❌ Failed to update "${labelName}" (${language})`, err);
        } else {
          console.log(`🔄 Updated: ${labelName} (${language})`);
        }
      });
    } else {
      // Insert new record
      const insertSql = `
        INSERT INTO custom_label_updated 
          (fullName, value, language, shortDescription, protected, de, zh_CN, zh_TW)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(insertSql, [labelName, value, language, shortDescription, protectedVal, de, zh_CN, zh_TW], (err) => {
        if (err) {
          console.error(`❌ Failed to insert "${labelName}" (${language})`, err);
        } else {
          console.log(`✅ Inserted: ${labelName} (${language})`);
        }
      });
    }
  });
}


// Import Function
function importRecords(format, filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ File does not exist:', filePath);
    return;
  }

  let rows = [];

  try {
    if (format === 'csv') {
      const fileContent = fs.readFileSync(filePath);
      rows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } else if (format === 'xlsx') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      console.error('❌ Unsupported format. Use "csv" or "xlsx".');
      return;
    }

    console.log(`📥 Importing ${rows.length} rows...`);
    rows.forEach(upsertRecord);
  } catch (err) {
    console.error('❌ Error importing records:', err);
  }
}

// Example usage:
const importFilePath = path.join(__dirname, 'import_labels.xlsx'); // or .csv
const importFormat = 'xlsx'; // or 'csv'
// At the bottom of importLabel.js
module.exports = {
  importRecords
};


//importRecords(importFormat, importFilePath);
