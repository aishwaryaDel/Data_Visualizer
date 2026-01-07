

import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import { FiUpload } from 'react-icons/fi';
import { analyzeTableForVisualization } from '../api_functions/api';

const DataSelector = ({ showModal, setShowModal, toggleModal, selection, setSelection, setSelectedData }) => {
  const [dbFile, setDbFile] = useState(null);
  const [tables, setTables] = useState([]);
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sqlJs, setSqlJs] = useState(null);
  const fileInputRef = useRef();

  // Load SQL.js library on component mount
  useEffect(() => {
    const loadSqlJs = async () => {
      try {
        // Wait for sql.js to be available from the script tag
        if (window.initSqlJs) {
          const SQL = await window.initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
          });
          setSqlJs(SQL);
        } else {
          // If not loaded yet, wait and try again
          setTimeout(loadSqlJs, 100);
        }
      } catch (error) {
        console.error('Error loading SQL.js:', error);
      }
    };
    loadSqlJs();
  }, []);

  // Parse SQLite database and extract table names
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!sqlJs) {
      alert('SQL.js library is still loading. Please try again in a moment.');
      return;
    }

    setDbFile(file);
    setIsLoading(true);
    setTables([]);
    setSelection(sel => ({ ...sel, selectedTable: '' }));

    try {
      // Read file as array buffer
      const fileBuffer = await file.arrayBuffer();
      
      // Load the database
      const uint8Array = new Uint8Array(fileBuffer);
      const database = new sqlJs.Database(uint8Array);
      setDb(database);
      
      // Query to get all table names
      const result = database.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      if (result.length > 0 && result[0].values.length > 0) {
        const tableNames = result[0].values.map(row => row[0]);
        setTables(tableNames);
      } else {
        setTables([]);
        alert('No tables found in the database file.');
      }
    } catch (error) {
      console.error('Error parsing database file:', error);
      alert('Failed to parse database file. Please ensure it is a valid SQLite database.');
      setDbFile(null);
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!db || !selection.selectedTable) {
      alert('Please select a table first.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get table columns
      const tableInfoResult = db.exec(`PRAGMA table_info(${selection.selectedTable})`);
      const columns = tableInfoResult[0].values.map(row => row[1]); // column names are at index 1
      
      // Get sample rows for analysis (first 3 rows)
      const sampleResult = db.exec(`SELECT * FROM ${selection.selectedTable} LIMIT 3`);
      const sampleRows = sampleResult.length > 0 
        ? sampleResult[0].values.map(row => {
            const obj = {};
            columns.forEach((col, idx) => {
              obj[col] = row[idx];
            });
            return obj;
          })
        : [];

      // Call API to analyze table structure
      console.log('Analyzing table structure...');
      const analysis = await analyzeTableForVisualization(columns, sampleRows);
      console.log('Analysis result:', analysis);

      // Extract data based on result range
      let limit = '';
      let orderBy = '';
      
      switch (selection.selectedResultRange) {
        case 'last100':
          limit = 'LIMIT 100';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} DESC` : '';
          break;
        case 'last1000':
          limit = 'LIMIT 1000';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} DESC` : '';
          break;
        case 'first100':
          limit = 'LIMIT 100';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} ASC` : '';
          break;
        case 'first1000':
          limit = 'LIMIT 1000';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} ASC` : '';
          break;
        default: // 'all'
          limit = '';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} ASC` : '';
      }

      // Query the full data
      const query = `SELECT * FROM ${selection.selectedTable} ${orderBy} ${limit}`;
      const dataResult = db.exec(query);
      
      if (dataResult.length === 0 || dataResult[0].values.length === 0) {
        alert('No data found in the selected table.');
        setIsAnalyzing(false);
        return;
      }

      // Transform data based on analysis
      const rawData = dataResult[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      // Format data for chart visualization
      const formattedData = transformDataForChart(rawData, analysis);
      
      console.log('Formatted data:', formattedData);

      if (setSelectedData) {
        setSelectedData(formattedData);
      }

      setShowModal(false);
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('Error processing table data:', error);
      alert('Failed to process table data: ' + error.message);
      setIsAnalyzing(false);
    }
  };

  // Transform raw database data into chart-ready format
  const transformDataForChart = (rawData, analysis) => {
    const { xAxisColumn, yAxisColumn, groupByColumn, dateColumn } = analysis;
    
    if (groupByColumn) {
      // If there's a grouping column (like 'tag' or 'category')
      return rawData.map(row => ({
        date: row[dateColumn || xAxisColumn] || row[xAxisColumn],
        tag: row[groupByColumn],
        value: parseFloat(row[yAxisColumn]) || 0
      }));
    } else {
      // Simple x-y mapping without grouping
      return rawData.map(row => ({
        date: row[dateColumn || xAxisColumn] || row[xAxisColumn],
        tag: 'Data',
        value: parseFloat(row[yAxisColumn]) || 0
      }));
    }
  };

  const handleReset = () => {
    setSelection({ selectedTable: '', selectedDateRange: '', selectedResultRange: '' });
    setDbFile(null);
    setTables([]);
    if (db) {
      db.close();
      setDb(null);
    }
  };

  // Cleanup database when component unmounts
  useEffect(() => {
    return () => {
      if (db) {
        db.close();
      }
    };
  }, [db]);

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
                    onClick={() => !isLoading && fileInputRef.current && fileInputRef.current.click()}
                    className={`w-full flex flex-col items-center gap-2 border border-gray-600 text-white px-3 py-2 rounded-md transition-all duration-300 focus:outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className='flex items-center gap-2'>
                      <FiUpload className="text-lg" />
                      <span className="text-sm">{isLoading ? 'Loading...' : 'Upload'}</span>
                    </div>
                    <p className='text-xs text-gray-400'>{dbFile ? dbFile.name : "No file selected"}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="upload-database"
                    type="file"
                    accept=".db,.sqlite,.sqlite3"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                    disabled={isLoading}
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
                  disabled={!dbFile || isLoading}
                >
                  <option value="">
                    {isLoading ? 'Loading tables...' : dbFile ? 'Select table' : 'Upload database file first'}
                  </option>
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
                  disabled={isAnalyzing}
                >
                  Reset
                </button>
                <button 
                  type='submit' 
                  className='bg-green-900 px-3 py-1 rounded-md text-white hover:bg-green-950 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Done'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DataSelector;