import { useState, useCallback, useMemo } from "react";
import { PAGINATION } from "@/lib/constants";

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 0,
    initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const offset = useMemo(() => page * pageSize, [page, pageSize]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(0, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when changing page size
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    offset,
    limit: pageSize,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    reset,
    paginationState: { page, pageSize } as PaginationState,
  };
}

