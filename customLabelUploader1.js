const jsforce = require('jsforce');

// Replace with your actual credentials
const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';

const conn = new jsforce.Connection({
  loginUrl: 'https://test.salesforce.com', 
});

async function createCustomLabel() {
  try {
    //Login
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    //Define hardcoded label data
    const label = {
      fullName: 'My_Hardcoded_Label',
      language: 'en_US',
      shortDescription: 'Label from Node.js',
      value: 'Hello from Node.js!'
    };

    //Upsert label (create or update)
    // const result = await conn.metadata.upsert('CustomLabel', label);
    // console.log('✅ Label Created/Updated:', result);
    const existingTranslation = await conn.metadata.read('Translations', ['De']);

    const newTranslation = {
      fullName: 'de',
      customLabels: [
        ...(existingTranslation.customLabels || []),
        {
          name: 'My_Hardcoded_Label',
          label: 'avchdg h !'
        }
      ]
    };

    // Step 2: Upsert the French translation
    const result = await conn.metadata.upsert('Translations', newTranslation);
    console.log('✅ Translation added/updated:', result);


  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCustomLabel();
