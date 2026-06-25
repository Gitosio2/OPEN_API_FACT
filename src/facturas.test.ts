import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetStore } from './app';

const facturaValida = {
  cif: 'B12345678',
  denominacionSocial: 'Empresa Ejemplo S.L.',
  direccionFiscal: 'Calle Mayor 1, 28001 Madrid',
  baseImponible: 1000.00,
  iva: 210.00,
};

beforeEach(() => {
  resetStore();
});

// ---------------------------------------------------------------------------
// GET /facturas
// ---------------------------------------------------------------------------
describe('GET /facturas', () => {
  it('devuelve 200 con array vacío cuando no hay facturas', async () => {
    const res = await request(app).get('/facturas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('devuelve 200 con las facturas creadas', async () => {
    await request(app).post('/facturas').send(facturaValida);
    await request(app).post('/facturas').send({ ...facturaValida, cif: 'A99999999' });

    const res = await request(app).get('/facturas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filtra por estado=borrador devuelve solo las no confirmadas', async () => {
    // Creamos 3 facturas: confirmamos 2, dejamos 1 en borrador
    const { body: f1 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'A11111111' });
    const { body: f2 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'B22222222' });
    const { body: f3 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'C33333333' });

    await request(app).patch(`/facturas/${f1.id}/confirmar`);
    await request(app).patch(`/facturas/${f2.id}/confirmar`);

    const res = await request(app).get('/facturas?estado=borrador');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(f3.id);
    expect(res.body[0].estado).toBe('borrador');
    expect(res.body.map((f: { id: string }) => f.id)).not.toContain(f1.id);
    expect(res.body.map((f: { id: string }) => f.id)).not.toContain(f2.id);
  });

  it('filtra por estado=definitivo devuelve solo las confirmadas', async () => {
    // Creamos 3 facturas: confirmamos 2, dejamos 1 en borrador
    const { body: f1 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'A11111111' });
    const { body: f2 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'B22222222' });
    const { body: f3 } = await request(app).post('/facturas').send({ ...facturaValida, cif: 'C33333333' });

    await request(app).patch(`/facturas/${f1.id}/confirmar`);
    await request(app).patch(`/facturas/${f2.id}/confirmar`);

    const res = await request(app).get('/facturas?estado=definitivo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((f: { estado: string }) => f.estado === 'definitivo')).toBe(true);
    expect(res.body.map((f: { id: string }) => f.id)).not.toContain(f3.id);
  });
});

// ---------------------------------------------------------------------------
// POST /facturas
// ---------------------------------------------------------------------------
describe('POST /facturas', () => {
  it('devuelve 201 con la factura creada en estado borrador', async () => {
    const res = await request(app).post('/facturas').send(facturaValida);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ...facturaValida,
      estado: 'borrador',
      total: 1210.00,
      numero: null,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.creadoEn).toBeDefined();
    expect(res.body.actualizadoEn).toBeDefined();
  });

  it('devuelve 400 cuando faltan campos obligatorios', async () => {
    const { cif: _, ...sinCif } = facturaValida;
    const res = await request(app).post('/facturas').send(sinCif);

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('BAD_REQUEST');
    expect(res.body.mensaje).toBeDefined();
  });

  it('devuelve 400 cuando baseImponible no es un número', async () => {
    const res = await request(app)
      .post('/facturas')
      .send({ ...facturaValida, baseImponible: 'no-un-numero' });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('BAD_REQUEST');
  });

  it('devuelve 400 cuando iva no es un número', async () => {
    const res = await request(app)
      .post('/facturas')
      .send({ ...facturaValida, iva: 'no-un-numero' });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('BAD_REQUEST');
  });
});

// ---------------------------------------------------------------------------
// GET /facturas/:id
// ---------------------------------------------------------------------------
describe('GET /facturas/:id', () => {
  it('devuelve 200 con el detalle de la factura', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);

    const res = await request(app).get(`/facturas/${creada.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(creada.id);
    expect(res.body.cif).toBe(facturaValida.cif);
  });

  it('devuelve 404 cuando la factura no existe', async () => {
    const res = await request(app).get('/facturas/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PUT /facturas/:id
// ---------------------------------------------------------------------------
describe('PUT /facturas/:id', () => {
  it('devuelve 200 con la factura actualizada', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);
    const cambios = { ...facturaValida, baseImponible: 2000.00, iva: 420.00 };

    const res = await request(app).put(`/facturas/${creada.id}`).send(cambios);
    expect(res.status).toBe(200);
    expect(res.body.baseImponible).toBe(2000.00);
    expect(res.body.iva).toBe(420.00);
    expect(res.body.total).toBe(2420.00);
  });

  it('devuelve 404 cuando la factura no existe', async () => {
    const res = await request(app)
      .put('/facturas/00000000-0000-0000-0000-000000000000')
      .send(facturaValida);

    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('NOT_FOUND');
  });

  it('devuelve 400 cuando los datos son inválidos', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);

    const res = await request(app)
      .put(`/facturas/${creada.id}`)
      .send({ ...facturaValida, cif: undefined });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('BAD_REQUEST');
  });

  it('devuelve 409 cuando la factura está en estado definitivo', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);
    await request(app).patch(`/facturas/${creada.id}/confirmar`);

    const res = await request(app).put(`/facturas/${creada.id}`).send(facturaValida);
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe('CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// DELETE /facturas/:id
// ---------------------------------------------------------------------------
describe('DELETE /facturas/:id', () => {
  it('devuelve 204 al eliminar una factura en borrador', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);

    const res = await request(app).delete(`/facturas/${creada.id}`);
    expect(res.status).toBe(204);
  });

  it('la factura eliminada ya no existe', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);
    await request(app).delete(`/facturas/${creada.id}`);

    const res = await request(app).get(`/facturas/${creada.id}`);
    expect(res.status).toBe(404);
  });

  it('devuelve 404 cuando la factura no existe', async () => {
    const res = await request(app).delete('/facturas/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('NOT_FOUND');
  });

  it('devuelve 409 cuando la factura está en estado definitivo', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);
    await request(app).patch(`/facturas/${creada.id}/confirmar`);

    const res = await request(app).delete(`/facturas/${creada.id}`);
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe('CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// PATCH /facturas/:id/confirmar
// ---------------------------------------------------------------------------
describe('PATCH /facturas/:id/confirmar', () => {
  it('devuelve 200 con la factura confirmada y número correlativo asignado', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);

    const res = await request(app).patch(`/facturas/${creada.id}/confirmar`);
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('definitivo');
    expect(res.body.numero).toBeDefined();
    expect(res.body.numero).toMatch(/^BT\d{4}$/);
  });

  it('el número correlativo se incrementa con cada factura confirmada', async () => {
    const { body: f1 } = await request(app).post('/facturas').send(facturaValida);
    const { body: f2 } = await request(app).post('/facturas').send(facturaValida);

    const r1 = await request(app).patch(`/facturas/${f1.id}/confirmar`);
    const r2 = await request(app).patch(`/facturas/${f2.id}/confirmar`);

    expect(r1.body.numero).toBe('BT0001');
    expect(r2.body.numero).toBe('BT0002');
  });

  it('devuelve 404 cuando la factura no existe', async () => {
    const res = await request(app).patch('/facturas/00000000-0000-0000-0000-000000000000/confirmar');

    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('NOT_FOUND');
  });

  it('devuelve 409 cuando la factura ya está confirmada', async () => {
    const { body: creada } = await request(app).post('/facturas').send(facturaValida);
    await request(app).patch(`/facturas/${creada.id}/confirmar`);

    const res = await request(app).patch(`/facturas/${creada.id}/confirmar`);
    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe('CONFLICT');
  });
});
