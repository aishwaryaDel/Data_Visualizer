import React, { useState } from 'react'
import QueryBar from './QueryBar'
import DataSelector from './DataSelector'
import ChartViewer from './ChartViewer';
import TableViewer from './TableViewer';
import SideBar from './Sidebar';


const Main = () => {

  const [showModal, setShowModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('chart'); // 'chart' or 'table'
  const [selection, setSelection] = useState({
    dbFile: null,
    db: null,
    selectedTable: '',
    selectedChartDetails: {
      type: '',
    },
    // selectedDateRange: '',
    selectedResultRange: '',
    resultData: null,
  });


  // Helper functions for formatting
  // function formatDateRange(val) {
  //   switch (val) {
  //     case '30min': return 'Last 30 min';
  //     case '1hr': return 'Last 1 hour';
  //     case '1d': return 'Last 1 day';
  //     case '7d': return 'Last 7 days';
  //     case '15d': return 'Last 15 days';
  //     case '30d': return 'Last 30 days';
  //     default: return val;
  //   }
  // }

  function formatResultRange(val) {
    switch (val) {
      case 'all': return 'All rows';
      case 'last10': return 'Last 10 rows';
      case 'last100': return 'Last 100 rows';
      case 'last1000': return 'Last 1000 rows';
      case 'first10': return 'First 10 rows';
      case 'first100': return 'First 100 rows';
      case 'first1000': return 'First 1000 rows';
      default: return val;
    }
  }

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <>
      {/* Modal to create/raise ticket  */}
      <DataSelector showModal={showModal} setShowModal={setShowModal} toggleModal={toggleModal} setView={setView}
        selection={selection} setSelection={setSelection} setChartLoading={setLoading}
        tables={tables} setTables={setTables} />

      {/* Top container  */}
      <div className='h-[88vh] w-[95%] mx-auto mt-4 flex gap-4'>

       <SideBar view={view} setView={setView} toggleModal={toggleModal} 
        tables={tables} selection={selection} />

        <div className='w-[90vw] h-[100%] flex flex-col items-end justify-between gap-4'>
          {/* Query bar here */}
          <QueryBar setSelection={setSelection} setView={setView} />

          {/* Right container display visualization */}
          <div className='w-full h-[100%] border overflow-auto border-gray-500 rounded-md pt-1 pb-3 px-5'>
            {selection?.resultData &&
              <div className='sticky top-0 z-10 w-full bg-black flex items-center justify-end gap-4'>
                {/* <span className=' text-gray-500 text-sm py-2'>Time range: {formatDateRange(selection.selectedDateRange)}</span> */}
                <span className=' text-gray-500 text-sm py-2'>Show: {formatResultRange(selection.selectedResultRange)}</span>
              </div>
            }

            {loading ? (
              view === 'chart' ? <ChartViewer selection={selection} data={selection.resultData} loading={true} /> : <TableViewer loading={true} />
            ) : selection?.resultData ? (
              view === 'chart' ? <ChartViewer selection={selection} data={selection.resultData} loading={false} /> : <TableViewer data={selection.resultData} loading={false} />
            ) : (
              <div className=' text-gray-500 text-center py-8'>
                Select Data for Visualization
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  )
}

export default Main