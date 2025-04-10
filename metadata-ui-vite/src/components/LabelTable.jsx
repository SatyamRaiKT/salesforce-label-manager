import { useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function LabelTable() {
  const [labels, setLabels] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/labels')
      .then((res) => res.json())
      .then((data) => setLabels(data))
      .catch((err) => console.error('Error fetching labels:', err));
  }, []);

  const filteredLabels = labels.filter(label => {
    const searchLower = search.toLowerCase();
    return Object.values(label).some(value =>
      (value || '').toString().toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredLabels.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLabels = filteredLabels.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const openModal = (label) => setSelectedLabel(label);
  const closeModal = () => setSelectedLabel(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">📋 Custom Labels Table</h2>

      <input
        type="text"
        placeholder="Search for Name, Value, Desc..."
        className="mb-4 px-3 py-2 border rounded w-full"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Full Name</th>
              <th className="px-4 py-2 border">Value</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLabels.map((label, index) => (
              <tr key={index} className="text-sm text-gray-800">
                <td className="border px-4 py-2">{label.fullName}</td>
                <td className="border px-4 py-2">{label.value}</td>
                <td className="border px-4 py-2 text-center">
                <button
                onClick={() => openModal(label)}
                className="px-4 py-1 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-sm text-black hover:bg-white/20 transition-all duration-300 flex items-center gap-2 shadow-md"
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Details
            </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filteredLabels.length)} of {filteredLabels.length} labels
        </p>
        <div className="space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
{/*Modal*/}
      {selectedLabel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition duration-300">
    <div className="relative bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-xl p-6 max-w-2xl w-full animate-scaleIn border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">
        🏷️ Label Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">Full Name</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.fullName}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">Language</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.language}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">Value</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.value}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">Short Description</span>
          <span className="break-words whitespace-pre-wrap">
          {selectedLabel.shortDescription || '-'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="font-medium text-gray-600">de</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.de || '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">zh_CN</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.zh_CN || '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-600">zh_TW</span>
          <span className="break-words whitespace-pre-wrap">{selectedLabel.zh_TW || '-'}</span>
        </div>
      </div>

      <button
        onClick={() => setSelectedLabel(null)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition duration-200 text-lg font-bold"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  </div>
)}


    </div>
  );
}
