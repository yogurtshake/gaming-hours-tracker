import React from "react";

interface PaginationControlsProps {
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  currentPage: number;
  setCurrentPage: (n: number) => void;
  totalPages: number;
  perPageOptions?: number[];
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  perPageOptions = [5, 10, 25, 50, 100],
}) => (
  
  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
    <label >
      Items/page:
      <select
        value={itemsPerPage}
        onChange={e => setItemsPerPage(Number(e.target.value))}
        style={{ marginLeft: 8, width: '70px' }}
      >
        {perPageOptions.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
    <div className="pagination">
      <button
        type="button"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Prev
      </button>
      <span style={{ margin: "0 8px" }}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  </div>
);

export default PaginationControls;