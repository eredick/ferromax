import { Component, ElementRef, HostListener, inject, input, model, signal } from "@angular/core";

@Component({
  selector: "app-filter-select",
  standalone: true,
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open.set(!open())"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        [attr.aria-label]="label()"
        class="flex w-full items-center justify-between gap-3 rounded-lg border py-2.5 text-left text-sm transition focus:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        [class]="
          subtle()
            ? 'min-h-11 border-border bg-background px-3.5 leading-5 focus-visible:ring-2 focus-visible:ring-ring/30 ' +
              (value() ? 'text-foreground' : 'text-foreground/65')
            : value()
              ? 'px-4 border-primary bg-white font-semibold text-primary ring-1 ring-primary'
              : 'px-4 border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100'
        "
      >
        <span class="truncate">{{ value() ?? placeholder() }}</span>
        <svg
          class="h-4 w-4 shrink-0 transition-transform"
          [class.rotate-180]="open()"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      @if (open()) {
        <ul
          role="listbox"
          [attr.aria-label]="label()"
          class="absolute left-0 right-0 z-30 mt-2 max-h-72 min-w-[14rem] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              [attr.aria-selected]="!value()"
              (click)="pick(null)"
              class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100"
              [class]="!value() ? 'bg-accent font-semibold text-primary' : 'text-gray-700'"
            >
              {{ placeholder() }}
            </button>
          </li>
          @for (option of options(); track option) {
            <li role="presentation">
              <button
                type="button"
                role="option"
                [attr.aria-selected]="value() === option"
                (click)="pick(option)"
                class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100"
                [class]="value() === option ? 'bg-accent font-semibold text-primary' : 'text-gray-700'"
              >
                <span class="truncate">{{ option }}</span>
                @if (value() === option) {
                  <svg
                    class="h-4 w-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class FilterSelectComponent {
  readonly options = input.required<string[]>();
  readonly value = model<string | null>(null);
  readonly placeholder = input("Todas");
  readonly label = input("Filtro");
  readonly disabled = input(false);
  readonly subtle = input(false);
  readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  pick(option: string | null): void {
    this.value.set(option);
    this.open.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.open.set(false);
  }
}
