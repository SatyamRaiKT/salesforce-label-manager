const jsforce = require('jsforce');
const sqlite3 = require('sqlite3').verbose();

// Salesforce credentials
const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';

const conn = new jsforce.Connection({
  loginUrl: 'https://test.salesforce.com',
});

// Open SQLite DB
const db = new sqlite3.Database('./labels1.db');

async function syncToSalesforce() {
  try {
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    db.all(`SELECT * FROM custom_label_updated`, async (err, rows) => {
      if (err) throw err;

      // Step 1: Sync base labels
      const baseLabels = rows.map(row => ({
        fullName: row.fullName,
        language: row.language || 'en_US',
        protected: false,
        shortDescription: row.shortDescription || '',
        value: row.value || '',
      }));

      const chunkSize = 10;
      for (let i = 0; i < baseLabels.length; i += chunkSize) {
        const chunk = baseLabels.slice(i, i + chunkSize);
        const result = await conn.metadata.upsert('CustomLabel', chunk);
        console.log(`⬆️ Base Labels Synced (chunk ${i / 10 + 1}):`, result);
      }

      // Step 2: Group translations per locale
      const locales = ['de', 'zn_CH', 'zn_TW'];
      const translationMap = {
        de: [],
        zn_CH: [],
        zn_TW: [],
      };

      rows.forEach(row => {
        locales.forEach(locale => {
          if (row[locale]) {
            translationMap[locale].push({
              name: row.fullName,
              label: row[locale],
            });
          }
        });
      });

      // Step 3: Upsert translations
      for (const locale of locales) {
        const translations = translationMap[locale];
        if (translations.length === 0) continue;

        const existing = await conn.metadata.read('Translations', [locale]);
        const existingLabels = existing?.customLabels || [];

        const updatedTranslations = {
          fullName: locale,
          customLabels: [...existingLabels.filter(el => !translations.find(t => t.name === el.name)), ...translations],
        };

        const result = await conn.metadata.upsert('Translations', updatedTranslations);
        console.log(`🌐 Translations Synced for [${locale}]:`, result);
      }

      console.log('✅ Sync to Salesforce complete!');
    });

  } catch (err) {
    console.error('❌ Sync Failed:', err);
  }
}

syncToSalesforce();
