import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { offlineApiClient } from '../../services/api/offlineApiClient';
import { offlineStorage } from '../../services/storage/offlineStorage';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  images: string[];
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await offlineApiClient.get<{ success: boolean; data: Product[] }>(
        '/api/v1/products',
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  },
);

export const createProduct = createAsyncThunk(
  'product/createProduct',
  async (productData: Omit<Product, 'id'>, { rejectWithValue }) => {
    try {
      const response = await offlineApiClient.post<{ success: boolean; data: Product }>(
        '/api/v1/products',
        productData,
        'product',
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create product');
    }
  },
);

export const updateProduct = createAsyncThunk(
  'product/updateProduct',
  async (productData: Product, { rejectWithValue }) => {
    try {
      const response = await offlineApiClient.put<{ success: boolean; data: Product }>(
        `/api/v1/products/${productData.id}`,
        productData,
        'product',
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update product');
    }
  },
);

export const loadOfflineProducts = createAsyncThunk('product/loadOfflineProducts', async () => {
  const products = await offlineStorage.getProducts();
  return products;
});

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder.addCase(fetchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.products = action.payload;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create product
    builder.addCase(createProduct.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.isLoading = false;
      state.products.push(action.payload);
    });
    builder.addCase(createProduct.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update product
    builder.addCase(updateProduct.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    });
    builder.addCase(updateProduct.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Load offline products
    builder.addCase(loadOfflineProducts.fulfilled, (state, action) => {
      state.products = action.payload;
    });
  },
});

export const { setProducts, setSelectedProduct, setLoading, setError } = productSlice.actions;
export default productSlice.reducer;
