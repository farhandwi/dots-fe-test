import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';
import { Menu } from '@headlessui/react';

type Props = {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  currentPage: number;
};

const Pagination = ({ pageCount, onPageChange, perPage, setPerPage, currentPage }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setIsOpen(false); // Tutup menu setelah pemilihan
  };

  return (
    <div className="flex justify-between items-center p-4 mb-52">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button 
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex justify-center w-full rounded-full border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Show {perPage} Per Page
            <svg 
              className={`-mr-1 ml-2 h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Menu.Button>
        </div>

        {isOpen && (
          <Menu.Items 
            className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50"
          >
            <div className="py-1">
              {[5, 10, 15, 20, 30].map((value) => (
                <Menu.Item key={value}>
                  {({ active }) => (
                    <button
                      className={`
                        ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                        ${perPage === value ? 'bg-gray-50 font-medium' : ''}
                        group flex items-center w-full px-4 py-2 text-sm
                      `}
                      onClick={() => handlePerPageChange(value)}
                    >
                      Show {value} Per Page
                      {perPage === value && (
                        <span className="ml-2 text-indigo-600">✓</span>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        )}
      </Menu>

      <ReactPaginate
        previousLabel={
          <div className={`py-2 px-4 rounded-full ${currentPage === 1 ? 'bg-gray-300 text-gray-500' : 'text-white bg-green-600 hover:bg-green-700'} inline-flex items-center`}>
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Previous
          </div>
        }
        nextLabel={
          <div className={`py-2 px-4 rounded-full ${currentPage === pageCount ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'} inline-flex items-center`}>
            Next
            <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        }
        breakLabel={'...'}
        breakClassName={'break-me'}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={onPageChange}
        containerClassName={'pagination flex list-none justify-center gap-2'}
        activeClassName={'active'}
        pageClassName={'page-item'}
        pageLinkClassName={'page-link py-2 px-3 border rounded-full text-gray-700 bg-white cursor-pointer hover:bg-gray-200'}
        previousLinkClassName={'page-link'}
        nextLinkClassName={'page-link'}
        disabledClassName={'disabled'}
        activeLinkClassName={'bg-yellow-400 text-white'}
        forcePage={currentPage - 1}
      />
    </div>
  );
};

export default Pagination;
