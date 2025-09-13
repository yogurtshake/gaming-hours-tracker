import { useState } from "react";

export function usePagination<T>(items: T[], defaultPerPage = 10) {
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSetItemsPerPage = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  return {
    paginatedItems,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
  };
}