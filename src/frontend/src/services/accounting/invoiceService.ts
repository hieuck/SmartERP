import api from './api';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface InvoiceItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  orderId?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  orderId?: string;
  issueDate: string;
  dueDate: string;
  items: Omit<InvoiceItem, 'productName' | 'total'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface UpdateInvoiceDto {
  issueDate?: string;
  dueDate?: string;
  items?: Omit<InvoiceItem, 'productName' | 'total'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface RecordPaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export const invoiceService = {
  getAll: async (params: InvoiceQueryParams) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInvoiceDto): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  send: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  recordPayment: async (id: string, data: RecordPaymentDto): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/payment`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/cancel`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/invoices/statistics');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/invoices/overdue');
    return response.data;
  },
};

export default invoiceService;
