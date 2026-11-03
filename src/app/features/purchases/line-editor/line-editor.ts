import { Component, computed, input, model } from '@angular/core';
import { linesTotal } from '../../../core/utils/purchasing';
import { Supply } from '../../../entities';
import { CopPipe } from '../../../shared/pipes/format.pipes';

export interface EditableLine {
  supplyId: string;
  quantity: number | null;
  /** Solo en órdenes de compra; las solicitudes de cotización no llevan precio. */
  unitPrice: number | null;
}

export const emptyLine = (): EditableLine => ({ supplyId: '', quantity: null, unitPrice: null });

/** Mensaje del primer problema de las líneas, o null si se pueden enviar. */
export function linesProblem(lines: EditableLine[], withPrice: boolean): string | null {
  if (lines.length === 0) return 'Agrega al menos un insumo.';
  if (lines.some((l) => !l.supplyId)) return 'Elige el insumo de cada línea.';
  const ids = lines.map((l) => l.supplyId);
  if (new Set(ids).size !== ids.length)
    return 'Un insumo aparece dos veces: junta las cantidades en una sola línea.';
  if (lines.some((l) => !l.quantity || l.quantity <= 0))
    return 'La cantidad debe ser mayor que cero.';
  if (withPrice && lines.some((l) => !l.unitPrice || l.unitPrice <= 0))
    return 'Monto inválido: debe ser mayor que cero.';
  return null;
}

/** Tabla editable de insumos: la usan la orden de compra (con precio) y la solicitud de cotización (sin precio). */
@Component({
  selector: 'app-line-editor',
  imports: [CopPipe],
  template: `
    <table class="lines">
      <thead>
        <tr>
          <th>Insumo</th>
          <th style="width: 130px">Cantidad</th>
          @if (withPrice()) {
            <th style="width: 160px">Precio unitario</th>
            <th class="num" style="width: 140px">Subtotal</th>
          }
          <th style="width: 40px"><span class="sr-only">Quitar</span></th>
        </tr>
      </thead>
      <tbody>
        @for (line of lines(); track $index; let i = $index) {
          <tr>
            <td>
              <select
                class="select"
                [value]="line.supplyId"
                (change)="patch(i, { supplyId: $any($event.target).value })"
                [attr.aria-label]="'Insumo de la línea ' + (i + 1)"
              >
                <option value="">Elige el insumo…</option>
                @for (s of supplies(); track s.id) {
                  <option [value]="s.id">{{ s.name }} ({{ s.unitLabel }})</option>
                }
              </select>
            </td>
            <td>
              <input
                class="input"
                type="number"
                step="0.01"
                [value]="line.quantity ?? ''"
                (input)="patch(i, { quantity: toNumber($event) })"
                [attr.aria-label]="'Cantidad de la línea ' + (i + 1)"
              />
            </td>
            @if (withPrice()) {
              <td>
                <input
                  class="input"
                  type="number"
                  step="100"
                  [value]="line.unitPrice ?? ''"
                  (input)="patch(i, { unitPrice: toNumber($event) })"
                  [attr.aria-label]="'Precio de la línea ' + (i + 1)"
                />
              </td>
              <td class="num">{{ (line.quantity ?? 0) * (line.unitPrice ?? 0) | cop }}</td>
            }
            <td>
              <button
                type="button"
                class="btn btn--link-danger"
                (click)="remove(i)"
                [disabled]="lines().length === 1"
                [attr.aria-label]="'Quitar la línea ' + (i + 1)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
    <button type="button" class="btn btn--ghost btn--sm" style="margin-top: 0.5rem" (click)="add()">
      <span class="material-symbols-outlined">add</span> Agregar insumo
    </button>
    @if (withPrice()) {
      <div class="totals">
        <span class="muted">Total de la orden</span><strong>{{ total() | cop }}</strong>
      </div>
    }
  `,
})
export class LineEditor {
  readonly lines = model.required<EditableLine[]>();
  readonly supplies = input<Supply[]>([]);
  readonly withPrice = input(false);

  protected readonly total = computed(() => linesTotal(this.lines()));

  protected toNumber(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    return raw === '' ? null : Number(raw);
  }

  protected patch(index: number, change: Partial<EditableLine>): void {
    this.lines.update((lines) => lines.map((l, i) => (i === index ? { ...l, ...change } : l)));
  }

  protected add(): void {
    this.lines.update((lines) => [...lines, emptyLine()]);
  }

  protected remove(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }
}
