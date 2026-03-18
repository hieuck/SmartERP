import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import paymentService, {
  TransactionQueryParams,
  Transaction,
  RefundPaymentDto,
} from '@/services/payment-gateway/paymentGatewayService';

/**
 * Hook để lấy danh sách transactions
 * @param params - Query params lọc transactions
 */
export const usePayments = (
  params?: TransactionQueryParams,
): UseQueryResult<Transaction[], Error> => {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentService.listTransactions(params),
  });
};

/**
 * Hook để xử lý refund payment
 * @returns Mutation cho refund
 */
export const useProcessRefund = (): UseMutationResult<void, Error, RefundPaymentDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RefundPaymentDto) => {
      await paymentService.refundPayment(data);
    },
    onSuccess: () => {
      // Invalidate danh sách payments sau khi refund thành công
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
