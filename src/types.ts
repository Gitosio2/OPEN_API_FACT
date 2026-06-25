export type EstadoFactura = 'borrador' | 'definitivo';

export interface FacturaInput {
  cif: string;
  denominacionSocial: string;
  direccionFiscal: string;
  baseImponible: number;
  iva: number;
}

export interface Factura extends FacturaInput {
  id: string;
  numero: string | null;
  total: number;
  estado: EstadoFactura;
  creadoEn: string;
  actualizadoEn: string;
}
