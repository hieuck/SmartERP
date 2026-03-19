import userService, { type CreateUserDto, type UpdateUserDto } from './userService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all users', async () => {
    const users = [{ id: 'user-1', username: 'alice', email: 'alice@example.com' }];
    mockApiGet.mockResolvedValue({ data: users });

    const result = await userService.getUsers();

    expect(api.get).toHaveBeenCalledWith('/users');
    expect(result).toEqual(users);
  });

  it('gets a user by id', async () => {
    const user = { id: 'user-1', username: 'alice', email: 'alice@example.com' };
    mockApiGet.mockResolvedValue({ data: user });

    const result = await userService.getUser('user-1');

    expect(api.get).toHaveBeenCalledWith('/users/user-1');
    expect(result).toEqual(user);
  });

  it('creates a user through auth register endpoint', async () => {
    const payload: CreateUserDto = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Nguyen',
      roleIds: ['role-admin'],
    };
    const created = { id: 'user-1', ...payload };
    mockApiPost.mockResolvedValue({ data: created });

    const result = await userService.createUser(payload);

    expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(created);
  });

  it('updates and deletes a user', async () => {
    const payload: UpdateUserDto = {
      firstName: 'Alicia',
      status: 'inactive',
    };
    const updated = { id: 'user-1', ...payload };
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const updatedResult = await userService.updateUser('user-1', payload);
    await userService.deleteUser('user-1');

    expect(api.put).toHaveBeenNthCalledWith(1, '/users/user-1', payload);
    expect(api.delete).toHaveBeenCalledWith('/users/user-1');
    expect(updatedResult).toEqual(updated);
  });

  it('assigns roles to a user', async () => {
    const updated = { id: 'user-1', roles: [{ id: 'role-admin', name: 'Admin' }] };
    mockApiPut.mockResolvedValue({ data: updated });

    const result = await userService.assignRoles('user-1', ['role-admin']);

    expect(api.put).toHaveBeenCalledWith('/users/user-1/roles', { roleIds: ['role-admin'] });
    expect(result).toEqual(updated);
  });

  it('changes password through reset password endpoint', async () => {
    mockApiPost.mockResolvedValue({ data: undefined });

    await userService.changePassword('user-1', 'NewPassword123!');

    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
      userId: 'user-1',
      newPassword: 'NewPassword123!',
    });
  });

  it('gets roles and role by id', async () => {
    const roles = [{ id: 'role-admin', name: 'Admin' }];
    const role = { id: 'role-admin', name: 'Admin', description: 'Full access' };
    mockApiGet.mockResolvedValueOnce({ data: roles });
    mockApiGet.mockResolvedValueOnce({ data: role });

    const rolesResult = await userService.getRoles();
    const roleResult = await userService.getRole('role-admin');

    expect(api.get).toHaveBeenNthCalledWith(1, '/roles');
    expect(api.get).toHaveBeenNthCalledWith(2, '/roles/role-admin');
    expect(rolesResult).toEqual(roles);
    expect(roleResult).toEqual(role);
  });
});
