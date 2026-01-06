import React, { useState } from 'react'
import { FaChartBar, FaTable } from 'react-icons/fa';
import { FiArrowUpCircle } from 'react-icons/fi';

const mockTables = [
    {
        name: 'Sample Table',
        columns: ['id', 'name', 'date', 'value']
    },
    {
        name: 'Another Table',
        columns: ['colA', 'colB', 'colC']
    }
];

const SideBar = ({ view, setView, toggleModal }) => {
    const [expanded, setExpanded] = useState(false);
    const [selectedTable, setSelectedTable] = useState('');
    const [selectedColumns, setSelectedColumns] = useState([]);

    const handleTableSelect = (table) => {
        setSelectedTable(table);
        setSelectedColumns([]);
    };

    const handleColumnToggle = (col) => {
        setSelectedColumns((prev) =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <div className={`h-[100%] flex flex-col items-center justify-between gap-3`}>

            {/* Select Data button */}
            <button onClick={() => toggleModal()} className='w-[7vw] bg-green-900 py-1 rounded-md text-white
                hover:bg-green-950 transition-all duration-300'>Select Data</button>

            {/* Sidebar with view options */}
            <div className={`w-[7vw] ${expanded ? 'h-[90vh]' : 'h-[100%]'} text-gray-500 border border-gray-500 rounded-md flex flex-col items-center justify-between gap-2 transition-all duration-300`}
                style={expanded ? { minHeight: '400px', overflowY: 'auto' } : {}}>
                <div className='py-2 w-full flex flex-col items-center gap-2'>
                    <button
                        className={`w-full py-2 rounded-md text-sm flex items-center justify-center gap-2 transition-all duration-300 ${view === 'chart' ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-900'}`}
                        onClick={() => setView('chart')}
                    >
                        <FaChartBar className='text-lg' /> Chart View
                    </button>
                    <button
                        className={`w-full py-2 rounded-md text-sm flex items-center justify-center gap-2 transition-all duration-300 ${view === 'table' ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-900'}`}
                        onClick={() => setView('table')}
                    >
                        <FaTable className='text-lg' /> Table View
                    </button>
                </div>

                {/* Expandable Data section */}
                <div className={`w-full bg-black z-10 flex flex-col items-center justify-start
                    text-white uppercase font-semibold rounded-md cursor-pointer transition-all 
                    duration-300 ${expanded ? 'h-full' : ''}`}>

                    <div className={`flex items-center justify-center gap-1 w-full bg-gray-900
                      ${expanded ? 'border rounded-t-md' : 'border-t rounded-md'} border-gray-500`}
                    onClick={() => setExpanded(e => !e)}>
                        Data <FiArrowUpCircle className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                    {expanded && (
                        <div className='w-full px-2 py-2 text-xs normal-case font-normal text-gray-200'>
                            {/* Tables list */}
                            <div className='mb-2'>
                                <div className='font-semibold text-gray-300 mb-1'>Tables</div>
                                {mockTables.map((tbl) => (
                                    <div key={tbl.name} className='flex items-center gap-2 mb-1'>
                                        <input
                                            type='checkbox'
                                            checked={selectedTable === tbl.name}
                                            onChange={() => handleTableSelect(tbl.name)}
                                            className='accent-green-700'
                                        />
                                        <span>{tbl.name}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Columns list for selected table */}
                            {selectedTable && (
                                <div>
                                    <div className='font-semibold text-gray-300 mb-1'>Columns</div>
                                    {mockTables.find(t => t.name === selectedTable)?.columns.map(col => (
                                        <div key={col} className='flex items-center gap-2 mb-1 ml-2'>
                                            <input
                                                type='checkbox'
                                                checked={selectedColumns.includes(col)}
                                                onChange={() => handleColumnToggle(col)}
                                                className='accent-green-700'
                                            />
                                            <span>{col}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}

export default SideBar