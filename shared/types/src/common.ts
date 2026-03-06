// Common utility types

export interface Address {
  street: string;
  ward?: string;
  district?: string;
  city: string;
  country: string;
  postalCode?: string;
  phone?: string;
  contactName?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}
