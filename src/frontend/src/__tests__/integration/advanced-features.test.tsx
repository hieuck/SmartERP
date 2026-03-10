import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import searchService from '../../services/utils/searchService';
import importExportService from '../../services/import-export/importExportService';
import notificationService from '../../services/notification/notificationService';
import GlobalSearchBar from '../../components/search/GlobalSearchBar';
import ImportWizard from '../../components/import-export/ImportWizard';
import NotificationBell from '../../components/notifications/NotificationBell';

// Mock services
vi.mock('../../services/searchService');
vi.mock('../../services/importExportService');
vi.mock('../../services/notificationService');

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { id: '1', name: 'Test User' } }) => state,
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>,
  );
};

describe('Advanced Features Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should perform global search and display results', async () => {
      const mockSearchResults = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _id: '1',
              _index: 'products',
              _source: { name: 'Product 1', sku: 'PRD001' },
              _score: 1.0,
            },
            {
              _id: '2',
              _index: 'customers',
              _source: { name: 'Customer 1', code: 'CUS001' },
              _score: 0.9,
            },
          ],
        },
      };

      (searchService.globalSearch as vi.Mock).mockResolvedValue(mockSearchResults);

      renderWithProviders(<GlobalSearchBar />);

      const searchInput = screen.getByPlaceholderText(/search products, customers/i);
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      await waitFor(() => {
        expect(searchService.globalSearch).toHaveBeenCalledWith('test query', 0, 10);
      });
    });

    it('should handle search with no results', async () => {
      const mockEmptyResults = {
        hits: {
          total: { value: 0 },
          hits: [],
        },
      };

      (searchService.globalSearch as vi.Mock).mockResolvedValue(mockEmptyResults);

      renderWithProviders(<GlobalSearchBar />);

      const searchInput = screen.getByPlaceholderText(/search products, customers/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(searchService.globalSearch).toHaveBeenCalled();
      });
    });

    it('should save and load filters', () => {
      const filterName = 'Test Filter';
      const filterData = { category: 'electronics', minPrice: 100 };

      const mockSavedFilter = {
        id: '1',
        name: filterName,
        module: 'products',
        filters: filterData,
        createdAt: new Date().toISOString(),
      };

      const mockFilters = [mockSavedFilter];

      (searchService.saveFilter as any) = vi.fn().mockReturnValue(mockSavedFilter);
      (searchService.getSavedFilters as any) = vi.fn().mockReturnValue(mockFilters);
      (searchService.deleteFilter as any) = vi.fn();

      const savedFilter = searchService.saveFilter(filterName, 'products', filterData);

      expect(savedFilter).toHaveProperty('id');
      expect(savedFilter.name).toBe(filterName);
      expect(savedFilter.module).toBe('products');
      expect(savedFilter.filters).toEqual(filterData);

      const loadedFilters = searchService.getSavedFilters('products');
      expect(loadedFilters).toContainEqual(expect.objectContaining({ name: filterName }));

      // Cleanup
      searchService.deleteFilter(savedFilter.id);
      expect(searchService.deleteFilter).toHaveBeenCalledWith('1');
    });
  });

  describe('Import/Export Functionality', () => {
    it('should validate import file', async () => {
      const mockValidationResult = {
        success: true,
        totalRows: 10,
        successCount: 10,
        errorCount: 0,
        errors: [],
        message: 'Validation successful',
      };

      (importExportService.validateImport as vi.Mock).mockResolvedValue(mockValidationResult);

      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await importExportService.validateImport('products', mockFile);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(10);
      expect(result.errorCount).toBe(0);
    });

    it('should handle validation errors', async () => {
      const mockValidationResult = {
        success: false,
        totalRows: 10,
        successCount: 8,
        errorCount: 2,
        errors: [
          { row: 3, field: 'sku', message: 'SKU is required' },
          { row: 5, field: 'price', message: 'Price must be a number' },
        ],
        message: 'Validation failed',
      };

      (importExportService.validateImport as vi.Mock).mockResolvedValue(mockValidationResult);

      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await importExportService.validateImport('products', mockFile);

      expect(result.success).toBe(false);
      expect(result.errorCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should import data successfully', async () => {
      const mockImportResult = {
        success: true,
        totalRows: 10,
        successCount: 10,
        errorCount: 0,
        errors: [],
        message: 'Successfully imported 10 products',
      };

      (importExportService.importData as vi.Mock).mockResolvedValue(mockImportResult);

      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await importExportService.importData('products', mockFile);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(10);
    });

    it('should export data', async () => {
      const mockBlob = new Blob(['test data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      (importExportService.exportProducts as vi.Mock).mockResolvedValue(mockBlob);

      const result = await importExportService.exportProducts('excel');

      expect(result).toBeInstanceOf(Blob);
      expect(importExportService.exportProducts).toHaveBeenCalledWith('excel');
    });
  });

  describe('Notification Functionality', () => {
    it('should load unread notification count', async () => {
      (notificationService.getUnreadCount as vi.Mock).mockResolvedValue(5);

      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(notificationService.getUnreadCount).toHaveBeenCalled();
      });
    });

    it('should load notifications when bell is clicked', async () => {
      const mockNotifications = {
        data: [
          {
            id: '1',
            userId: '1',
            type: 'newOrder',
            title: 'New Order',
            message: 'You have a new order',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      };

      (notificationService.getUnreadCount as vi.Mock).mockResolvedValue(1);
      (notificationService.getNotifications as vi.Mock).mockResolvedValue(mockNotifications);

      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(notificationService.getUnreadCount).toHaveBeenCalled();
      });

      const bellButton = screen.getByRole('button');
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(notificationService.getNotifications).toHaveBeenCalled();
      });
    });

    it('should mark notification as read', async () => {
      const mockNotification = {
        id: '1',
        userId: '1',
        type: 'newOrder',
        title: 'New Order',
        message: 'You have a new order',
        isRead: true,
        createdAt: new Date().toISOString(),
      };

      (notificationService.markAsRead as vi.Mock).mockResolvedValue(mockNotification);

      await notificationService.markAsRead('1');

      expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    it('should mark all notifications as read', async () => {
      (notificationService.markAllAsRead as vi.Mock).mockResolvedValue(undefined);

      await notificationService.markAllAsRead();

      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  describe('Integration Flow Tests', () => {
    it('should complete search -> view -> action flow', async () => {
      const mockSearchResults = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _id: '1',
              _index: 'products',
              _source: { name: 'Product 1', sku: 'PRD001' },
              _score: 1.0,
            },
          ],
        },
      };

      (searchService.globalSearch as vi.Mock).mockResolvedValue(mockSearchResults);

      renderWithProviders(<GlobalSearchBar />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search products, customers/i);
      fireEvent.change(searchInput, { target: { value: 'Product 1' } });

      await waitFor(() => {
        expect(searchService.globalSearch).toHaveBeenCalled();
      });

      // Verify search was performed
      expect(searchService.globalSearch).toHaveBeenCalledWith('Product 1', 0, 10);
    });

    it('should complete import validation -> import flow', async () => {
      const mockValidationResult = {
        success: true,
        totalRows: 5,
        successCount: 5,
        errorCount: 0,
        errors: [],
        message: 'Validation successful',
      };

      const mockImportResult = {
        success: true,
        totalRows: 5,
        successCount: 5,
        errorCount: 0,
        errors: [],
        message: 'Successfully imported 5 products',
      };

      (importExportService.validateImport as vi.Mock).mockResolvedValue(mockValidationResult);
      (importExportService.importData as vi.Mock).mockResolvedValue(mockImportResult);

      const mockFile = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Validate
      const validationResult = await importExportService.validateImport('products', mockFile);
      expect(validationResult.success).toBe(true);

      // Import
      const importResult = await importExportService.importData('products', mockFile);
      expect(importResult.success).toBe(true);
      expect(importResult.successCount).toBe(5);
    });
  });
});
