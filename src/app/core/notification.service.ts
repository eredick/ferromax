import { isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID, signal } from "@angular/core";

export interface NotificationMessage {
  id: number;
  text: string;
  detail?: string;
  type: "success" | "error";
}

@Injectable({ providedIn: "root" })
export class NotificationService {
  readonly messages = signal<NotificationMessage[]>([]);
  private nextId = 0;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  success(text: string, detail?: string): void {
    this.push({
      text,
      ...(detail ? { detail } : {}),
      type: "success",
    });
  }

  error(text: string, detail?: string): void {
    this.push({
      text,
      ...(detail ? { detail } : {}),
      type: "error",
    });
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((item) => item.id !== id));
  }

  private push(message: Omit<NotificationMessage, "id">): void {
    // Los avisos son transitorios: en el servidor no se renderizan ni se programan temporizadores.
    if (!this.isBrowser) return;
    const id = ++this.nextId;
    this.messages.update((messages) => [...messages, { ...message, id }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }
}
