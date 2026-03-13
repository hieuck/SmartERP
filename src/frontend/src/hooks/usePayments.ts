import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import paymentService from '../services/payment-gateway/paymentGatewayService';

interface PaymentFilters {
  search?: string;
  status?: string;
}

/**
 * Hook for fetching payments list
 * @param filters - Payment filters
 * @returns Query result with payments data
 */
export const usePayments = (filters: PaymentFilters): UseQueryResult<any[], Error> => {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const data = await paymentService.getPayments(filters);
      return data;
    },
  });
};

/**
 * Hook for deleting a payment
 * @returns Mutation for deleting payment
 */
export const useDeletePayment = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await paymentService.delete(id);
    },
    onSuccess: () => {
      // Invalidate payments query
      queryClient.invalidateQueries({
        queryKey: ['payments'],
      });
    },
  });
};

/**
 * Hook for completing a payment
 * @returns Mutation for completing payment
 */
export const useCompletePayment = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await paymentService.complete(id);
    },
    onSuccess: () => {
      // Invalidate payments query
      queryClient.invalidateQueries({
        queryKey: ['payments'],
      });
    },
  });
};

/**
 * Hook for processing refund
 * @returns Mutation for processing refund
 */
export const useProcessRefund = (): UseMutationResult<
  void,
  Error,
  { id: string; amount: number; reason: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount, reason }) => {
      return await paymentService.refund(id, { amount, reason });
    },
    onSuccess: () => {
      // Invalidate payments query
      queryClient.invalidateQueries({
        queryKey: ['payments'],
      });
    },
  });
};
