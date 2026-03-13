/**
 * System Health Response Interface
 */
export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pendingJobs: number;
  failedJobs: number;
  unresolvedErrors: number;
  timestamp: Date;
}
