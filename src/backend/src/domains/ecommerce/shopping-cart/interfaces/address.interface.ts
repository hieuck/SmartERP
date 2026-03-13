/**
 * Address interface for shipping and billing addresses
 */
export interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}
