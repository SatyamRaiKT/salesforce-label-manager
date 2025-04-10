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

async function syncLabelsToSalesforce(logCallback = logCallback) {
  try {
    await conn.login(username, password);
    logCallback('✅ Logged into Salesforce');

    const baseLabels = [];
    const translations = {
      de: [],
      zh_CN: [],
      zh_TW: []
    };

    // Read labels from DB
    await new Promise((resolve, reject) => {
      db.all('SELECT * FROM custom_labels1', async (err, rows) => {
        if (err) return reject(err);

        for (const row of rows) {
          baseLabels.push({
            fullName: row.fullName,
            language: row.language,
            value: row.value,
            shortDescription: row.shortDescription || '',
            protected: false
          });

          if (row.de) {
            translations.de.push({
              name: row.fullName,
              label: row.de
            });
          }
          if (row.zh_CN) {
            translations.zh_CN.push({
              name: row.fullName,
              label: row.zh_CN
            });
          }
          if (row.zh_TW) {
            translations.zh_TW.push({
              name: row.fullName,
              label: row.zh_TW
            });
          }
        }

        resolve();
      });
    });

    // Helper function to upsert in safe chunks
    async function safeUpsert(type, items, label = '') {
      const chunkSize = 10;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        try {
          const result = await conn.metadata.upsert(type, chunk);
          logCallback(`✅ Synced ${label} chunk ${i / chunkSize + 1}`);
        } catch (error) {
          console.error(`❌ Chunk ${i / chunkSize + 1} failed for ${label}: ${error.message}`);
          logCallback('🔍 Retrying one by one...');
          for (const item of chunk) {
            try {
              const res = await conn.metadata.upsert(type, item);
              logCallback(`✔️ Synced: ${item.fullName || item.name}`);
            } catch (err) {
              console.error(`❌ Failed: ${item.fullName || item.name} — ${err.message}`);
            }
          }
        }
      }
    }

    // Sync base labels
    logCallback('\n🔄 Syncing base custom labels...');
    await safeUpsert('CustomLabel', baseLabels, 'base labels');

    // Sync translations
    for (const locale of ['de', 'zh_CN', 'zh_TW']) {
      if (translations[locale].length === 0) continue;

      logCallback(`\n🌍 Syncing translations for locale: ${locale}`);
      const existingTranslation = await conn.metadata.read('Translations', [locale]);

      const updatedTranslation = {
        fullName: locale,
        customLabels: [
          ...(existingTranslation.customLabels || []),
          ...translations[locale]
        ]
      };

      try {
        const result = await conn.metadata.upsert('Translations', updatedTranslation);
        logCallback(`✅ Translations synced for ${locale}:`, result);
      } catch (err) {
        console.error(`❌ Failed syncing translations for ${locale}:`, err.message);
      }
    }

    logCallback('\n🎉 All labels & translations synced to Salesforce!');
  } catch (err) {
    console.error('❌ Sync failed:', err);
  }
}

syncLabelsToSalesforce();
