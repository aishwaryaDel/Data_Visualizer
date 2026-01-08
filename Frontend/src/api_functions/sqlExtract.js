// sqlExtract.js
// Utility function to extract table info and sample data from a SQLite database using sql.js

/**
 * Extracts column info and sample rows from a SQLite table.
 * @param {Object} db - sql.js Database instance
 * @param {string} selectedTable - Table name to extract info from
 * @param {number} sampleLimit - Number of sample rows to fetch (default: 3)
 * @returns {Object} { columns: string[], sampleRows: object[] }
 */
export function extractTableInfo(db, selectedTable, sampleLimit = 3) {
  if (!db || !selectedTable) {
    throw new Error('Database and table name are required');
  }

  // Get table columns
  const tableInfoResult = db.exec(`PRAGMA table_info(${selectedTable})`);
  const columns = tableInfoResult.length > 0
    ? tableInfoResult[0].values.map(row => row[1]) // column names at index 1
    : [];

  // Get sample rows
  const sampleResult = db.exec(`SELECT * FROM ${selectedTable} LIMIT ${sampleLimit}`);
  const sampleRows = sampleResult.length > 0
    ? sampleResult[0].values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      })
    : [];

  return { columns, sampleRows };
}

/**
 * Extracts chart-ready data from a SQLite table.
 * @param {Object} db - sql.js Database instance
 * @param {string} selectedTable - Table name
 * @param {string} chartType - 'line' | 'bar' | 'pie'
 * @param {Object} attributes - { xCol: string, yCol: string }
 * @param {string} resultRange - 'all' | 'last10' | 'last100' | 'last1000' | 'first10' | 'first100' | 'first1000'
 * @returns {Object} { columns: string[], rows: object[] }
 */
export async function extractChartData(db, selectedTable, chartType, attributes, resultRange = 'all') {
  if (!db || !selectedTable || !attributes) {
    throw new Error('Database, table name, and attributes are required');
  }

  // Artificial delay for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Determine which columns to select based on chart type
  let selectedColumns = [];
  if (chartType === 'pie') {
    selectedColumns = [attributes.xCol, attributes.yCol];
  } else if (chartType === 'line' || chartType === 'bar') {
    selectedColumns = [attributes.xCol, attributes.yCol];
    if (attributes.groupCol) {
      selectedColumns.push(attributes.groupCol);
    }
  } else {
    throw new Error('Unsupported chart type');
  }
  // Remove duplicates and filter falsy
  selectedColumns = Array.from(new Set(selectedColumns)).filter(Boolean);

  // Build SQL query
  let orderBy = '';
  let limit = '';
  if (resultRange && resultRange !== 'all') {
    if (resultRange.startsWith('last')) {
      limit = `LIMIT ${resultRange.replace('last', '')}`;
      orderBy = `${selectedColumns[0] ? `ORDER BY ${selectedColumns[0]} DESC` : ''}`;
    } else if (resultRange.startsWith('first')) {
      limit = `LIMIT ${resultRange.replace('first', '')}`;
      orderBy = `${selectedColumns[0] ? `ORDER BY ${selectedColumns[0]} ASC` : ''}`;
    }
  }

  const query = `SELECT ${selectedColumns.join(', ')} FROM ${selectedTable} ${orderBy} ${limit}`.trim();
  const result = db.exec(query);

  let rows = [];
  if (result.length > 0 && result[0].columns && result[0].values) {
    const columns = result[0].columns;
    rows = result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    return { columns, rows };
  }
  return { columns: selectedColumns, rows: [] };
}