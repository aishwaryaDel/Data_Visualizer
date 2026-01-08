import React from 'react'

const TableViewer = ({ data, loading }) => {
  // Handle loading state
  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading...</div>;
  }

  // Handle new format: { columns: [...], rows: [...] }
  if (data && data.columns && Array.isArray(data.rows)) {
    const headers = data.columns;
    const rows = data.rows;
    if (rows.length === 0) {
      return <div className="text-gray-500 text-center py-8">No data to display</div>;
    }
    return (
      <div className="overflow-auto max-h-[90%]">
        <table className="min-w-full rounded-md">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-900 uppercase text-white">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 border border-gray-800 text-left text-sm font-semibold bg-gray-900 sticky top-0 z-20"
                  style={{ background: '#111827' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="overflow-y-auto">
            {rows.map((row, idx) => (
              <tr key={idx} className="text-white">
                {headers.map((header) => (
                  <td key={header} className="px-4 py-2 border border-gray-800 text-sm">{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback: old format (array of objects)
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data to display</div>;
  }
  const headers = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
      <table className="min-w-full rounded-md">
        <thead className="sticky top-0 z-20">
          <tr className="bg-gray-900 uppercase text-white">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 border border-gray-800 text-left text-sm font-semibold bg-gray-900 sticky top-0 z-20"
                style={{ background: '#111827' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="overflow-y-auto">
          {data.map((row, idx) => (
            <tr key={idx} className="text-white">
              {headers.map((header) => (
                <td key={header} className="px-4 py-2 border border-gray-800 text-sm">{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableViewer