import React, { useState } from 'react'
import PromptBar from './PromptBar'
import DataSelector from './DataSelector'
import ChartViewer from './ChartViewer';
import TableViewer from './TableViewer';
import SideBar from './Sidebar';


const Main = () => {

  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('chart'); // 'chart' or 'table'
  const [selection, setSelection] = useState({
    selectedTable: '',
    selectedDateRange: '',
    selectedResultRange: '',
  });

  // Helper functions for formatting
  function formatDateRange(val) {
    switch (val) {
      case '30min': return 'Last 30 min';
      case '1hr': return 'Last 1 hour';
      case '1d': return 'Last 1 day';
      case '7d': return 'Last 7 days';
      case '15d': return 'Last 15 days';
      case '30d': return 'Last 30 days';
      default: return val;
    }
  }

  function formatResultRange(val) {
    switch (val) {
      case 'all': return 'All rows';
      case 'last100': return 'Last 100 rows';
      case 'last1000': return 'Last 1000 rows';
      case 'first100': return 'First 100 rows';
      case 'first1000': return 'First 1000 rows';
      default: return val;
    }
  }

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Custom setter to control loading state
  const handleSetSelectedData = (data) => {
    setView('chart');
    setLoading(true);
    setSelectedData(null);
    setTimeout(() => {
      setSelectedData(data);
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Modal to create/raise ticket  */}
      <DataSelector showModal={showModal} setShowModal={setShowModal} toggleModal={toggleModal}
        selection={selection} setSelection={setSelection} setSelectedData={handleSetSelectedData} />

      {/* Top container  */}
      <div className='h-[88vh] w-[95%] mx-auto mt-4 flex gap-4'>

       <SideBar view={view} setView={setView} toggleModal={toggleModal} />

        <div className='w-[90vw] h-[100%] flex flex-col items-end justify-between gap-4'>
          {/* Prompt bar here */}
          <PromptBar setSelectedData={setSelectedData} />

          {/* Right container display visualization */}
          <div className='w-full h-[100%] border overflow-auto border-gray-500 rounded-md pt-1 pb-3 px-5'>
            {selectedData &&
              <div className=' w-full flex items-center justify-end gap-4'>
                <span className=' text-gray-500 text-sm py-2'>Time range: {formatDateRange(selection.selectedDateRange)}</span>
                <span className=' text-gray-500 text-sm py-2'>Show: {formatResultRange(selection.selectedResultRange)}</span>
              </div>
            }

            {loading ? (
              view === 'chart' ? <ChartViewer loading={true} /> : <TableViewer loading={true} />
            ) : selectedData ? (
              view === 'chart' ? <ChartViewer data={selectedData} loading={false} /> : <TableViewer data={selectedData} loading={false} />
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