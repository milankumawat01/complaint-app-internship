
export type ID = number;

export type PageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type ApiError = {
  detail: string | ValidationErrorItem[];
};

export type ApiSuccess = {
  ok: boolean;
};

export type ISODateTime = string;

export type DateString = string;

export type TimeString = string;
