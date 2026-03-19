import roleService, {
  type CreateRoleDto,
  type UpdateRoleDto,
} from './roleService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets roles through list and lookup endpoints', async () => {
    const roles = [{ id: 'role-1', name: 'Admin', isSystem: true }];
    const role = roles[0];
    mockApiGet.mockResolvedValueOnce({ data: roles });
    mockApiGet.mockResolvedValueOnce({ data: role });
    mockApiGet.mockResolvedValueOnce({ data: role });
    mockApiGet.mockResolvedValueOnce({ data: 7 });

    const listResult = await roleService.getAll();
    const byIdResult = await roleService.getById('role-1');
    const byNameResult = await roleService.getByName('Admin');
    const countResult = await roleService.getCount();

    expect(api.get).toHaveBeenNthCalledWith(1, '/roles');
    expect(api.get).toHaveBeenNthCalledWith(2, '/roles/role-1');
    expect(api.get).toHaveBeenNthCalledWith(3, '/roles/name/Admin');
    expect(api.get).toHaveBeenNthCalledWith(4, '/roles/count');
    expect(listResult).toEqual(roles);
    expect(byIdResult).toEqual(role);
    expect(byNameResult).toEqual(role);
    expect(countResult).toEqual(7);
  });

  it('creates and updates a role', async () => {
    const createPayload: CreateRoleDto = {
      name: 'Manager',
      description: 'Manager role',
      permissionIds: ['perm-1', 'perm-2'],
    };
    const updatePayload: UpdateRoleDto = {
      description: 'Updated manager role',
      permissionIds: ['perm-1'],
    };
    const created = { id: 'role-2', ...createPayload };
    const updated = { id: 'role-2', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });

    const createResult = await roleService.create(createPayload);
    const updateResult = await roleService.update('role-2', updatePayload);

    expect(api.post).toHaveBeenCalledWith('/roles', createPayload);
    expect(api.put).toHaveBeenCalledWith('/roles/role-2', updatePayload);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('adds, removes permissions, and deletes a role', async () => {
    const withAdded = { id: 'role-1', permissionIds: ['perm-1', 'perm-2'] };
    const withRemoved = { id: 'role-1', permissionIds: ['perm-1'] };
    mockApiPatch.mockResolvedValueOnce({ data: withAdded });
    mockApiPatch.mockResolvedValueOnce({ data: withRemoved });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const addResult = await roleService.addPermissions('role-1', ['perm-1', 'perm-2']);
    const removeResult = await roleService.removePermissions('role-1', ['perm-2']);
    await roleService.delete('role-1');

    expect(api.patch).toHaveBeenNthCalledWith(1, '/roles/role-1/permissions/add', {
      permissionIds: ['perm-1', 'perm-2'],
    });
    expect(api.patch).toHaveBeenNthCalledWith(2, '/roles/role-1/permissions/remove', {
      permissionIds: ['perm-2'],
    });
    expect(api.delete).toHaveBeenCalledWith('/roles/role-1');
    expect(addResult).toEqual(withAdded);
    expect(removeResult).toEqual(withRemoved);
  });
});
