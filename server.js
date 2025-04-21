/*const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 5000;

// Allow cross-origin requests
app.use(cors());

const db = new sqlite3.Database('./labels1.db');

// API to fetch all labels custom_label_updated
app.get('/api/labels', (req, res) => {
  db.all('SELECT * FROM custom_labels1', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching labels:', err);
      res.status(500).send('Error fetching labels');
    } else {
      res.json(rows);
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
*/
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { importRecords } = require('./importLable'); // ✅ Import the function

const app = express();
const port = 5000;

// Allow cross-origin requests
app.use(cors());

// SQLite connection
const db = new sqlite3.Database('./labels1.db');

// API to fetch all labels
app.get('/api/labels', (req, res) => {
  db.all('SELECT * FROM custom_labels1', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching labels:', err);
      res.status(500).send('Error fetching labels');
    } else {
      res.json(rows);
    }
  });
});

// Multer setup to handle file uploads
const upload = multer({ dest: 'uploads/' });

// API to handle label import from CSV or XLSX
app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadedPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

  try {
    importRecords(ext, uploadedPath); // ✅ Run your import logic
    res.json({ message: '✅ File processed successfully.' });
  } catch (err) {
    console.error('❌ Import error:', err);
    res.status(500).send('Failed to import file.');
  }

  // Cleanup the temp file after delay
  setTimeout(() => {
    fs.unlink(uploadedPath, (err) => {
      if (err) console.error('❌ Error deleting temp file:', err);
    });
  }, 5000);
});


app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
