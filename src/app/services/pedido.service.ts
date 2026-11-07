import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

const PEDIDO_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbw2r9KzmWW2JXeXjGwNXwNe7YAlINV4Jf53oDDa7SUWy6SOmlO3Y2VFU48WFlxh78Lx/exec";

export interface PedidoPayload {
  cliente: {
    nombre: string;
    telefono: string;
    direccion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    ubigeo: string;
    interior: string;
    sinNumero: boolean;
    ubicacionUrl: string;
  };
  formaPago: string;
  items: Array<{
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  total: number;
}

export interface PedidoResponse {
  status: string;
  [key: string]: unknown;
}

export interface ContactoPayload {
  tipo: "contacto";
  destinatario: string;
  nombre: string;
  correo: string;
  mensaje: string;
}

@Injectable({ providedIn: "root" })
export class PedidoService {
  constructor(private readonly http: HttpClient) {}

  enviarContacto(payload: ContactoPayload): Observable<PedidoResponse> {
    const headers = new HttpHeaders({
      "Content-Type": "text/plain;charset=utf-8",
    });

    return this.http.post<PedidoResponse>(PEDIDO_ENDPOINT, JSON.stringify(payload), { headers });
  }

  enviarPedido(payload: PedidoPayload): Observable<PedidoResponse> {
    const headers = new HttpHeaders({
      "Content-Type": "text/plain;charset=utf-8",
    });

    return this.http.post<PedidoResponse>(PEDIDO_ENDPOINT, JSON.stringify(payload), { headers });
  }
}
