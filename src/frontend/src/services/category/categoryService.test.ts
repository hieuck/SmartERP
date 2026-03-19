import categoryService, {
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from './categoryService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets categories through list and lookup endpoints', async () => {
    const categories = [{ id: 'cat-1', name: 'Electronics', code: 'ELEC' }];
    const category = { id: 'cat-1', name: 'Electronics', code: 'ELEC' };
    const tree = [{ id: 'cat-1', children: [{ id: 'cat-2', name: 'Phones' }] }];
    const root = [{ id: 'cat-1', name: 'Electronics' }];
    const children = [{ id: 'cat-2', name: 'Phones' }];
    mockApiGet.mockResolvedValueOnce({ data: categories });
    mockApiGet.mockResolvedValueOnce({ data: category });
    mockApiGet.mockResolvedValueOnce({ data: category });
    mockApiGet.mockResolvedValueOnce({ data: tree });
    mockApiGet.mockResolvedValueOnce({ data: root });
    mockApiGet.mockResolvedValueOnce({ data: children });
    mockApiGet.mockResolvedValueOnce({ data: 12 });

    const listResult = await categoryService.getAll();
    const byIdResult = await categoryService.getById('cat-1');
    const byCodeResult = await categoryService.getByCode('ELEC');
    const treeResult = await categoryService.getTree();
    const rootResult = await categoryService.getRootCategories();
    const childrenResult = await categoryService.getChildren('cat-1');
    const countResult = await categoryService.getCount();

    expect(api.get).toHaveBeenNthCalledWith(1, '/categories');
    expect(api.get).toHaveBeenNthCalledWith(2, '/categories/cat-1');
    expect(api.get).toHaveBeenNthCalledWith(3, '/categories/code/ELEC');
    expect(api.get).toHaveBeenNthCalledWith(4, '/categories/tree');
    expect(api.get).toHaveBeenNthCalledWith(5, '/categories/root');
    expect(api.get).toHaveBeenNthCalledWith(6, '/categories/cat-1/children');
    expect(api.get).toHaveBeenNthCalledWith(7, '/categories/count');
    expect(listResult).toEqual(categories);
    expect(byIdResult).toEqual(category);
    expect(byCodeResult).toEqual(category);
    expect(treeResult).toEqual(tree);
    expect(rootResult).toEqual(root);
    expect(childrenResult).toEqual(children);
    expect(countResult).toEqual(12);
  });

  it('creates and updates a category', async () => {
    const createPayload: CreateCategoryDto = {
      name: 'Electronics',
      code: 'ELEC',
      description: 'Electronic items',
      sortOrder: 1,
    };
    const updatePayload: UpdateCategoryDto = {
      name: 'Consumer Electronics',
      sortOrder: 2,
    };
    const created = { id: 'cat-1', ...createPayload };
    const updated = { id: 'cat-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });

    const createResult = await categoryService.create(createPayload);
    const updateResult = await categoryService.update('cat-1', updatePayload);

    expect(api.post).toHaveBeenCalledWith('/categories', createPayload);
    expect(api.put).toHaveBeenCalledWith('/categories/cat-1', updatePayload);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('activates, deactivates, reorders, and deletes a category', async () => {
    const activated = { id: 'cat-1', isActive: true };
    const deactivated = { id: 'cat-1', isActive: false };
    const reordered = { id: 'cat-1', sortOrder: 3 };
    mockApiPatch.mockResolvedValueOnce({ data: activated });
    mockApiPatch.mockResolvedValueOnce({ data: deactivated });
    mockApiPatch.mockResolvedValueOnce({ data: reordered });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const activateResult = await categoryService.activate('cat-1');
    const deactivateResult = await categoryService.deactivate('cat-1');
    const reorderResult = await categoryService.reorder('cat-1', 3);
    await categoryService.delete('cat-1');

    expect(api.patch).toHaveBeenNthCalledWith(1, '/categories/cat-1/activate');
    expect(api.patch).toHaveBeenNthCalledWith(2, '/categories/cat-1/deactivate');
    expect(api.patch).toHaveBeenNthCalledWith(3, '/categories/cat-1/reorder', { sortOrder: 3 });
    expect(api.delete).toHaveBeenCalledWith('/categories/cat-1');
    expect(activateResult).toEqual(activated);
    expect(deactivateResult).toEqual(deactivated);
    expect(reorderResult).toEqual(reordered);
  });
});
