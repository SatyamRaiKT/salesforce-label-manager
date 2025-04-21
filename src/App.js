import React, { useEffect, useState } from 'react';
import './App.css';

const RECORDS_PER_PAGE = 50;

function App() {
  const [labels, setLabels] = useState([]);
  const [filteredLabels, setFilteredLabels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('labels');

  const fetchLabels = () => {
    fetch('http://localhost:5000/api/labels')
      .then((res) => res.json())
      .then((data) => {
        setLabels(data);
        setFilteredLabels(data);
      })
      .catch((err) => console.error('❌ Error fetching labels:', err));
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    const filtered = labels.filter((label) =>
      label.fullName && label.fullName.toLowerCase().includes(value)
    );
    setFilteredLabels(filtered);
    setCurrentPage(1);
  };

  const handleImport = async () => {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return alert('Please choose a file');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      alert(result.message);
      fetchLabels(); // 🔄 Refresh table
    } catch (err) {
      console.error('❌ Import error:', err);
      alert('Import failed.');
    }
  };

  const totalPages = Math.ceil(filteredLabels.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const currentRecords = filteredLabels.slice(startIndex, startIndex + RECORDS_PER_PAGE);

  return (
    <div className="App" style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Custom Labels Manager</h2>
        <button style={{ padding: '8px 16px', backgroundColor: '#0B5FFF', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Connect to Salesforce
        </button>
      </header>

      {/* Tabs Navigation */}
      <nav style={{ margin: '20px 0', borderBottom: '1px solid #ddd', display: 'flex', gap: '20px' }}>
        {['labels', 'create', 'import'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #0B5FFF' : 'none',
              padding: '10px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'import' ? 'Import/Export' : tab}
          </button>
        ))}
      </nav>

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <>
          <input
            type="text"
            placeholder="Search by label name..."
            value={search}
            onChange={handleSearch}
            style={{ padding: '10px', width: '300px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f7f7f7' }}>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Full Name</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Language</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Value</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.map((label, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{label.fullName || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{label.language || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{label.value || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{label.shortDescription || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', marginRight: '10px' }}
            >
              ⬅ Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', marginLeft: '10px' }}
            >
              Next ➡
            </button>
          </div>
        </>
      )}

      {/* Create/Edit Tab */}
            {/* Create/Edit Tab */}
            {activeTab === 'create' && (
        <div style={{ marginTop: '20px' }}>
          <h3>Create/Edit Label</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <div>
              <label>Label Name</label>
              <input type="text" placeholder="e.g., MyCustomLabel" style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <small>The unique identifier for the label</small>
            </div>
            <div>
              <label>Default Language</label>
              <input type="text" placeholder="e.g., en_US" style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <small>This is the default language for the label</small>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Value</label>
            <input type="text" placeholder="Enter the label value" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '6px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Description</label>
            <textarea placeholder="Enter a short description" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px', marginTop: '6px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <input type="checkbox" id="protected" />
            <label htmlFor="protected" style={{ marginLeft: '8px' }}>
              Protected <small>(Prevents this label from being modified by package upgrades)</small>
            </label>
          </div>
          <div>
            
            <button style={{ padding: '10px 20px', backgroundColor: '#0B5FFF', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Save Label
            </button>
          </div>
        </div>
      )}


      {/* Import/Export Tab */}
      {activeTab === 'import' && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          {/* Import Labels */}
          <div style={{ flex: '1', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
            <h4>📥 Import Labels</h4>
            <p>Import custom labels from a CSV or Excel file. The file should have columns for <code>fullName</code>, <code>language</code>, <code>value</code>, <code>shortDescription</code>, and translations.</p>
            <input id="importFile" type="file" accept=".csv,.xlsx" style={{ marginTop: '10px' }} />
            <br />
            <button onClick={handleImport} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#0B5FFF', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Import Labels
            </button>
          </div>

          {/* Export Labels */}
          <div style={{ flex: '1', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
            <h4>📤 Export Labels</h4>
            <p>Export all custom labels to a CSV file. This file can be used for backup or to import labels into another system.</p>
            <button style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: '#0B5FFF', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Export Labels
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default App;
