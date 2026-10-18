export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return {
    data,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }
}
