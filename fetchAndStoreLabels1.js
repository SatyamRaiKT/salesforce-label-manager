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
const db = new sqlite3.Database('./labels.db');

// Initialize Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_labels (
      fullName TEXT PRIMARY KEY,
      language TEXT,
      value TEXT,
      shortDescription TEXT,
      de TEXT,
      zn_CH TEXT,
      zn_TW TEXT
    )
  `);
});

async function fetchAndStoreLabels() {
  try {
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    // Fetch all custom labels (in chunks)
    const labels = await conn.metadata.list({ type: 'CustomLabel' });

    // Salesforce Metadata Read Limit: 10 per call
    const chunks = [];
    for (let i = 0; i < labels.length; i += 10) {
      chunks.push(labels.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const fullNames = chunk.map(l => l.fullName);
      const metadata = await conn.metadata.read('CustomLabel', fullNames);

      const labelsArray = Array.isArray(metadata) ? metadata : [metadata];

      // Read translations from each locale
      const translations = await conn.metadata.read('Translations', ['de', 'zn_CH', 'zn_TW']);
      const tMap = { de: {}, zn_CH: {}, zn_TW: {} };

      ['de', 'zn_CH', 'zn_TW'].forEach(locale => {
        const customLabels = translations?.find(t => t.fullName === locale)?.customLabels || [];
        customLabels.forEach(label => {
          tMap[locale][label.name] = label.label;
        });
      });

      for (const label of labelsArray) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO custom_labels (
            fullName, language, value, shortDescription, de, zn_CH, zn_TW
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          label.fullName,
          label.language,
          label.value,
          label.shortDescription || '',
          tMap.de[label.fullName] || null,
          tMap.zn_CH[label.fullName] || null,
          tMap.zn_TW[label.fullName] || null
        );

        stmt.finalize();
        console.log(`📥 Saved: ${label.fullName}`);
      }
    }

    console.log('✅ All labels and translations saved in DB.');
  } catch (err) {
    console.error('❌ Error during fetch & store:', err);
  }
}

fetchAndStoreLabels();
