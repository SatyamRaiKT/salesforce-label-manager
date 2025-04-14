const jsforce = require('jsforce');
const sqlite3 = require('sqlite3').verbose();

const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';

const conn = new jsforce.Connection({
  loginUrl: 'https://test.salesforce.com',
});

const db = new sqlite3.Database('./labels1.db');

async function createCustomLabelWithTranslations(label, translations) {
  try {
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    // Step 1: Create or update the base custom label
    const customLabel = {
      fullName: label.fullName,
      language: label.language || 'en_US',
      value: label.value,
      shortDescription: label.shortDescription || '',
      protected: label.protected || false,
    };

    const result = await conn.metadata.upsert('CustomLabel', [customLabel]);
    console.log('⬆️ Custom Label Created/Updated:', result);

    if (result[0].success) {
      console.log(`✅ Custom Label "${label.fullName}" created/updated successfully.`);
    } else {
      console.error(`❌ Failed to create/update Custom Label "${label.fullName}":`, result[0].errors);
      return;
    }

    // Step 2: Add translations for the custom label
    for (const [locale, translationValue] of Object.entries(translations)) {
      if (!translationValue) continue;

      console.log(`🌍 Adding translation for locale: ${locale}`);

      // Read existing translations for the locale
      const existingTranslation = await conn.metadata.read('Translations', [locale]);
      const existingLabels = existingTranslation?.customLabels || [];

      // Update or add the translation for the current label
      const updatedTranslation = {
        fullName: locale,
        customLabels: [
          ...existingLabels.filter(label => label.name !== customLabel.fullName),
          { name: customLabel.fullName, label: translationValue },
        ],
      };

      const translationResult = await conn.metadata.upsert('Translations', updatedTranslation);
      console.log(`⬆️ Translation for locale "${locale}" synced:`, translationResult);

      if (translationResult.success) {
        console.log(`✅ Translation for "${customLabel.fullName}" in locale "${locale}" added/updated successfully.`);
      } else {
        console.error(`❌ Failed to add/update translation for "${customLabel.fullName}" in locale "${locale}":`, translationResult.errors);
      }
    }
  } catch (err) {
    console.error('❌ Error creating/updating Custom Label with translations:', err);
  }
}

async function syncCustomLabelsFromDB() {
  try {
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    // Query the database to retrieve custom labels and translations
    db.all('SELECT * FROM custom_label_updated', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading from database:', err);
        return;
      }

      console.log('📥 Retrieved rows from database:', rows);

      for (const row of rows) {
        // Step 1: Create or update the base custom label
        const customLabel = {
          fullName: row.fullName,
          language: row.language || 'en_US',
          value: row.value,
          shortDescription: row.shortDescription || '',
          protected: row.protected === 1, // Assuming `protected` is stored as 0/1 in the database
        };

        const result = await conn.metadata.upsert('CustomLabel', [customLabel]);
        console.log('⬆️ Custom Label Created/Updated:', result);

        if (result[0].success) {
          console.log(`✅ Custom Label "${row.fullName}" created/updated successfully.`);
        } else {
          console.error(`❌ Failed to create/update Custom Label "${row.fullName}":`, result[0].errors);
          continue;
        }

        // Step 2: Add translations for the custom label
        const translations = {
          de: row.de, // German translation
          zh_CN: row.zh_CN, // Simplified Chinese translation
          zh_TW: row.zh_TW, // Traditional Chinese translation
        };

        for (const [locale, translationValue] of Object.entries(translations)) {
          if (!translationValue) continue;

          console.log(`🌍 Adding translation for locale: ${locale}`);

          // Read existing translations for the locale
          const existingTranslation = await conn.metadata.read('Translations', [locale]);
          const existingLabels = existingTranslation?.customLabels || [];

          // Update or add the translation for the current label
          const updatedTranslation = {
            fullName: locale,
            customLabels: [
              ...existingLabels.filter(label => label.name !== customLabel.fullName),
              { name: customLabel.fullName, label: translationValue },
            ],
          };

          const translationResult = await conn.metadata.upsert('Translations', updatedTranslation);
          console.log(`⬆️ Translation for locale "${locale}" synced:`, translationResult);

          if (translationResult.success) {
            console.log(`✅ Translation for "${customLabel.fullName}" in locale "${locale}" added/updated successfully.`);
          } else {
            console.error(`❌ Failed to add/update translation for "${customLabel.fullName}" in locale "${locale}":`, translationResult.errors);
          }
        }
      }
    });
  } catch (err) {
    console.error('❌ Error syncing custom labels from database:', err);
  }
}


// createCustomLabelWithTranslations(
//   {
//     fullName: 'TestLabel',
//     value: 'This is a test label',
//     shortDescription: 'A test label for demonstration',
//     protected: false,
//   },
//   {
//     de: 'Dies ist ein Testetikett', // German translation
//     zh_CN: '这是一个测试标签', // Simplified Chinese translation
//     zh_TW: '這是一個測試標籤', // Traditional Chinese translation
//   }
// );

// Call the function to sync custom labels from the database
syncCustomLabelsFromDB();