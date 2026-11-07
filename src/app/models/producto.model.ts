export interface Producto {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  proyecto?: string;
  marca?: string;
  imagenUrl?: string;
  imagenVersion?: string;
  precioAnterior?: number;
  destacado?: boolean;
  nuevo?: boolean;
}
