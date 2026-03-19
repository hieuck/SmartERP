import productService, {
  ProductStatus,
  type CreateProductDto,
  type UpdateProductDto,
} from './productService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets products with query params and by id', async () => {
    const params = { page: 1, limit: 10, search: 'laptop', status: ProductStatus.ACTIVE };
    const products = { data: [{ id: 'prod-1', sku: 'LAP-01', name: 'Laptop' }], meta: { total: 1 } };
    const product = { id: 'prod-1', sku: 'LAP-01', name: 'Laptop', status: ProductStatus.ACTIVE };
    mockApiGet.mockResolvedValueOnce({ data: products });
    mockApiGet.mockResolvedValueOnce({ data: product });

    const listResult = await productService.getAll(params);
    const singleResult = await productService.getById('prod-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/products', { params });
    expect(api.get).toHaveBeenNthCalledWith(2, '/products/prod-1');
    expect(listResult).toEqual(products);
    expect(singleResult).toEqual(product);
  });

  it('creates, updates, deletes, and updates stock for a product', async () => {
    const createPayload: CreateProductDto = {
      sku: 'LAP-01',
      name: 'Laptop',
      unit: 'pcs',
      purchasePrice: 700,
      salePrice: 1000,
      minStock: 5,
    };
    const updatePayload: UpdateProductDto = {
      name: 'Laptop Pro',
      status: ProductStatus.INACTIVE,
    };
    const created = { id: 'prod-1', ...createPayload };
    const updated = { id: 'prod-1', ...updatePayload };
    const stockUpdated = { id: 'prod-1', stock: 42 };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });
    mockApiPatch.mockResolvedValueOnce({ data: stockUpdated });

    const createResult = await productService.create(createPayload);
    const updateResult = await productService.update('prod-1', updatePayload);
    await productService.delete('prod-1');
    const stockResult = await productService.updateStock('prod-1', 42);

    expect(api.post).toHaveBeenNthCalledWith(1, '/products', createPayload);
    expect(api.put).toHaveBeenCalledWith('/products/prod-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/products/prod-1');
    expect(api.patch).toHaveBeenCalledWith('/products/prod-1/stock', { quantity: 42 });
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
    expect(stockResult).toEqual(stockUpdated);
  });

  it('gets low stock and category endpoints with backward-compatible payload unwrapping', async () => {
    const lowStock = [{ id: 'prod-1', stock: 2 }];
    const categories = [{ id: 'cat-1', name: 'Electronics' }];
    const createdCategory = { id: 'cat-2', name: 'Laptops' };
    const updatedCategory = { id: 'cat-2', name: 'Gaming Laptops' };
    mockApiGet.mockResolvedValueOnce({ data: lowStock });
    mockApiGet.mockResolvedValueOnce({ data: { data: categories } });
    mockApiPost.mockResolvedValueOnce({ data: { data: createdCategory } });
    mockApiPut.mockResolvedValueOnce({ data: { data: updatedCategory } });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const lowStockResult = await productService.getLowStock();
    const categoriesResult = await productService.getCategories();
    const createdCategoryResult = await productService.createCategory({ name: 'Laptops' });
    const updatedCategoryResult = await productService.updateCategory('cat-2', {
      name: 'Gaming Laptops',
    });
    await productService.deleteCategory('cat-2');

    expect(api.get).toHaveBeenNthCalledWith(1, '/products/low-stock');
    expect(api.get).toHaveBeenNthCalledWith(2, '/products/categories');
    expect(api.post).toHaveBeenNthCalledWith(1, '/products/categories', { name: 'Laptops' });
    expect(api.put).toHaveBeenNthCalledWith(1, '/products/categories/cat-2', {
      name: 'Gaming Laptops',
    });
    expect(api.delete).toHaveBeenCalledWith('/products/categories/cat-2');
    expect(lowStockResult).toEqual(lowStock);
    expect(categoriesResult).toEqual(categories);
    expect(createdCategoryResult).toEqual(createdCategory);
    expect(updatedCategoryResult).toEqual(updatedCategory);
  });

  it('supports legacy product methods and image upload', async () => {
    const products = { data: [{ id: 'prod-1', name: 'Laptop' }], meta: { total: 1 } };
    const product = { id: 'prod-1', name: 'Laptop' };
    const created = { id: 'prod-2', name: 'Mouse' };
    const updated = { id: 'prod-1', name: 'Laptop X' };
    const fileUrl = 'https://cdn.example.com/prod-1.png';
    const file = new File(['img'], 'product.png', { type: 'image/png' });
    mockApiGet.mockResolvedValueOnce({ data: products });
    mockApiGet.mockResolvedValueOnce({ data: product });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });
    mockApiPost.mockResolvedValueOnce({ data: { data: { url: fileUrl } } });

    const listResult = await productService.getProducts({ page: 1, limit: 10 });
    const productResult = await productService.getProduct('prod-1');
    const createdResult = await productService.createProduct({
      sku: 'MOU-01',
      name: 'Mouse',
      unit: 'pcs',
      purchasePrice: 10,
      salePrice: 20,
    });
    const updatedResult = await productService.updateProduct('prod-1', { name: 'Laptop X' });
    await productService.deleteProduct('prod-1');
    const uploadResult = await productService.uploadImage('prod-1', file);

    expect(listResult).toEqual(products);
    expect(productResult).toEqual(product);
    expect(createdResult).toEqual(created);
    expect(updatedResult).toEqual(updated);
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/products/prod-1/images',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(uploadResult).toBe(fileUrl);
  });
});
