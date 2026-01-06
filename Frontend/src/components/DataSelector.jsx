

import React, { useState, useRef } from 'react';
import sampleData from '../sampleData.json';
import { IoMdClose } from "react-icons/io";
import { FiUpload } from 'react-icons/fi';

const DataSelector = ({ showModal, setShowModal, toggleModal, selection, setSelection, setSelectedData }) => {
  const [dbFile, setDbFile] = useState(null);
  const [tables, setTables] = useState([]);
  const fileInputRef = useRef();

  // Simulate extracting tables from uploaded file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDbFile(file);
    // Simulate: after file upload, populate tables (replace with real logic)
    setTables(['Sample Table', 'Another Table']);
    setSelection(sel => ({ ...sel, selectedTable: '' }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (setSelectedData) {
      setSelectedData(null);
      setSelectedData(sampleData); // Replace with real data extraction logic
    }
    setShowModal(false);
    setDbFile(null);
    setTables([]);
  };

  const handleReset = () => {
    setSelection({ selectedTable: '', selectedDateRange: '', selectedResultRange: '' });
    setDbFile(null);
    setTables([]);
  };

  return (
    <>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black text-white border border-gray-500 px-5 py-3 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Data</h2>
              <IoMdClose onClick={toggleModal}
                className='cursor-pointer text-gray-500 hover:text-white transition-all duration-300' />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-500 mb-2">Upload Database File</label>
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="w-full flex flex-col items-center gap-2 border border-gray-600 text-white px-3 py-2 rounded-md transition-all duration-300 focus:outline-none"
                  >
                    <div className='flex items-center gap-2'>
                      <FiUpload className="text-lg" />
                      <span className="text-sm">Upload</span>
                    </div>
                    <p className='text-xs text-gray-400'>{dbFile ? dbFile.name : "No file selected"}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="upload-database"
                    type="file"
                    accept=".json,.csv,.db,.sqlite"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="select-table" className="block text-gray-500 mb-2">Table</label>
                <select
                  id="select-table"
                  value={selection.selectedTable}
                  onChange={(e) => setSelection(prev => ({ ...prev, selectedTable: e.target.value }))}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                  required
                  disabled={!dbFile}
                >
                  <option value="">{dbFile ? 'Select table' : 'Upload database file first'}</option>
                  {tables.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="select-date-range" className="block text-gray-500 mb-2">Date Range</label>
                <select
                  id="select-date-range"
                  value={selection.selectedDateRange}
                  onChange={(e) => setSelection(prev => ({ ...prev, selectedDateRange: e.target.value }))}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                  required
                >
                  <option value="">Select date range</option>
                  <option value="30min">Last 30 mins</option>
                  <option value="1hr">Last 1 hr</option>
                  <option value="1d">Last 1 day</option>
                  <option value="7d">Last 7 days</option>
                  <option value="15d">Last 15 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="select-result-range" className="block text-gray-500 mb-2">Show Results</label>
                <select
                  id="select-result-range"
                  value={selection.selectedResultRange}
                  onChange={(e) => setSelection(prev => ({ ...prev, selectedResultRange: e.target.value }))}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                  required
                >
                  <option value="">Select result range</option>
                  <option value="all">All Rows</option>
                  <option value="last100">Last 100 Rows</option>
                  <option value="last1000">Last 1000 Rows</option>
                  <option value="first100">First 100 Rows</option>
                  <option value="first1000">First 1000 Rows</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-700 px-3 py-1 rounded-md text-white hover:bg-gray-800 transition-all duration-300"
                  onClick={handleReset}
                >
                  Reset
                </button>
                <button type='submit' className='bg-green-900 px-3 py-1 rounded-md text-white hover:bg-green-950 transition-all duration-300'>Done</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DataSelector;