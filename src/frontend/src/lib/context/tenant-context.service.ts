/**
 * Tenant Context Service
 * Manages tenant information from authenticated user
 */

interface TenantInfo {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
}

interface TokenPayload {
  tenantId: string;
  tenantCode?: string;
  tenantName?: string;
}

class TenantContextService {
  private tenantInfo: TenantInfo | null = null;

  /**
   * Initialize tenant context from auth token
   */
  initialize(token: string) {
    try {
      // Decode JWT token to get tenant info
      const payload = this.decodeToken(token);

      this.tenantInfo = {
        tenantId: payload.tenantId,
        tenantCode: payload.tenantCode || '',
        tenantName: payload.tenantName || '',
      };
    } catch (error) {
      console.error('TenantContextService: Failed to initialize tenant context', error);
      this.tenantInfo = null;
    }
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string {
    if (!this.tenantInfo) {
      // Fallback: try to get from localStorage or sessionStorage (E2E)
      const token = localStorage.getItem('token') || sessionStorage.getItem('e2e_access_token');
      if (token) {
        this.initialize(token);
      }
    }

    if (!this.tenantInfo) {
      throw new Error('Tenant context not initialized. Please login first.');
    }

    return this.tenantInfo.tenantId;
  }

  /**
   * Get tenant info
   */
  getTenantInfo(): TenantInfo | null {
    return this.tenantInfo;
  }

  /**
   * Clear tenant context (on logout)
   */
  clear() {
    this.tenantInfo = null;
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload) as TokenPayload;
    } catch {
      throw new Error('Invalid token format');
    }
  }
}

// Export singleton instance
export const tenantContext = new TenantContextService();
