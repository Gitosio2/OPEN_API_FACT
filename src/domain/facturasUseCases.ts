import { randomUUID } from 'crypto';
import { Factura, FacturaInput, EstadoFactura } from '../types';
import { IFacturasRepository } from '../persistence/facturasRepository';

export class FacturaNotFoundError extends Error {}
export class FacturaConflictError extends Error {}

export class FacturasUseCases {
  constructor(private readonly repo: IFacturasRepository) {}

  listarFacturas(estado?: EstadoFactura): Factura[] {
    return this.repo.findAll(estado);
  }

  crearFactura(input: FacturaInput): Factura {
    const ahora = new Date().toISOString();
    return this.repo.save({
      id: randomUUID(),
      numero: null,
      ...input,
      total: input.baseImponible + input.iva,
      estado: 'borrador',
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  obtenerFactura(id: string): Factura {
    const factura = this.repo.findById(id);
    if (!factura) throw new FacturaNotFoundError();
    return factura;
  }

  actualizarFactura(id: string, input: FacturaInput): Factura {
    const factura = this.repo.findById(id);
    if (!factura) throw new FacturaNotFoundError();
    if (factura.estado === 'definitivo') throw new FacturaConflictError();
    return this.repo.update({
      ...factura,
      ...input,
      total: input.baseImponible + input.iva,
      actualizadoEn: new Date().toISOString(),
    });
  }

  eliminarFactura(id: string): void {
    const factura = this.repo.findById(id);
    if (!factura) throw new FacturaNotFoundError();
    if (factura.estado === 'definitivo') throw new FacturaConflictError();
    this.repo.delete(id);
  }

  confirmarFactura(id: string): Factura {
    const factura = this.repo.findById(id);
    if (!factura) throw new FacturaNotFoundError();
    if (factura.estado === 'definitivo') throw new FacturaConflictError();
    return this.repo.update({
      ...factura,
      estado: 'definitivo',
      numero: this.repo.nextNumeroCorrelativo(),
      actualizadoEn: new Date().toISOString(),
    });
  }
}
