import React from 'react'


const TableViewer = ({ data, loading }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data to display</div>;
  }

  // Get table headers from keys of first object
  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full rounded-md">
        <thead>
          <tr className="bg-gray-900 uppercase text-white">
            {headers.map((header) => (       
              <th key={header} className="px-4 py-2 border border-gray-800 text-left text-sm font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
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