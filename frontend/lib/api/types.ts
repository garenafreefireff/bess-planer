export type PageMeta = {
  page: number;
  page_size: number;
  total: number;
};

export type PageResponse<T> = {
  items: T[];
  meta: PageMeta;
};

export type MessageResponse = {
  message: string;
};
