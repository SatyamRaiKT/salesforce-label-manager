const http = require('http');
const url = require('url');
const { fetchAndStoreLabels, syncLabelsToSalesforce } = require('./salesforceScripts');
const sqlite3 = require('sqlite3').verbose();

const PORT = 8080;
const db = new sqlite3.Database('./labels1.db');

let clients = [];
let cancelController = { cancel: false };

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (path === '/api/logs') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(client => client !== res);
    });
    return;
  }

  const broadcastLog = (message) => {
    clients.forEach(client => {
      client.write(`data: ${message}\n\n`);
    });
  };

  if (method === 'POST' && path === '/api/cancel') {
    cancelController.cancel = true;
    broadcastLog('⚠️ Operation cancelled by user');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'Operation cancelled' }));
  }

  if (method === 'GET' && path === '/api/fetch') {
    const logs = [];
    cancelController.cancel = false;

    try {
      await fetchAndStoreLabels((log) => {
        if (cancelController.cancel) throw new Error('Operation cancelled');
        logs.push(log);
        broadcastLog(log);
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Labels fetched and stored successfully', logs }));
    } catch (err) {
      console.error(err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Failed to fetch labels', logs }));
    }
  } else if (method === 'POST' && path === '/api/sync') {
    const logs = [];
    cancelController.cancel = false;

    try {
      await syncLabelsToSalesforce((log) => {
        if (cancelController.cancel) throw new Error('Operation cancelled');
        logs.push(log);
        broadcastLog(log);
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Labels synced to Salesforce successfully', logs }));
    } catch (err) {
      console.error(err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Failed to sync labels', logs }));
    }
  } else if (method === 'GET' && path === '/api/labels') {
    db.all('SELECT * FROM custom_labels1', (err, rows) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch labels from DB' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
