import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  CreateSettingDto,
  settingsService,
  Setting,
  SettingCategory,
  UpdateSettingDto,
} from '@/services/utils/settingsService';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for fetching settings by category
 * @param category - Settings category
 * @returns Query result with settings data
 */
export const useSettingsByCategory = (
  category: SettingCategory,
): UseQueryResult<Setting[], Error> => {
  return useQuery({
    queryKey: ['settings', category],
    queryFn: async () => {
      const data = await settingsService.getByCategory(category);
      return data;
    },
    enabled: !!category,
  });
};

/**
 * Hook for creating a new setting
 * @returns Mutation for creating setting
 */
export const useCreateSetting = (): UseMutationResult<Setting, Error, CreateSettingDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSettingDto) => {
      return await settingsService.create(data);
    },
    onSuccess: (data) => {
      // Invalidate the settings query for the category
      queryClient.invalidateQueries({
        queryKey: ['settings', data.category],
      });
    },
  });
};

/**
 * Hook for updating a setting
 * @returns Mutation for updating setting
 */
export const useUpdateSetting = (): UseMutationResult<
  Setting,
  Error,
  { key: string; data: UpdateSettingDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, data }) => {
      return await settingsService.update(key, data);
    },
    onSuccess: (data) => {
      // Invalidate the settings query for the category
      queryClient.invalidateQueries({
        queryKey: ['settings', data.category],
      });
    },
  });
};

/**
 * Hook for deleting a setting
 * @returns Mutation for deleting setting
 */
export const useDeleteSetting = (): UseMutationResult<
  void,
  Error,
  { key: string; category: SettingCategory }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key }) => {
      return await settingsService.delete(key);
    },
    onSuccess: (_, { category }) => {
      // Invalidate the settings query for the category
      queryClient.invalidateQueries({
        queryKey: ['settings', category],
      });
    },
  });
};
