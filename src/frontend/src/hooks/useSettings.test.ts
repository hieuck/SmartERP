import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateSetting,
  useDeleteSetting,
  useSettingsByCategory,
  useUpdateSetting,
} from './useSettings';

const {
  useMutationMock,
  useQueryClientMock,
  useQueryMock,
  invalidateQueriesMock,
  settingsServiceMock,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  settingsServiceMock: {
    create: vi.fn(),
    delete: vi.fn(),
    getByCategory: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('@/services/utils/settingsService', () => ({
  settingsService: settingsServiceMock,
}));

describe('useSettings hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({
      invalidateQueries: invalidateQueriesMock,
    });
    useQueryMock.mockImplementation((options: unknown) => options);
    useMutationMock.mockImplementation((options: {
      mutationFn: (vars: unknown) => Promise<unknown>;
      onSuccess?: (data: unknown, variables: unknown) => void;
    }) => ({
      mutateAsync: async (variables: unknown) => {
        const data = await options.mutationFn(variables);
        options.onSuccess?.(data, variables);
        return data;
      },
    }));
  });

  it('configures the category query with the expected key and enabled flag', async () => {
    const category = 'general';
    settingsServiceMock.getByCategory.mockResolvedValue([{ key: 'theme' }]);

    const { result } = renderHook(() => useSettingsByCategory(category as never));
    const query = result.current as { queryKey: unknown[]; enabled: boolean; queryFn: () => Promise<unknown> };

    expect(query.queryKey).toEqual(['settings', category]);
    expect(query.enabled).toBe(true);
    await expect(query.queryFn()).resolves.toEqual([{ key: 'theme' }]);
    expect(settingsServiceMock.getByCategory).toHaveBeenCalledWith(category);
  });

  it('invalidates the matching category after create and update', async () => {
    settingsServiceMock.create.mockResolvedValue({ key: 'theme', category: 'general' });
    settingsServiceMock.update.mockResolvedValue({ key: 'theme', category: 'general' });

    const { result: createResult } = renderHook(() => useCreateSetting());
    const { result: updateResult } = renderHook(() => useUpdateSetting());

    await createResult.current.mutateAsync({ key: 'theme' });
    await updateResult.current.mutateAsync({ key: 'theme', data: { value: 'dark' } });

    expect(settingsServiceMock.create).toHaveBeenCalledWith({ key: 'theme' });
    expect(settingsServiceMock.update).toHaveBeenCalledWith('theme', { value: 'dark' });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['settings', 'general'],
    });
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2);
  });

  it('invalidates the supplied category after delete', async () => {
    settingsServiceMock.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSetting());

    await result.current.mutateAsync({ key: 'theme', category: 'general' });

    expect(settingsServiceMock.delete).toHaveBeenCalledWith('theme');
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['settings', 'general'],
    });
  });
});
