import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Stock {
  productId: string;
  warehouseId: string;
  quantity: number;
  availableQuantity: number;
}

interface InventoryState {
  stocks: Stock[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  stocks: [],
  isLoading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setStocks: (state, action: PayloadAction<Stock[]>) => {
      state.stocks = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setStocks, setLoading, setError } = inventorySlice.actions;
export default inventorySlice.reducer;
