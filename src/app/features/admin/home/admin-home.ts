import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CatalogService } from '../../../services/catalog.service';
import { SupplyService } from '../../../services/supply.service';
import { QtyPipe } from '../../../shared/pipes/format.pipes';

interface ModuleCard {
  number: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  stat: string | null;
}

/** Pantalla 07.0 · Inicio del administrador: todos los módulos y lo que hay que revisar hoy. */
@Component({
  selector: 'app-admin-home',
  imports: [RouterLink, QtyPipe],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
})
export default class AdminHome {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly supplies = inject(SupplyService);

  protected readonly firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');
  protected readonly summary = rxResource({ stream: () => this.catalog.dashboardSummary() });
  protected readonly lowStock = rxResource({ stream: () => this.supplies.lowStock() });

  protected readonly cards = computed<ModuleCard[]>(() => {
    const s = this.summary.value();
    const plural = (n: number | undefined, one: string, many: string) => (n === undefined ? null : `${n} ${n === 1 ? one : many}`);
    return [
      { number: '01', title: 'CRM (Clientes)', description: 'Las personas que compran', route: '/customers', icon: 'groups', stat: plural(s?.activeCustomers, 'cliente', 'clientes') },
      { number: '02', title: 'Facturación y Ventas', description: 'Pedidos, cobro y facturas', route: '/sales', icon: 'point_of_sale', stat: plural(s?.ordersToday, 'pedido hoy', 'pedidos hoy') },
      { number: '03', title: 'Inventarios', description: 'Los insumos de la bodega', route: '/inventory', icon: 'inventory_2', stat: plural(s?.lowStockSupplies, 'por acabarse', 'por acabarse') },
      { number: '04', title: 'Proveedores', description: 'Quién nos vende los insumos', route: '/suppliers', icon: 'local_shipping', stat: plural(s?.activeSuppliers, 'proveedor', 'proveedores') },
      { number: '05', title: 'Compras', description: 'Lo que les pedimos a los proveedores', route: '/purchases', icon: 'shopping_cart', stat: plural(s?.pendingPurchaseOrders, 'pedido por llegar', 'pedidos por llegar') },
      { number: '06', title: 'Talento Humano', description: 'Empleados y nómina', route: '/hr/employees', icon: 'badge', stat: plural(s?.activeEmployees, 'empleado activo', 'empleados activos') },
      { number: '★', title: 'Reportes', description: '¿Cómo va la panadería?', route: '/reports', icon: 'monitoring', stat: 'Ver reportes' },
    ];
  });
}
