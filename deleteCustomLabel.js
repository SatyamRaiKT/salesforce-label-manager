const jsforce = require('jsforce');

// Salesforce credentials
const username = 'satyam.rai@keysight.com.dev.sfcamsd5';
const password = 'Satyamrai123456@';

const conn = new jsforce.Connection({
  loginUrl: 'https://test.salesforce.com',
});

async function deleteCustomLabel(labelFullName) {
  try {
    // Log in to Salesforce
    await conn.login(username, password);
    console.log('✅ Logged into Salesforce');

    // Delete the custom label
    const result = await conn.metadata.delete('CustomLabel', [labelFullName]);
    console.log('⬇️ Custom Label Deletion Result:', result);

    if (result[0].success) {
      console.log(`✅ Custom Label "${labelFullName}" deleted successfully.`);
    } else {
      console.error(`❌ Failed to delete Custom Label "${labelFullName}":`, result[0].errors);
    }
  } catch (err) {
    console.error('❌ Error deleting Custom Label:', err);
  }
}

// Example usage
deleteCustomLabel('testingDbInsert');