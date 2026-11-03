import { Pipe, PipeTransform } from '@angular/core';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** 1250000 → "$ 1.250.000" */
@Pipe({ name: 'cop' })
export class CopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '—' : cop.format(value);
  }
}

/** 1250.5 → "1.250,5" */
@Pipe({ name: 'qty' })
export class QtyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '—' : qty.format(value);
  }
}

/** "1020456789" → "1.020.456.789" · "900123456-7" → "900.123.456-7" */
@Pipe({ name: 'document' })
export class DocumentPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const [main, dv] = value.split('-');
    if (!/^\d+$/.test(main)) return value;
    const grouped = main.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return dv ? `${grouped}-${dv}` : grouped;
  }
}

/** "3124589012" → "312 458 9012" · "+573124589012" → "+57 312 458 9012" */
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\+57)?(\d{3})(\d{3})(\d{4})$/.exec(value);
    if (!match) return value;
    const [, prefix, a, b, c] = match;
    return `${prefix ? prefix + ' ' : ''}${a} ${b} ${c}`;
  }
}

/** "María Fernanda López" → "ML" (primera letra del primer nombre y del primer apellido). */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(firstNames: string | null | undefined, lastNames?: string | null): string {
    const first = (firstNames ?? '').trim().charAt(0);
    const last = (lastNames ?? '').trim().charAt(0);
    return (first + last).toUpperCase() || '?';
  }
}
