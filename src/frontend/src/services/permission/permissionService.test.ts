import permissionService, {
  type CreatePermissionDto,
  type UpdatePermissionDto,
} from './permissionService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('permissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets permissions through list and lookup endpoints', async () => {
    const permissions = [{ id: 'perm-1', name: 'View Users', resource: 'users', action: 'read' }];
    const permission = permissions[0];
    const resourcePermissions = permissions;
    mockApiGet.mockResolvedValueOnce({ data: permissions });
    mockApiGet.mockResolvedValueOnce({ data: permission });
    mockApiGet.mockResolvedValueOnce({ data: resourcePermissions });
    mockApiGet.mockResolvedValueOnce({ data: 42 });

    const listResult = await permissionService.getAll();
    const byIdResult = await permissionService.getById('perm-1');
    const byResourceResult = await permissionService.getByResource('users');
    const countResult = await permissionService.getCount();

    expect(api.get).toHaveBeenNthCalledWith(1, '/permissions');
    expect(api.get).toHaveBeenNthCalledWith(2, '/permissions/perm-1');
    expect(api.get).toHaveBeenNthCalledWith(3, '/permissions/resource/users');
    expect(api.get).toHaveBeenNthCalledWith(4, '/permissions/count');
    expect(listResult).toEqual(permissions);
    expect(byIdResult).toEqual(permission);
    expect(byResourceResult).toEqual(resourcePermissions);
    expect(countResult).toEqual(42);
  });

  it('creates, updates, and deletes a permission', async () => {
    const createPayload: CreatePermissionDto = {
      name: 'Edit Users',
      resource: 'users',
      action: 'update',
      description: 'Allows updating users',
    };
    const updatePayload: UpdatePermissionDto = {
      name: 'Manage Users',
      description: 'Allows full user management',
    };
    const created = { id: 'perm-2', ...createPayload };
    const updated = { id: 'perm-2', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const createResult = await permissionService.create(createPayload);
    const updateResult = await permissionService.update('perm-2', updatePayload);
    await permissionService.delete('perm-2');

    expect(api.post).toHaveBeenCalledWith('/permissions', createPayload);
    expect(api.put).toHaveBeenCalledWith('/permissions/perm-2', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/permissions/perm-2');
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });
});
