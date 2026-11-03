import { RoleCode } from '../entities';

export interface NavItem {
  label: string;
  description: string;
  route: string;
  /** Nombre del ícono de Material Symbols. */
  icon: string;
  roles: RoleCode[];
}

/** Menú lateral. El administrador ve todo; el resto, solo su módulo (pantalla 00.2). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', description: 'Así va toda la panadería', route: '/home', icon: 'home', roles: ['ADMIN'] },
  { label: 'CRM (Clientes)', description: 'Las personas que compran', route: '/customers', icon: 'groups', roles: ['CRM'] },
  { label: 'Facturación y Ventas', description: 'Pedidos, cobro y facturas', route: '/sales', icon: 'point_of_sale', roles: ['SALES', 'CRM'] },
  { label: 'Inventarios', description: 'Los insumos de la bodega', route: '/inventory', icon: 'inventory_2', roles: ['INVENTORY'] },
  { label: 'Proveedores', description: 'Quién nos vende los insumos', route: '/suppliers', icon: 'local_shipping', roles: ['SUPPLIERS'] },
  { label: 'Compras', description: 'Lo que les pedimos a los proveedores', route: '/purchases', icon: 'shopping_cart', roles: ['PURCHASES'] },
  { label: 'Talento Humano', description: 'Empleados y nómina', route: '/hr/employees', icon: 'badge', roles: ['HR'] },
  { label: 'Reportes', description: '¿Cómo va la panadería?', route: '/reports', icon: 'monitoring', roles: ['ADMIN'] },
];

export function navFor(role: RoleCode | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => role === 'ADMIN' || item.roles.includes(role));
}
