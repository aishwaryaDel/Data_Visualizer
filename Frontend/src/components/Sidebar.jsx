
import { use, useEffect } from 'react';
import { extractTableInfo } from '../api_functions/sqlExtract';
import { FiArrowUpCircle } from 'react-icons/fi';
import { FaChartBar, FaTable } from 'react-icons/fa';
import { useState } from 'react';

const SideBar = ({ view, setView, toggleModal, tables, selection }) => {
    const [expanded, setExpanded] = useState(false);
    const [selectedTable, setSelectedTable] = useState('');
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [tableColumns, setTableColumns] = useState({}); // { tableName: [columns] }

    // When expanded and a table is selected, extract columns using extractTableInfo
    useEffect(() => {
        if (expanded && selectedTable && selection.db) {
            try {
                const { columns } = extractTableInfo(selection.db, selectedTable, 0);
                setTableColumns(prev => ({ ...prev, [selectedTable]: columns }));
            } catch (e) {
                setTableColumns(prev => ({ ...prev, [selectedTable]: [] }));
            }
        }
    }, [expanded, selectedTable, selection.db]);

    // Sync checked table and columns with selection when Data is expanded
    useEffect(() => {
        if (expanded && selection) {
            if (selection.selectedTable) {
                setSelectedTable(selection.selectedTable);
            }
            let cols = [];
            // If resultData has columns, use those as checked columns
            if (selection.resultData && Array.isArray(selection.resultData.columns)) {
                cols = selection.resultData.columns;
            } else {
                if (selection.xAxisColumn) cols.push(selection.xAxisColumn);
                if (selection.yAxisColumn && selection.yAxisColumn !== selection.xAxisColumn) cols.push(selection.yAxisColumn);
            }
            setSelectedColumns(cols);
        }
    }, [expanded, selection.selectedTable, selection.xAxisColumn, selection.yAxisColumn, selection.resultData]);

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
            <button
                onClick={() => toggleModal()}
                className={`bg-green-900 py-1 rounded-md text-white hover:bg-green-950 transition-all duration-300 ${expanded ? 'w-[12vw]' : 'w-[7vw]'}`}
            >
                Select Data
            </button>

            {/* Sidebar with view options or Data section */}
            <div
                className={`relative overflow-hidden transition-all duration-300 border border-gray-500 rounded-md flex flex-col items-center gap-2 text-gray-500 ${expanded ? 'w-[12vw] h-[90vh]' : 'w-[7vw] h-[100%]'}`}
                style={expanded ? { minHeight: '400px', overflowY: 'auto' } : {}}
            >
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

                {/* Expandable Data section, only show content if expanded */}
                <div
                    className={`absolute w-full bg-black z-10 flex flex-col items-center justify-start text-white uppercase font-semibold rounded-md cursor-pointer transition-all duration-300 ${expanded ? 'h-full top-0' : 'h-0 bottom-7'}`}
                >
                    <div
                        className={`flex items-center justify-center gap-1 w-full bg-gray-900 cursor-pointer ${expanded ? 'border rounded-t-md' : 'border-t rounded-md'} border-gray-500`}
                        onClick={() => setExpanded(e => !e)}
                    >
                        Data <FiArrowUpCircle className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                    {expanded && (
                        <div className='w-full px-2 py-2 text-xs normal-case font-normal text-gray-200'>
                            {/* Tables list */}
                            <div className='mb-2'>
                                <div className='font-semibold text-gray-300 mb-1'>Tables</div>
                                {Array.isArray(tables) && tables.length > 0 ? (
                                    tables.map((tbl) => (
                                        <div key={tbl} className='flex items-center gap-2 mb-1'>
                                            <input
                                                type='checkbox'
                                                checked={selectedTable === tbl}
                                                onChange={() => handleTableSelect(tbl)}
                                                className='accent-green-700'
                                            />
                                            <span>{tbl}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className='text-gray-400'>No tables found</div>
                                )}
                            </div>
                            {/* Columns list for selected table */}
                            {selectedTable && (
                                <div>
                                    <div className='font-semibold text-gray-300 mb-1'>Columns</div>
                                    {(tableColumns[selectedTable] || []).map(col => (
                                        <div key={col} className='flex items-center gap-2 mb-1 ml-2'>
                                            <input
                                                type='checkbox'
                                                checked={selectedColumns.includes(col)}
                                                onChange={() => handleColumnToggle(col)}
                                                className='accent-green-700'
                                                disabled={!selectedColumns.includes(col)}
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