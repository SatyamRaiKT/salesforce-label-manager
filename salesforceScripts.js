// salesforceScripts.js
const jsforce = require('jsforce');
const sqlite3 = require('sqlite3').verbose();

// Salesforce credentials
const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';
const conn = new jsforce.Connection({ loginUrl: 'https://test.salesforce.com' });
const db = new sqlite3.Database('./labels1.db');

// --- Utility to chunk array ---
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// --- Fetch & store labels ---
async function fetchAndStoreLabels(logCallback = console.log) {
  await conn.login(username, password);
  logCallback('✅ Logged into Salesforce');

  const labels = await conn.metadata.list({ type: 'CustomLabel' });
  const labelChunks = chunkArray(labels, 10);

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
}

// --- Sync to Salesforce ---
async function syncLabelsToSalesforce(logCallback = console.log) {
  await conn.login(username, password);
  logCallback('✅ Logged into Salesforce');

  const baseLabels = [];
  const translations = { de: [], zh_CN: [], zh_TW: [] };

  await new Promise((resolve, reject) => {
    db.all('SELECT * FROM custom_labels1', (err, rows) => {
      if (err) return reject(err);
      for (const row of rows) {
        baseLabels.push({
          fullName: row.fullName,
          language: row.language,
          value: row.value,
          shortDescription: row.shortDescription || '',
          protected: false,
        });

        if (row.de) translations.de.push({ name: row.fullName, label: row.de });
        if (row.zh_CN) translations.zh_CN.push({ name: row.fullName, label: row.zh_CN });
        if (row.zh_TW) translations.zh_TW.push({ name: row.fullName, label: row.zh_TW });
      }
      resolve();
    });
  });

  async function safeUpsert(type, items, label = '') {
    const chunkSize = 10;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      try {
        await conn.metadata.upsert(type, chunk);
        logCallback(`✅ Synced ${label} chunk ${i / chunkSize + 1}`);
      } catch (error) {
        logCallback(`❌ Chunk ${i / chunkSize + 1} failed: ${error.message}`);
        for (const item of chunk) {
          try {
            await conn.metadata.upsert(type, item);
            logCallback(`✔️ Synced: ${item.fullName || item.name}`);
          } catch (err) {
            logCallback(`❌ Failed: ${item.fullName || item.name} — ${err.message}`);
          }
        }
      }
    }
  }

  logCallback('\n🔄 Syncing base custom labels...');
  await safeUpsert('CustomLabel', baseLabels, 'base labels');

  for (const locale of ['de', 'zh_CN', 'zh_TW']) {
    if (!translations[locale].length) continue;
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
      await conn.metadata.upsert('Translations', updatedTranslation);
      logCallback(`✅ Translations synced for ${locale}`);
    } catch (err) {
      logCallback(`❌ Failed syncing translations for ${locale}: ${err.message}`);
    }
  }

  logCallback('\n🎉 All labels & translations synced to Salesforce!');
}

module.exports = { fetchAndStoreLabels, syncLabelsToSalesforce };
