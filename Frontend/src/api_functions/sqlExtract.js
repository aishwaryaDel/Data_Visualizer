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
