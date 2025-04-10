const jsforce = require('jsforce');
const sqlite3 = require('sqlite3').verbose();

// Salesforce credentials
const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';

// Salesforce connection
const conn = new jsforce.Connection({
  loginUrl: 'https://test.salesforce.com',
});

// Open SQLite DB
const db = new sqlite3.Database('./labels1.db');

// Initialize Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_labels1 (
      fullName TEXT PRIMARY KEY,
      language TEXT,
      value TEXT,
      shortDescription TEXT,
      de TEXT,
      zh_CN TEXT,
      zh_TW TEXT
    )
  `);
});

// Helper function to chunk an array
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function fetchAndStoreLabels(logCallback = logCallback) {
  try {
    await conn.login(username, password);
    logCallback('✅ Logged into Salesforce');

    // Fetch all custom labels
    const labels = await conn.metadata.list({ type: 'CustomLabel' });

    const labelChunks = chunkArray(labels, 10);

    // Read translations once
    const translations = await conn.metadata.read('Translations', ['de', 'zh_CN', 'zh_TW']);
    const tMap = { de: {}, zh_CN: {}, zh_TW: {} };

    ['de', 'zh_CN', 'zh_TW'].forEach(locale => {
      const customLabels = translations?.find(t => t.fullName === locale)?.customLabels || [];
      customLabels.forEach(label => {
        tMap[locale][label.name] = label.label;
      });
    });

    for (const chunk of labelChunks) {
      const fullNames = chunk.map(l => l.fullName);
      const metadata = await conn.metadata.read('CustomLabel', fullNames);
      const labelsArray = Array.isArray(metadata) ? metadata : [metadata];

      for (const label of labelsArray) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO custom_labels1 (
            fullName, language, value, shortDescription, de, zh_CN, zh_TW
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          label.fullName,
          label.language,
          label.value,
          label.shortDescription || '',
          tMap.de[label.fullName] || null,
          tMap.zh_CN[label.fullName] || null,
          tMap.zh_TW[label.fullName] || null
        );

        stmt.finalize();
        logCallback(`📥 Saved: ${label.fullName}`);
      }
    }

    logCallback('✅ All labels and translations saved in DB.');
  } catch (err) {
    console.error('❌ Error during fetch & store:', err);
  }
}

fetchAndStoreLabels();
