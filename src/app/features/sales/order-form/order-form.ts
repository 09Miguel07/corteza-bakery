import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import {
  addToCart,
  CartLine,
  cartTotal,
  PRODUCT_CATEGORY,
  setQuantity,
} from '../../../core/utils/sales';
import { Product, ProductCategory, ServiceType } from '../../../entities';
import { CatalogService } from '../../../services/catalog.service';
import { CustomerService } from '../../../services/customer.service';
import { OrderService } from '../../../services/order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';

/** Pantalla 02.2 · Nuevo pedido: productos, mesa o para llevar y cliente (opcional). */
@Component({
  selector: 'app-order-form',
  imports: [RouterLink, CopPipe],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export default class OrderForm {
  private readonly orders = inject(OrderService);
  private readonly catalog = inject(CatalogService);
  private readonly customerApi = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** ?tableId=4 desde el tablero de mesas. */
  readonly tableId = input<string>();

  protected readonly products = rxResource({ stream: () => this.catalog.products() });
  protected readonly tables = rxResource({ stream: () => this.orders.tables() });
  protected readonly customers = rxResource({
    stream: () => this.customerApi.list({ active: true, pageSize: 100 }),
  });

  protected readonly categoryLabel = PRODUCT_CATEGORY;
  protected readonly categories = computed(() => {
    const groups = new Map<ProductCategory, Product[]>();
    for (const p of this.products.value() ?? [])
      groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
    return [...groups.entries()].map(([category, items]) => ({ category, items }));
  });

  protected readonly serviceType = linkedSignal<ServiceType>(() =>
    this.tableId() ? 'DineIn' : 'Takeaway',
  );
  protected readonly selectedTable = linkedSignal(() => this.tableId() ?? '');
  protected readonly freeTables = computed(() =>
    (this.tables.value() ?? []).filter((t) => t.state === 'Free'),
  );
  protected readonly customerId = signal('');
  protected readonly cart = signal<CartLine[]>([]);
  protected readonly total = computed(() => cartTotal(this.cart()));
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected add(product: Product): void {
    this.cart.update((c) => addToCart(c, product));
  }

  protected change(line: CartLine, delta: number): void {
    this.cart.update((c) => setQuantity(c, line.productId, line.quantity + delta));
  }

  protected pickTable(event: Event): void {
    this.selectedTable.set((event.target as HTMLSelectElement).value);
  }

  protected pickCustomer(event: Event): void {
    this.customerId.set((event.target as HTMLSelectElement).value);
  }

  protected async save(): Promise<void> {
    const dineIn = this.serviceType() === 'DineIn';
    const problem =
      this.cart().length === 0
        ? 'Agrega al menos un producto al pedido.'
        : dineIn && !this.selectedTable()
          ? 'Elige la mesa del pedido.'
          : null;
    this.error.set(problem);
    if (problem) return;

    this.saving.set(true);
    try {
      const order = await firstValueFrom(
        this.orders.create({
          serviceType: this.serviceType(),
          diningTableId: dineIn ? Number(this.selectedTable()) : null,
          customerId: this.customerId() ? Number(this.customerId()) : null,
          items: this.cart().map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      );
      this.toast.success(`Pedido ${order.code} enviado a cocina.`);
      await this.router.navigate(['/sales', order.id]);
    } catch (error) {
      this.error.set(problemMessage(error)); // "La mesa 4 ya tiene un pedido abierto."
      this.tables.reload();
    } finally {
      this.saving.set(false);
    }
  }
}
