/**
 * JWT Token Payload Interface
 * Represents the decoded JWT token structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  tenantId: string;
  roles?: string[];
  iat?: number; // Issued at
  exp?: number; // Expiration time
  [key: string]: unknown; // Allow additional custom claims
}
