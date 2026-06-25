import express from 'express';
import { InMemoryFacturasRepository } from './persistence/facturasRepository';
import { FacturasUseCases } from './domain/facturasUseCases';
import { createFacturasRouter } from './transport/facturasRouter';
import { loggerMiddleware } from './transport/loggerMiddleware';

const repository = new InMemoryFacturasRepository();
const useCases = new FacturasUseCases(repository);

export function resetStore(): void {
  repository.reset();
}

export const app = express();
app.use(express.json());
app.use(loggerMiddleware);
app.use(createFacturasRouter(useCases));
