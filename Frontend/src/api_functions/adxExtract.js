/**
 * adxExtract.js
 * Utility functions for extracting and formatting data from Azure Data Explorer (ADX)
 * Similar to sqlExtract.js but for KQL queries
 */

import { executeADXQuery } from './api';

/**
 * Generates a KQL query for chart data extraction
 * @param {string} tableName - ADX table name
 * @param {string} chartType - 'line' | 'bar' | 'pie'
 * @param {Object} attributes - { xCol, yCol, groupCol }
 * @param {string} resultRange - 'all' | 'last10' | 'last100' | etc.
 * @returns {string} - KQL query string
 */
function generateKQLQuery(tableName, chartType, attributes, resultRange) {
  const { xCol, yCol, groupCol } = attributes;
  
  // Determine limit based on result range
  let limit = '';
  let orderDirection = 'asc';
  
  switch (resultRange) {
    case 'last10':
      limit = '| take 10';
      orderDirection = 'desc';
      break;
    case 'last100':
      limit = '| take 100';
      orderDirection = 'desc';
      break;
    case 'last1000':
      limit = '| take 1000';
      orderDirection = 'desc';
      break;
    case 'first10':
      limit = '| take 10';
      break;
    case 'first100':
      limit = '| take 100';
      break;
    case 'first1000':
      limit = '| take 1000';
      break;
    default: // 'all'
      limit = '';
  }

  let query = '';

  if (chartType === 'pie') {
    // For pie charts, aggregate values by label
    query = `
      ${tableName}
      | summarize Value = sum(todecimal(${yCol})) by Label = tostring(${xCol})
      | order by Value desc
      ${limit}
    `.trim();
  } else if (groupCol && groupCol !== '') {
    // For line/bar charts with grouping
    query = `
      ${tableName}
      | project XValue = ${xCol}, YValue = todecimal(${yCol}), GroupBy = tostring(${groupCol})
      | order by XValue ${orderDirection}
      ${limit}
    `.trim();
  } else {
    // For line/bar charts without grouping
    query = `
      ${tableName}
      | project XValue = ${xCol}, YValue = todecimal(${yCol})
      | order by XValue ${orderDirection}
      ${limit}
    `.trim();
  }

  return query;
}

/**
 * Extracts chart-ready data from ADX table
 * @param {string} clusterUrl - ADX cluster URL
 * @param {string} database - Database name
 * @param {string} tableName - Table name
 * @param {string} chartType - 'line' | 'bar' | 'pie'
 * @param {Object} attributes - { xCol, yCol, groupCol }
 * @param {string} resultRange - Result range selection
 * @returns {Promise<Object>} - { columns: string[], rows: object[] }
 */
export async function extractADXChartData(
  clusterUrl,
  database,
  tableName,
  chartType,
  attributes,
  resultRange = 'all'
) {
  try {
    // Generate KQL query
    const query = generateKQLQuery(tableName, chartType, attributes, resultRange);
    
    console.log('Executing KQL query:', query);
    
    // Execute query
    const result = await executeADXQuery(clusterUrl, database, query);
    
    if (!result.success || !result.rows) {
      throw new Error('Failed to fetch data from ADX');
    }

    // Transform data based on chart type
    let transformedRows;
    
    if (chartType === 'pie') {
      // Pie chart format: { label: string, value: number }
      transformedRows = result.rows.map(row => ({
        label: row.Label || row.label,
        value: parseFloat(row.Value || row.value || 0)
      }));
    } else if (attributes.groupCol) {
      // Grouped line/bar chart format: { x: any, y: number, group: string }
      transformedRows = result.rows.map(row => ({
        x: row.XValue || row.xValue || row.x,
        y: parseFloat(row.YValue || row.yValue || row.y || 0),
        group: row.GroupBy || row.groupBy || row.group || 'Default'
      }));
    } else {
      // Simple line/bar chart format: { x: any, y: number }
      transformedRows = result.rows.map(row => ({
        x: row.XValue || row.xValue || row.x,
        y: parseFloat(row.YValue || row.yValue || row.y || 0)
      }));
    }

    return {
      columns: result.columns,
      rows: transformedRows,
      originalData: result.rows
    };
    
  } catch (error) {
    console.error('Error extracting ADX chart data:', error);
    throw error;
  }
}

/**
 * Validates ADX column selection for chart type
 * @param {string} chartType - Chart type
 * @param {Object} attributes - Selected attributes
 * @param {Array} availableColumns - Available columns in table
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateADXChartSelection(chartType, attributes, availableColumns) {
  const { xCol, yCol, groupCol } = attributes;
  
  // Check if columns exist
  if (!xCol || !yCol) {
    return {
      valid: false,
      message: 'Please select both X and Y columns'
    };
  }

  if (xCol === yCol) {
    return {
      valid: false,
      message: 'X and Y columns must be different'
    };
  }

  // Check if columns exist in table
  const columnNames = availableColumns.map(col => col.name || col);
  
  if (!columnNames.includes(xCol)) {
    return {
      valid: false,
      message: `Column '${xCol}' not found in table`
    };
  }

  if (!columnNames.includes(yCol)) {
    return {
      valid: false,
      message: `Column '${yCol}' not found in table`
    };
  }

  if (groupCol && !columnNames.includes(groupCol)) {
    return {
      valid: false,
      message: `Group column '${groupCol}' not found in table`
    };
  }

  return {
    valid: true,
    message: 'Selection is valid'
  };
}

/**
 * Converts ADX data type to chart-friendly type
 * @param {string} adxType - ADX/Kusto data type
 * @returns {string} - 'string' | 'number' | 'datetime' | 'boolean'
 */
export function convertADXType(adxType) {
  const type = adxType.toLowerCase();
  
  if (type.includes('int') || type.includes('real') || type.includes('decimal') || type.includes('long')) {
    return 'number';
  }
  
  if (type.includes('datetime') || type.includes('date') || type.includes('timespan')) {
    return 'datetime';
  }
  
  if (type.includes('bool')) {
    return 'boolean';
  }
  
  return 'string';
}

/**
 * Formats datetime values from ADX for display
 * @param {any} value - Value to format
 * @returns {string} - Formatted string
 */
export function formatADXDateTime(value) {
  if (!value) return '';
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    
    return date.toLocaleString();
  } catch (error) {
    return String(value);
  }
}

/**
 * Suggests best column for X-axis based on data types
 * @param {Array} columns - Array of { name, type } objects
 * @returns {string} - Suggested column name
 */
export function suggestXColumn(columns) {
  // Prefer datetime columns for X-axis
  const dateTimeCol = columns.find(col => 
    convertADXType(col.type) === 'datetime'
  );
  
  if (dateTimeCol) return dateTimeCol.name;
  
  // Otherwise, prefer string columns
  const stringCol = columns.find(col =>
    convertADXType(col.type) === 'string'
  );
  
  if (stringCol) return stringCol.name;
  
  // Fallback to first column
  return columns[0]?.name || '';
}

/**
 * Suggests best column for Y-axis based on data types
 * @param {Array} columns - Array of { name, type } objects
 * @returns {string} - Suggested column name
 */
export function suggestYColumn(columns) {
  // Prefer numeric columns for Y-axis
  const numericCol = columns.find(col =>
    convertADXType(col.type) === 'number'
  );
  
  return numericCol?.name || columns[1]?.name || '';
}

/**
 * Suggests best column for grouping
 * @param {Array} columns - Array of { name, type } objects
 * @returns {string} - Suggested column name or empty string
 */
export function suggestGroupColumn(columns) {
  // Look for columns with "category", "type", "group", "class" in name
  const categoryCol = columns.find(col => {
    const name = col.name.toLowerCase();
    return name.includes('category') || 
           name.includes('type') || 
           name.includes('group') ||
           name.includes('class') ||
           name.includes('tag');
  });
  
  if (categoryCol) return categoryCol.name;
  
  // Otherwise prefer string columns (excluding datetime and first column)
  const stringCol = columns.find(col =>
    convertADXType(col.type) === 'string' &&
    convertADXType(col.type) !== 'datetime' &&
    col !== columns[0]
  );
  
  return stringCol?.name || '';
}

export default {
  extractADXChartData,
  validateADXChartSelection,
  convertADXType,
  formatADXDateTime,
  suggestXColumn,
  suggestYColumn,
  suggestGroupColumn
};
