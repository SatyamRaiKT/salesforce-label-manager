import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/api/logs');

    eventSource.onmessage = (e) => {
      setLogs(prev => [...prev, `📡 ${e.data}`]);
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);
  const handleCancel = async () => {
    await fetch('http://localhost:8080/api/cancel', { method: 'POST' });
  };
  
  const handleAction = async (type) => {
    setLoading(true);
    setLogs(prev => [...prev, `🚀 Starting ${type} operation...`]);

    try {
      const response = await fetch(`http://localhost:8080/api/${type}`, {
        method: type === 'fetch' ? 'GET' : 'POST',
      });

      const result = await response.json();
      setLogs(prev => [...prev, `✅ ${result.status}`]);
    } catch (err) {
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 w-full">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">🚀 Salesforce Label Manager</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => handleAction('fetch')}
          className="px-5 py-2 bg-blue-600 text-black rounded hover:bg-blue-700 disabled:opacity-50 transition"
          disabled={loading}
        >
          Fetch Labels
        </button>
        <button
          onClick={() => handleAction('sync')}
          className="px-5 py-2 bg-green-600 text-black rounded hover:bg-green-700 disabled:opacity-50 transition"
          disabled={loading}
        >
          Sync to Salesforce
        </button>
        <button
          onClick={() => handleCancel('async')}
          className="px-5 py-2 bg-green-600 text-black rounded hover:bg-green-700 disabled:opacity-50 transition"
          disabled={loading}
        >
          ❌ Cancel Operation
        </button>
      </div>

      <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm h-80 overflow-y-auto">
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
