export type SearchRouteSource = Record<string, unknown>;

function getOrderRoute(orderType: unknown, id: string): string {
  if (orderType === 'sales') {
    return `/dashboard/orders/sales/${id}`;
  }

  if (orderType === 'purchase') {
    return `/dashboard/orders/purchase/${id}`;
  }

  return '';
}

export function buildSearchRoute(type: string, id: string, source?: SearchRouteSource): string {
  switch (type) {
    case 'products':
      return `/dashboard/products/${id}`;
    case 'customers':
      return `/dashboard/customers/${id}`;
    case 'suppliers':
      return `/dashboard/suppliers/${id}`;
    case 'orders':
      return getOrderRoute(source?.type, id);
    default:
      return '';
  }
}

export function buildSearchResultsRoute(query: string): string {
  return `/dashboard/search?q=${encodeURIComponent(query)}`;
}
