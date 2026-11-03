import { Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge badge--' + tone()"><span class="badge__dot"></span>{{ label() }}</span>`,
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');
}
