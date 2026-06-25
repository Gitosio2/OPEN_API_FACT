import { Factura, EstadoFactura } from '../types';

export interface IFacturasRepository {
  findAll(estado?: EstadoFactura): Factura[];
  findById(id: string): Factura | undefined;
  save(factura: Factura): Factura;
  update(factura: Factura): Factura;
  delete(id: string): void;
  nextNumeroCorrelativo(): string;
  reset(): void;
}

export class InMemoryFacturasRepository implements IFacturasRepository {
  private store: Factura[] = [];
  private contador = 0;

  findAll(estado?: EstadoFactura): Factura[] {
    return estado ? this.store.filter(f => f.estado === estado) : [...this.store];
  }

  findById(id: string): Factura | undefined {
    return this.store.find(f => f.id === id);
  }

  save(factura: Factura): Factura {
    this.store.push(factura);
    return factura;
  }

  update(factura: Factura): Factura {
    const idx = this.store.findIndex(f => f.id === factura.id);
    this.store[idx] = factura;
    return factura;
  }

  delete(id: string): void {
    this.store = this.store.filter(f => f.id !== id);
  }

  nextNumeroCorrelativo(): string {
    this.contador++;
    return `BT${String(this.contador).padStart(4, '0')}`;
  }

  reset(): void {
    this.store = [];
    this.contador = 0;
  }
}
