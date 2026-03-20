import api from './api';

export interface SearchFilters {
  [key: string]: unknown;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  from?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchHit {
  _id: string;
  _source: Record<string, unknown>;
  _score: number;
  _index: string;
}

export interface SearchResult {
  hits: {
    total: { value: number };
    hits: SearchHit[];
  };
}

export interface SavedFilter {
  id: string;
  name: string;
  module: string;
  filters: SearchFilters;
  createdAt: string;
}

const searchService = {
  // Global search across all modules
  globalSearch: async (query: string, from = 0, size = 20): Promise<SearchResult> => {
    const response = await api.get('/search/global', {
      params: { q: query, from, size },
    });
    return response.data.data || response.data;
  },

  // Search products
  searchProducts: async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
    const response = await api.get('/search/products', {
      params: { q: query, ...filters },
    });
    return response.data.data || response.data;
  },

  // Search customers
  searchCustomers: async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
    const response = await api.get('/search/customers', {
      params: { q: query, ...filters },
    });
    return response.data.data || response.data;
  },

  // Search suppliers
  searchSuppliers: async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
    const response = await api.get('/search/suppliers', {
      params: { q: query, ...filters },
    });
    return response.data.data || response.data;
  },

  // Search orders
  searchOrders: async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
    const response = await api.get('/search/orders', {
      params: { q: query, ...filters },
    });
    return response.data.data || response.data;
  },

  // Get search suggestions
  suggest: async (query: string, field?: string, index?: string): Promise<string[]> => {
    const response = await api.get('/search/suggest', {
      params: { q: query, field, index },
    });
    return response.data.data || response.data;
  },

  // Advanced search with complex filters
  advancedSearch: async (searchQuery: SearchQuery): Promise<SearchResult> => {
    const response = await api.post('/search/advanced', searchQuery);
    return response.data.data || response.data;
  },

  // Saved filters management (stored in localStorage for now)
  getSavedFilters: (module?: string): SavedFilter[] => {
    const filters = localStorage.getItem('savedFilters');
    if (!filters) return [];
    const allFilters: SavedFilter[] = JSON.parse(filters);
    return module ? allFilters.filter((f) => f.module === module) : allFilters;
  },

  saveFilter: (name: string, module: string, filters: SearchFilters): SavedFilter => {
    const savedFilters = searchService.getSavedFilters();
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      module,
      filters,
      createdAt: new Date().toISOString(),
    };
    savedFilters.push(newFilter);
    localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
    return newFilter;
  },

  deleteFilter: (id: string): void => {
    const savedFilters = searchService.getSavedFilters();
    const filtered = savedFilters.filter((f) => f.id !== id);
    localStorage.setItem('savedFilters', JSON.stringify(filtered));
  },
};

export default searchService;
