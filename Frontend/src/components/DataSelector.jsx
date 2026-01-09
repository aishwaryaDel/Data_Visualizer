import React, { useState, useRef, useEffect } from 'react';
import { IoMdClose } from "react-icons/io";
import { FiUpload } from 'react-icons/fi';
import { fetchTablesWithConnectionString, connectToADX, fetchADXTables, fetchADXTableSchema } from '../api_functions/api';
import { extractTableInfo, extractChartData } from '../api_functions/sqlExtract';

const DataSelector = ({ showModal, setShowModal, toggleModal, setView,
  selection, setSelection, tables, setTables, setChartLoading }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sqlJs, setSqlJs] = useState(null);
  const [connectorType, setConnectorType] = useState('file'); // 'file', 'connectionString', 'adx', 'other'
  const [connectionString, setConnectionString] = useState('');
  const [otherParams, setOtherParams] = useState({});
  const [tableColumns, setTableColumns] = useState([]);
  
  // ADX specific state
  const [adxConfig, setAdxConfig] = useState({
    clusterUrl: '',
    database: '',
    authMethod: 'aad', // 'aad', 'appKey', 'token'
    clientId: '',
    clientSecret: '',
    tenantId: '',
    token: ''
  });
  const [adxConnected, setAdxConnected] = useState(false);
  
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
    setSelection(sel => ({ ...sel, dbFile: file, selectedTable: '', selectedChartDetails: { type: '', xCol: '', yCol: '' } }));

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
      setTableColumns([]);
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
    setTableColumns([]);
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

  // Handle ADX connection
  const handleConnectToADX = async () => {
    setError('');
    
    // Validate required fields
    if (!adxConfig.clusterUrl || !adxConfig.database) {
      setError('Please provide Cluster URL and Database name.');
      return;
    }

    // Validate auth credentials based on method
    if (adxConfig.authMethod === 'appKey') {
      if (!adxConfig.clientId || !adxConfig.clientSecret || !adxConfig.tenantId) {
        setError('Please provide Client ID, Client Secret, and Tenant ID for App Key authentication.');
        return;
      }
    } else if (adxConfig.authMethod === 'token') {
      if (!adxConfig.token) {
        setError('Please provide an authentication token.');
        return;
      }
    }

    setIsLoading(true);
    setTables([]);
    setTableColumns([]);
    setAdxConnected(false);

    try {
      // First, test connection
      const credentials = adxConfig.authMethod === 'appKey' 
        ? { clientId: adxConfig.clientId, clientSecret: adxConfig.clientSecret, tenantId: adxConfig.tenantId }
        : adxConfig.authMethod === 'token'
        ? { token: adxConfig.token }
        : {};

      const connectResult = await connectToADX(
        adxConfig.clusterUrl,
        adxConfig.database,
        adxConfig.authMethod,
        credentials
      );

      if (connectResult.success) {
        setAdxConnected(true);
        
        // Fetch tables
        const tables = await fetchADXTables(adxConfig.clusterUrl, adxConfig.database);
        setTables(tables);
        
        if (tables.length === 0) {
          setError('Connected successfully, but no tables found in the database.');
        } else {
          setError('');
        }
      } else {
        setError(connectResult.message || 'Failed to connect to ADX cluster.');
      }
    } catch (error) {
      console.error('Error connecting to ADX:', error);
      setError('Failed to connect to ADX. Please check your credentials and cluster URL.');
      setAdxConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ADX config changes
  const handleAdxConfigChange = (field, value) => {
    setAdxConfig(prev => ({ ...prev, [field]: value }));
    setAdxConnected(false);
    setTables([]);
  };


  // Chart type and axis selection logic using selectedChartDetails

  const handleChartTypeChange = (e) => {
    const type = e.target.value;
    setSelection(prev => ({
      ...prev,
      selectedChartDetails: { type, xCol: '', yCol: '', groupCol: '' }
    }));
  };


  const handleAxisChange = (axis, value) => {
    setSelection(prev => ({
      ...prev,
      selectedChartDetails: {
        ...prev.selectedChartDetails,
        [axis]: value
      }
    }));
  };

  const handleGroupByChange = (value) => {
    setSelection(prev => ({
      ...prev,
      selectedChartDetails: {
        ...prev.selectedChartDetails,
        groupCol: value
      }
    }));
  };

  const handleReset = () => {
    setError('');
    if (selection.db) {
      selection.db.close();
    }
    setSelection({ selectedTable: '', selectedResultRange: '', db: null, dbFile: null, selectedChartDetails: { type: '', xCol: '', yCol: '' } });
    setTables([]);
    setTableColumns([]);
  };

  const handleSubmit = async () => {
    setError('');
    // Validation: required columns selected and xCol != yCol
    const chartType = selection.selectedChartDetails?.type;
    const xCol = selection.selectedChartDetails?.xCol;
    const yCol = selection.selectedChartDetails?.yCol;
    const groupCol = selection.selectedChartDetails?.groupCol;
    if (!db || !selection.selectedTable || !chartType) {
      setError('Please select a table and chart type.');
      return;
    }
    if (!xCol || !yCol) {
      setError('Please select both X and Y columns.');
      return;
    }
    if (xCol === yCol) {
      setError('X and Y columns must be different.');
      return;
    }
    setShowModal(false);
    setChartLoading(true);
    setView('chart');
    try {
      const resultData = await extractChartData(
        db,
        selection.selectedTable,
        chartType,
        { xCol, yCol, groupCol },
        selection.selectedResultRange || 'all'
      );
      if (resultData?.rows?.length !== 0) {
        setSelection({ ...selection, resultData })
      }
    } finally {
      setChartLoading(false);
    }
  };

  // Cleanup database when component unmounts
  useEffect(() => {
    return () => {
      if (selection.db) {
        selection.db.close();
      }
    };
  }, [selection.db]);

  // When table changes, fetch columns
  useEffect(() => {
    const fetchColumns = async () => {
      if (connectorType === 'adx' && adxConnected && selection.selectedTable) {
        // Fetch ADX table schema
        try {
          const columns = await fetchADXTableSchema(
            adxConfig.clusterUrl,
            adxConfig.database,
            selection.selectedTable
          );
          setTableColumns(columns.map(col => col.name || col));
        } catch (e) {
          console.error('Error fetching ADX table schema:', e);
          setTableColumns([]);
        }
      } else if (db && selection.selectedTable) {
        // Fetch SQLite table columns
        try {
          const { columns } = extractTableInfo(db, selection.selectedTable, 1);
          setTableColumns(columns);
        } catch (e) {
          setTableColumns([]);
        }
      } else {
        setTableColumns([]);
      }
    };
    fetchColumns();
  }, [db, selection.selectedTable, connectorType, adxConnected, adxConfig.clusterUrl, adxConfig.database]);

  return (
    <>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="h-[90vh] bg-black text-white border border-gray-500 px-2 py-3 rounded-lg w-full max-w-lg flex flex-col justify-between">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-xl font-semibold">Select Data</h2>
              <IoMdClose onClick={toggleModal}
                className='cursor-pointer text-gray-500 hover:text-white transition-all duration-300' />
            </div>

            <div className='w-full h-[85%] my-3 overflow-auto px-3'>
              {/* Connector Type Selection */}
              <div className="mb-4">
                <label className="block text-gray-500 mb-2">Connector Type</label>
                <select
                  value={connectorType}
                  onChange={e => {
                    setConnectorType(e.target.value);
                    setTables([]);
                    setTableColumns([]);
                    setAdxConnected(false);
                    setError('');
                    setSelection(sel => ({ ...sel, dbFile: null, db: null, selectedTable: '' }));
                  }}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                >
                  <option value="file">SQLite File Upload</option>
                  <option value="connectionString">Connection String</option>
                  <option value="adx">Azure Data Explorer (ADX/Kusto)</option>
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

              {/* Azure Data Explorer (ADX) Option */}
              {connectorType === 'adx' && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-gray-500 mb-2">Cluster URL *</label>
                    <input
                      type="text"
                      value={adxConfig.clusterUrl}
                      onChange={e => handleAdxConfigChange('clusterUrl', e.target.value)}
                      className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                      placeholder="https://yourcluster.region.kusto.windows.net"
                      disabled={isLoading || adxConnected}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-2">Database Name *</label>
                    <input
                      type="text"
                      value={adxConfig.database}
                      onChange={e => handleAdxConfigChange('database', e.target.value)}
                      className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                      placeholder="Your database name"
                      disabled={isLoading || adxConnected}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-2">Authentication Method</label>
                    <select
                      value={adxConfig.authMethod}
                      onChange={e => handleAdxConfigChange('authMethod', e.target.value)}
                      className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                      disabled={isLoading || adxConnected}
                    >
                      <option value="aad">Azure AD (Interactive)</option>
                      <option value="appKey">App Key (Service Principal)</option>
                      <option value="token">Bearer Token</option>
                    </select>
                  </div>

                  {/* App Key Authentication Fields */}
                  {adxConfig.authMethod === 'appKey' && (
                    <>
                      <div>
                        <label className="block text-gray-500 mb-2">Client ID *</label>
                        <input
                          type="text"
                          value={adxConfig.clientId}
                          onChange={e => handleAdxConfigChange('clientId', e.target.value)}
                          className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                          placeholder="Application (client) ID"
                          disabled={isLoading || adxConnected}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-2">Client Secret *</label>
                        <input
                          type="password"
                          value={adxConfig.clientSecret}
                          onChange={e => handleAdxConfigChange('clientSecret', e.target.value)}
                          className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                          placeholder="Client secret value"
                          disabled={isLoading || adxConnected}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-2">Tenant ID *</label>
                        <input
                          type="text"
                          value={adxConfig.tenantId}
                          onChange={e => handleAdxConfigChange('tenantId', e.target.value)}
                          className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                          placeholder="Directory (tenant) ID"
                          disabled={isLoading || adxConnected}
                        />
                      </div>
                    </>
                  )}

                  {/* Bearer Token Authentication */}
                  {adxConfig.authMethod === 'token' && (
                    <div>
                      <label className="block text-gray-500 mb-2">Bearer Token *</label>
                      <input
                        type="password"
                        value={adxConfig.token}
                        onChange={e => handleAdxConfigChange('token', e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                        placeholder="Your bearer token"
                        disabled={isLoading || adxConnected}
                      />
                    </div>
                  )}

                  {/* Connect Button */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 rounded-md text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        adxConnected ? 'bg-green-900 hover:bg-green-950' : 'bg-blue-900 hover:bg-blue-950'
                      }`}
                      onClick={handleConnectToADX}
                      disabled={isLoading || adxConnected}
                    >
                      {isLoading ? 'Connecting...' : adxConnected ? '✓ Connected' : 'Connect to ADX'}
                    </button>
                    {adxConnected && (
                      <button
                        type="button"
                        className="px-3 py-2 bg-gray-700 rounded-md text-white hover:bg-gray-800 transition-all duration-300"
                        onClick={() => {
                          setAdxConnected(false);
                          setTables([]);
                          setTableColumns([]);
                          setSelection(sel => ({ ...sel, selectedTable: '' }));
                        }}
                      >
                        Disconnect
                      </button>
                    )}
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
                  onChange={async (e) => {
                    const value = e.target.value;
                    setSelection(prev => ({
                      ...prev,
                      selectedTable: value,
                      selectedResultRange: 'all',
                      selectedChartDetails: { type: '', xCol: '', yCol: '' }
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

              {/* Chart Type Dropdown */}
              <div className="mb-4">
                <label className="block text-gray-500 mb-2">Chart Type</label>
                <select
                  value={selection.selectedChartDetails?.type || ''}
                  onChange={handleChartTypeChange}
                  className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                >
                  <option value="">Select chart type</option>
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              {/* Attribute Dropdowns based on chart type */}
              {selection.selectedTable && selection.selectedChartDetails?.type && tableColumns.length > 0 && (
                <div className="mb-4">
                  {['line', 'bar'].includes(selection.selectedChartDetails.type) && (
                    <>
                      <label className="block text-gray-500 mb-2">X Axis</label>
                      <select
                        value={selection.selectedChartDetails.xCol || ''}
                        onChange={e => handleAxisChange('xCol', e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none mb-2"
                      >
                        <option value="">Select X Axis</option>
                        {tableColumns.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                      <label className="block text-gray-500 mb-2">Y Axis</label>
                      <select
                        value={selection.selectedChartDetails.yCol || ''}
                        onChange={e => handleAxisChange('yCol', e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none mb-2"
                      >
                        <option value="">Select Y Axis</option>
                        {tableColumns.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                      <label className="block text-gray-500 mb-2">Group By (Optional)</label>
                      <select
                        value={selection.selectedChartDetails.groupCol || ''}
                        onChange={e => handleGroupByChange(e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none mb-2"
                      >
                        <option value="">None</option>
                        {tableColumns.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                    </>
                  )}
                  {selection.selectedChartDetails.type === 'pie' && (
                    <>
                      <label className="block text-gray-500 mb-2">Label Column</label>
                      <select
                        value={selection.selectedChartDetails.xCol || ''}
                        onChange={e => handleAxisChange('xCol', e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none mb-2"
                      >
                        <option value="">Select Label</option>
                        {tableColumns.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                      <label className="block text-gray-500 mb-2">Value Column</label>
                      <select
                        value={selection.selectedChartDetails.yCol || ''}
                        onChange={e => handleAxisChange('yCol', e.target.value)}
                        className="w-full bg-black border border-gray-600 rounded-md text-sm p-1 text-white placeholder:text-gray-500 focus:outline-none"
                      >
                        <option value="">Select Value</option>
                        {tableColumns.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

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

            </div>

            {error && (
              <div className="px-4 py-1 text-red-400 text-xs">{error}</div>
            )}
            <div className="flex justify-end gap-2 px-4">
              <button
                type="button"
                className="bg-gray-700 px-3 py-1 rounded-md text-white hover:bg-gray-800 transition-all duration-300"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="bg-green-900 px-3 py-1 rounded-md text-white hover:bg-green-950 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
              >
                Done
              </button>
            </div>
            {/* End of modal content */}
          </div>
        </div>
      )}
    </>
  );
};

export default DataSelector;