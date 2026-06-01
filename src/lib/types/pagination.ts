export type Pagination = {
  cursor: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};
