import React from 'react';

const Pagination = ({ 
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className
}) => {
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5; // Maximum number of page buttons to display
    
    if (totalPages <= maxPageButtons) {
      // If total pages are less than maximum, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Add pages around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if current page is near first or last page
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis before middle pages if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis after middle pages if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  // Available page size options
  const pageSizeOptions = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 'all', label: 'All' }
  ];
  
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center py-4 ${className || ''}`}>
      <div className="flex items-center text-sm text-gray-600 mb-4 sm:mb-0">
        <span>
          {pageSize === 'all' ? (
            `Showing all ${totalItems} items`
          ) : (
            `Showing ${Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-${Math.min(totalItems, currentPage * pageSize)} of ${totalItems} items`
          )}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center ml-4">
            <span className="mr-2">Items per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            className={`p-2 rounded ${isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="First page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirstPage}
            className={`p-2 rounded ${isFirstPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? 'bg-blue-500 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLastPage}
            className={`p-2 rounded ${isLastPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            className={`p-2 rounded ${isLastPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Last page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination; 