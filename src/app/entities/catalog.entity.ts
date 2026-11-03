export type ProductCategory = 'Bakery' | 'Pastry' | 'Drink' | 'Dessert';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number;
  isActive: boolean;
}

/** Contadores del inicio del administrador (pantalla 07.0). */
export interface DashboardSummary {
  activeCustomers: number;
  ordersToday: number;
  lowStockSupplies: number;
  activeSuppliers: number;
  pendingPurchaseOrders: number;
  activeEmployees: number;
}
