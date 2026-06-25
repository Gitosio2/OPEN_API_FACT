import { Router, Request, Response } from 'express';
import { FacturasUseCases, FacturaNotFoundError, FacturaConflictError } from '../domain/facturasUseCases';
import { EstadoFactura, FacturaInput } from '../types';

const errBadRequest = { codigo: 'BAD_REQUEST', mensaje: 'Los datos enviados no son válidos' };
const errNotFound   = { codigo: 'NOT_FOUND',   mensaje: 'La factura no existe' };
const errConflict   = { codigo: 'CONFLICT',     mensaje: 'La operación no está permitida en el estado actual' };

function esFacturaInputValida(body: unknown): body is FacturaInput {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.cif === 'string' &&
    typeof b.denominacionSocial === 'string' &&
    typeof b.direccionFiscal === 'string' &&
    typeof b.baseImponible === 'number' &&
    typeof b.iva === 'number'
  );
}

function handleError(err: unknown, res: Response): void {
  if (err instanceof FacturaNotFoundError) { res.status(404).json(errNotFound); return; }
  if (err instanceof FacturaConflictError) { res.status(409).json(errConflict); return; }
  res.status(500).json({ codigo: 'INTERNAL_ERROR', mensaje: 'Error interno del servidor' });
}

export function createFacturasRouter(useCases: FacturasUseCases): Router {
  const router = Router();

  router.get('/facturas', (req: Request, res: Response) => {
    const estado = req.query.estado as EstadoFactura | undefined;
    res.json(useCases.listarFacturas(estado));
  });

  router.post('/facturas', (req: Request, res: Response) => {
    if (!esFacturaInputValida(req.body)) { res.status(400).json(errBadRequest); return; }
    res.status(201).json(useCases.crearFactura(req.body));
  });

  router.get('/facturas/:id', (req: Request, res: Response) => {
    try {
      res.json(useCases.obtenerFactura(req.params.id));
    } catch (e) { handleError(e, res); }
  });

  router.put('/facturas/:id', (req: Request, res: Response) => {
    if (!esFacturaInputValida(req.body)) { res.status(400).json(errBadRequest); return; }
    try {
      res.json(useCases.actualizarFactura(req.params.id, req.body));
    } catch (e) { handleError(e, res); }
  });

  router.delete('/facturas/:id', (req: Request, res: Response) => {
    try {
      useCases.eliminarFactura(req.params.id);
      res.status(204).send();
    } catch (e) { handleError(e, res); }
  });

  router.patch('/facturas/:id/confirmar', (req: Request, res: Response) => {
    try {
      res.json(useCases.confirmarFactura(req.params.id));
    } catch (e) { handleError(e, res); }
  });

  return router;
}
