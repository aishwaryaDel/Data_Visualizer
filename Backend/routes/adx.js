/**
 * Azure Data Explorer (ADX/Kusto) Backend API Routes
 * 
 * This is a sample implementation for Node.js/Express backend
 * Install required packages: npm install azure-kusto-data @azure/identity express
 */

const express = require('express');
const { Client: KustoClient, KustoConnectionStringBuilder } = require('azure-kusto-data');

const router = express.Router();

// Store active connections in session or cache
// In production, use Redis or similar for session management
const activeConnections = new Map();

/**
 * Helper function to create Kusto connection string
 */
function createKustoConnectionString(clusterUrl, authMethod, credentials) {
  let kcsb;
  
  switch (authMethod) {
    case 'appKey':
      kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
        clusterUrl,
        credentials.clientId,
        credentials.clientSecret,
        credentials.tenantId
      );
      break;
      
    case 'token':
      kcsb = KustoConnectionStringBuilder.withAadApplicationTokenAuthentication(
        clusterUrl,
        credentials.token
      );
      break;
      
    case 'aad':
    default:
      // For interactive auth, you may need to implement device code flow
      kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl);
      break;
  }
  
  return kcsb;
}

/**
 * POST /api/adx/connect
 * Test connection to ADX cluster
 */
router.post('/api/adx/connect', async (req, res) => {
  try {
    const { clusterUrl, database, authMethod, credentials } = req.body;
    
    // Validate inputs
    if (!clusterUrl || !database) {
      return res.status(400).json({
        success: false,
        message: 'Cluster URL and database are required'
      });
    }

    // Create connection string
    const kcsb = createKustoConnectionString(clusterUrl, authMethod, credentials);
    const client = new KustoClient(kcsb);
    
    // Test connection with a simple query
    const testQuery = `.show database ${database} schema | take 1`;
    await client.execute(database, testQuery);
    
    // Store connection info in session/cache (optional)
    const connectionKey = `${clusterUrl}_${database}`;
    activeConnections.set(connectionKey, { kcsb, timestamp: Date.now() });
    
    res.json({
      success: true,
      message: 'Successfully connected to ADX cluster'
    });
    
  } catch (error) {
    console.error('ADX connection error:', error);
    res.status(500).json({
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
});

/**
 * POST /api/adx/tables
 * Fetch list of tables from ADX database
 */
router.post('/api/adx/tables', async (req, res) => {
  try {
    const { clusterUrl, database, authMethod, credentials } = req.body;
    
    // Create or retrieve connection
    const kcsb = createKustoConnectionString(clusterUrl, authMethod, credentials);
    const client = new KustoClient(kcsb);
    
    // Query to get all tables
    const query = `
      .show database ${database} schema
      | where TableName != "" and EntityType == "Table"
      | project TableName
      | distinct TableName
      | sort by TableName asc
    `;
    
    const result = await client.execute(database, query);
    const tables = result.primaryResults[0].rows().map(row => row[0]);
    
    res.json({
      tables,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching ADX tables:', error);
    res.status(500).json({
      tables: [],
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/adx/schema
 * Get schema (columns and types) for a specific table
 */
router.post('/api/adx/schema', async (req, res) => {
  try {
    const { clusterUrl, database, tableName, authMethod, credentials } = req.body;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Table name is required'
      });
    }

    const kcsb = createKustoConnectionString(clusterUrl, authMethod, credentials);
    const client = new KustoClient(kcsb);
    
    // Get table schema
    const query = `${tableName} | getschema | project ColumnName, ColumnType`;
    
    const result = await client.execute(database, query);
    const columns = result.primaryResults[0].rows().map(row => ({
      name: row[0],
      type: row[1]
    }));
    
    res.json({
      columns,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching ADX schema:', error);
    res.status(500).json({
      columns: [],
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/adx/query
 * Execute a KQL query and return results
 */
router.post('/api/adx/query', async (req, res) => {
  try {
    const { clusterUrl, database, query, authMethod, credentials } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Basic KQL injection prevention (enhance as needed)
    const dangerousPatterns = [
      '.drop',
      '.delete',
      '.clear',
      '.alter',
      '.create',
      '.set'
    ];
    
    const lowerQuery = query.toLowerCase();
    for (const pattern of dangerousPatterns) {
      if (lowerQuery.includes(pattern)) {
        return res.status(403).json({
          success: false,
          message: 'Query contains potentially dangerous operations'
        });
      }
    }

    const kcsb = createKustoConnectionString(clusterUrl, authMethod, credentials);
    const client = new KustoClient(kcsb);
    
    const result = await client.execute(database, query);
    
    // Extract columns and rows
    const primaryResult = result.primaryResults[0];
    const columns = primaryResult.columns.map(col => ({
      name: col.name,
      type: col.type
    }));
    
    const rows = primaryResult.rows().map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col.name] = row[idx];
      });
      return obj;
    });
    
    res.json({
      rows,
      columns: columns.map(c => c.name),
      success: true,
      rowCount: rows.length
    });
    
  } catch (error) {
    console.error('Error executing ADX query:', error);
    res.status(500).json({
      rows: [],
      columns: [],
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/adx/disconnect
 * Clean up connection resources
 */
router.post('/api/adx/disconnect', async (req, res) => {
  try {
    const { clusterUrl, database } = req.body;
    const connectionKey = `${clusterUrl}_${database}`;
    
    activeConnections.delete(connectionKey);
    
    res.json({
      success: true,
      message: 'Disconnected successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Cleanup old connections (run periodically)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [key, value] of activeConnections.entries()) {
    if (now - value.timestamp > maxAge) {
      activeConnections.delete(key);
      console.log(`Cleaned up stale connection: ${key}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = router;
