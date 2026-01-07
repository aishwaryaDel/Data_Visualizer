import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import { FiUpload } from 'react-icons/fi';
import { analyzeTableForVisualization, fetchTablesWithConnectionString } from '../api_functions/api';
import { extractTableInfo } from '../api_functions/sqlExtract';

const DataSelector = ({ showModal, setShowModal, toggleModal, 
  selection, setSelection, setSelectedData, tables, setTables }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sqlJs, setSqlJs] = useState(null);
  const [connectorType, setConnectorType] = useState('file'); // 'file', 'connectionString', 'other'
  const [connectionString, setConnectionString] = useState('');
  const [otherParams, setOtherParams] = useState({});
  const fileInputRef = useRef();
  const dbFile = selection.dbFile;
  const db = selection.db;

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

  // Parse SQLite database and extract table names (for file upload)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!sqlJs) {
      alert('SQL.js library is still loading. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    setTables([]);
    setSelection(sel => ({ ...sel, dbFile: file, selectedTable: '' }));

    try {
      // Read file as array buffer
      const fileBuffer = await file.arrayBuffer();
      
      // Load the database
      const uint8Array = new Uint8Array(fileBuffer);
      const database = new sqlJs.Database(uint8Array);
      setSelection(sel => ({ ...sel, db: database }));
      
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
      setSelection(sel => ({ ...sel, dbFile: null, db: null }));
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle connection string input (calls backend API)
  const handleConnectWithString = async () => {
    setIsLoading(true);
    setTables([]);
    try {
      const tables = await fetchTablesWithConnectionString(connectionString);
      setTables(tables);
      if (tables.length === 0) {
        alert('No tables found for this connection string.');
      }
    } catch (error) {
      console.error('Failed to connect or fetch tables. Please check your connection string and backend.');
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
      // Use extractTableInfo utility
      const { columns, sampleRows } = extractTableInfo(db, selection.selectedTable, 3);

      // Call API to analyze table structure
      const analysis = await analyzeTableForVisualization(columns, sampleRows);

      // Set all analysis fields and selected table in selection
      if (setSelection) {
        setSelection(prev => ({
          ...prev,
          ...analysis,
          selectedTable: selection.selectedTable
        }));
      }

      // Extract data based on result range
      let limit = '';
      let orderBy = '';

      switch (selection.selectedResultRange) {
        case 'last10':
          limit = 'LIMIT 10';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} DESC` : '';
          break;
        case 'last100':
          limit = 'LIMIT 100';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} DESC` : '';
          break;
        case 'last1000':
          limit = 'LIMIT 1000';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} DESC` : '';
          break;
        case 'first10':
          limit = 'LIMIT 10';
          orderBy = analysis.dateColumn ? `ORDER BY ${analysis.dateColumn} ASC` : '';
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
    // Build keys for output
    const xKey = dateColumn || xAxisColumn;
    const yKey = yAxisColumn;
    const groupKey = groupByColumn;

    return rawData.map(row => {
      let obj = {};
      if (xKey) obj[xKey] = row[xKey];
      if (yKey) obj[yKey] = row[yKey];
      if (groupKey) obj[groupKey] = row[groupKey];
      // Optionally include all columns if needed:
      // Object.assign(obj, row);
      return obj;
    });
  };

  const handleReset = () => {
    if (selection.db) {
      selection.db.close();
    }
    setSelection({ selectedTable: '', selectedResultRange: '', db: null, dbFile: null });
    setTables([]);
  };

  // Cleanup database when component unmounts
  useEffect(() => {
    return () => {
      if (selection.db) {
        selection.db.close();
      }
    };
  }, [selection.db]);

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
              {/* Connector Type Selection */}
              <div className="mb-4">
                <label className="block text-gray-500 mb-2">Connector Type</label>
                <select
                  value={connectorType}
                  onChange={e => {
                    setConnectorType(e.target.value);
                    setTables([]);
                    setSelection(sel => ({ ...sel, dbFile: null, db: null, selectedTable: '' }));
                  }}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                >
                  <option value="file">SQLite File Upload</option>
                  <option value="connectionString">Connection String</option>
                  <option value="other">Other (Custom)</option>
                </select>
              </div>

              {/* File Upload Option */}
              {connectorType === 'file' && (
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
                      name="upload-database"
                      type="file"
                      accept=".db,.sqlite,.sqlite3"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Connection String Option */}
              {connectorType === 'connectionString' && (
                <div className="mb-4">
                  <label className="block text-gray-500 mb-2">Connection String</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={connectionString}
                      onChange={e => setConnectionString(e.target.value)}
                      className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                      placeholder="Enter DB connection string"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="bg-blue-900 px-3 py-1 rounded-md text-white hover:bg-blue-950 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleConnectWithString}
                      disabled={isLoading || !connectionString}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}

              {/* Other/Custom Option */}
              {connectorType === 'other' && (
                <div className="mb-4">
                  <label className="block text-gray-500 mb-2">Custom Parameters</label>
                  <input
                    type="text"
                    value={otherParams.custom || ''}
                    onChange={e => setOtherParams({ ...otherParams, custom: e.target.value })}
                    className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                    placeholder="Enter custom connection info"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Table Selection (enabled for file or connection string if tables are loaded) */}
              <div className="mb-4">
                <label htmlFor="select-table" className="block text-gray-500 mb-2">Table</label>
                <select
                  id="select-table"
                  value={selection.selectedTable}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelection(prev => ({
                      ...prev,
                      selectedTable: value,
                      selectedResultRange: 'all'
                    }));
                  }}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                  required
                  disabled={isLoading || tables.length === 0}
                >
                  <option value="">
                    {isLoading ? 'Loading tables...' : tables.length > 0 ? 'Select table' : 'No tables loaded'}
                  </option>
                  {tables.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
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
                  <option value="last10">Last 10 Rows</option>
                  <option value="last100">Last 100 Rows</option>
                  <option value="last1000">Last 1000 Rows</option>
                  <option value="first10">First 10 Rows</option>
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