import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import {
  invalidPriceMessage,
  QUOTATION_STATUS,
  quotationTotal,
  RFQ_STATUS,
} from '../../../core/utils/purchasing';
import { Quotation, RfqDetail } from '../../../entities';
import { QuotationRequestService } from '../../../services/quotation-request.service';
import { SupplierService } from '../../../services/supplier.service';
import { CopPipe, QtyPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Detalle de la solicitud: registrar cotizaciones de cada proveedor y elegir la ganadora (crea la OC). */
@Component({
  selector: 'app-quotation-request-detail',
  imports: [RouterLink, StatusBadge, CopPipe, QtyPipe],
  templateUrl: './quotation-request-detail.html',
})
export default class QuotationRequestDetail {
  private readonly requests = inject(QuotationRequestService);
  private readonly supplierApi = inject(SupplierService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly rfq = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.requests.get(params),
  });
  protected readonly suppliers = rxResource({
    stream: () => this.supplierApi.list({ active: true, pageSize: 100 }),
  });

  protected readonly rfqStatus = RFQ_STATUS;
  protected readonly quotationStatus = QUOTATION_STATUS;
  protected readonly isOpen = computed(() => this.rfq.value()?.status === 'Open');

  /** Proveedores que todavía no han cotizado esta solicitud. */
  protected readonly pendingSuppliers = computed(() => {
    const quoted = new Set(this.rfq.value()?.quotations.map((q) => q.supplierId));
    return (this.suppliers.value()?.items ?? []).filter((s) => !quoted.has(s.id));
  });

  // Formulario "Registrar cotización": se reinicia cuando cambia la solicitud.
  protected readonly supplierId = linkedSignal(() => (this.rfq.value(), ''));
  protected readonly deliveryDays = linkedSignal<number | null>(() => (this.rfq.value(), 2));
  protected readonly prices = linkedSignal<Record<number, number | null>>(() =>
    Object.fromEntries((this.rfq.value()?.items ?? []).map((i) => [i.supplyId, null])),
  );
  protected readonly total = computed(() =>
    quotationTotal(this.rfq.value()?.items ?? [], this.prices()),
  );

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected setPrice(supplyId: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.prices.update((p) => ({ ...p, [supplyId]: raw === '' ? null : Number(raw) }));
  }

  protected setSupplier(event: Event): void {
    this.supplierId.set((event.target as HTMLSelectElement).value);
  }

  protected setDeliveryDays(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.deliveryDays.set(raw === '' ? null : Number(raw));
  }

  protected async register(rfq: RfqDetail, event: Event): Promise<void> {
    event.preventDefault();
    const problem = !this.supplierId()
      ? 'Elige el proveedor que cotizó.'
      : this.deliveryDays() == null || this.deliveryDays()! < 0
        ? 'Escribe en cuántos días entrega.'
        : invalidPriceMessage(this.prices());
    if (problem) {
      this.error.set(problem);
      return;
    }

    await this.run(async () => {
      const updated = await firstValueFrom(
        this.requests.registerQuotation(rfq.id, {
          supplierId: Number(this.supplierId()),
          deliveryDays: this.deliveryDays()!,
          notes: null,
          prices: rfq.items.map((i) => ({
            supplyId: i.supplyId,
            unitPrice: this.prices()[i.supplyId]!,
          })),
        }),
      );
      this.rfq.set(updated);
      this.toast.success('Cotización registrada.');
    });
  }

  protected async select(rfq: RfqDetail, q: Quotation): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Elegir la cotización de ${q.supplierName}?`,
      message:
        'Se cierra la solicitud, se rechazan las demás cotizaciones y se crea una orden de compra pendiente.',
      detail: `Total: ${new CopPipe().transform(q.total)} · entrega en ${q.deliveryDays} días`,
      confirmText: 'Sí, elegir',
      tone: 'primary',
    });
    if (!ok) return;

    await this.run(async () => {
      const result = await firstValueFrom(this.requests.select(rfq.id, q.id, null));
      this.toast.success(`Orden ${result.purchaseOrderCode} creada. Falta aprobarla.`);
      await this.router.navigate(['/purchases/orders', result.purchaseOrderId]);
    });
  }

  protected async cancel(rfq: RfqDetail): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Cancelar la solicitud ${rfq.code}?`,
      message: 'Ya no se podrán registrar ni elegir cotizaciones.',
      confirmText: 'Sí, cancelar',
    });
    if (!ok) return;

    await this.run(async () => {
      await firstValueFrom(this.requests.cancel(rfq.id));
      this.rfq.reload();
      this.toast.success('Solicitud cancelada.');
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      // 422 "Monto inválido", "ya registró una cotización"…: el mensaje del dominio tal cual.
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
