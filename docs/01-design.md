# Diseño API REST — Gestión de Facturas

## Requisitos

### Modelo de factura

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador interno |
| `numero` | string | Número correlativo con prefijo (`BT0001`, `BT0002`, …). Se asigna al pasar a estado **definitivo** |
| `cif` | string | CIF del cliente |
| `denominacionSocial` | string | Razón social del cliente |
| `direccionFiscal` | string | Dirección fiscal del cliente |
| `baseImponible` | decimal | Importe sin IVA |
| `iva` | decimal | Importe del IVA |
| `total` | decimal | `baseImponible + iva` |
| `estado` | enum | `borrador` \| `definitivo` |
| `creadoEn` | datetime | Fecha de creación |
| `actualizadoEn` | datetime | Fecha de última modificación |

### Reglas de negocio

- Una factura se crea siempre en estado **borrador** y sin número asignado.
- Al confirmar una factura (pasar a **definitivo**) se le asigna el siguiente número correlativo disponible (`BT` + secuencia de 4 dígitos con cero-relleno).
- Solo las facturas en estado **borrador** pueden eliminarse.
- Las facturas **definitivas** no se pueden eliminar ni volver a borrador.

---

## Endpoints propuestos

### Facturas

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/facturas` | Crea una factura en estado borrador |
| `GET` | `/facturas` | Lista todas las facturas (con filtro opcional por estado) |
| `GET` | `/facturas/:id` | Obtiene el detalle de una factura |
| `PUT` | `/facturas/:id` | Actualiza datos de una factura borrador (cif, importes) |
| `PATCH` | `/facturas/:id/confirmar` | Confirma la factura: pasa a definitivo y asigna número |
| `DELETE` | `/facturas/:id` | Elimina una factura (solo si está en borrador) |

---

## Detalle de peticiones y respuestas

### `POST /facturas`

**Body:**
```json
{
  "cif": "B12345678",
  "denominacionSocial": "Empresa Ejemplo S.L.",
  "direccionFiscal": "Calle Mayor 1, 28001 Madrid",
  "baseImponible": 1000.00,
  "iva": 210.00
}
```

**Response `201 Created`:**
```json
{
  "id": "uuid",
  "numero": null,
  "cif": "B12345678",
  "denominacionSocial": "Empresa Ejemplo S.L.",
  "direccionFiscal": "Calle Mayor 1, 28001 Madrid",
  "baseImponible": 1000.00,
  "iva": 210.00,
  "total": 1210.00,
  "estado": "borrador",
  "creadoEn": "2026-06-23T21:00:00Z"
}
```

---

### `PATCH /facturas/:id/confirmar`

Sin body. Asigna el siguiente número correlativo y cambia el estado.

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "numero": "BT0001",
  "estado": "definitivo",
  ...
}
```

**Errores:**
- `404` — factura no encontrada
- `409` — la factura ya está en estado definitivo

---

### `DELETE /facturas/:id`

**Response `204 No Content`** si se elimina correctamente.

**Errores:**
- `404` — factura no encontrada
- `409` — no se puede eliminar una factura definitiva

---

### `GET /facturas` — Parámetros de query opcionales

| Parámetro | Valores | Descripción |
|---|---|---|
| `estado` | `borrador` \| `definitivo` | Filtra por estado |

---

## Numeración correlativa

La secuencia se gestiona en base de datos con un contador atómico para evitar colisiones en concurrencia. El formato es:

```
BT + número de 4 dígitos con cero-relleno
```

Ejemplos: `BT0001`, `BT0002`, …, `BT9999`
