# Ejemplos curl — API Facturas

> Servidor en `http://localhost:3000`. Arranca con `npm run dev`.  
> Comandos preparados para **PowerShell 5.1** usando `curl.exe`.

---

## GET /facturas — Listar todas

```powershell
curl.exe http://localhost:3000/facturas
```

### Filtrar por estado borrador

```powershell
curl.exe "http://localhost:3000/facturas?estado=borrador"
```

### Filtrar por estado definitivo

```powershell
curl.exe "http://localhost:3000/facturas?estado=definitivo"
```

---

## POST /facturas — Crear factura

```powershell
[System.IO.File]::WriteAllText("$env:TEMP\f.json", '{"cif":"B12345678","denominacionSocial":"Empresa Ejemplo S.L.","direccionFiscal":"Calle Mayor 1, 28001 Madrid","baseImponible":1000,"iva":210}'); curl.exe -X POST http://localhost:3000/facturas -H "Content-Type: application/json" -d "@$env:TEMP\f.json"
```

### Error 400 — campo obligatorio faltante (sin cif)

```powershell
[System.IO.File]::WriteAllText("$env:TEMP\f.json", '{"denominacionSocial":"Empresa Ejemplo S.L.","direccionFiscal":"Calle Mayor 1","baseImponible":1000,"iva":210}'); curl.exe -X POST http://localhost:3000/facturas -H "Content-Type: application/json" -d "@$env:TEMP\f.json"
```

---

## GET /facturas/:id — Obtener detalle

```powershell
curl.exe http://localhost:3000/facturas/$id
```

### Error 404 — factura no encontrada

```powershell
curl.exe http://localhost:3000/facturas/00000000-0000-0000-0000-000000000000
```

---

## PUT /facturas/:id — Actualizar factura (solo borradores)

```powershell
[System.IO.File]::WriteAllText("$env:TEMP\f.json", '{"cif":"B12345678","denominacionSocial":"Empresa Modificada S.L.","direccionFiscal":"Calle Nueva 5, 28002 Madrid","baseImponible":2000,"iva":420}'); curl.exe -X PUT http://localhost:3000/facturas/$id -H "Content-Type: application/json" -d "@$env:TEMP\f.json"
```

---

## PATCH /facturas/:id/confirmar — Confirmar factura

```powershell
curl.exe -X PATCH http://localhost:3000/facturas/$id/confirmar
```

---

## DELETE /facturas/:id — Eliminar factura (solo borradores)

```powershell
curl.exe -X DELETE http://localhost:3000/facturas/$id
```

---

## Flujo completo

```powershell
[System.IO.File]::WriteAllText("$env:TEMP\f.json", '{"cif":"B12345678","denominacionSocial":"Empresa Ejemplo S.L.","direccionFiscal":"Calle Mayor 1, 28001 Madrid","baseImponible":1000,"iva":210}'); $id = (curl.exe -s -X POST http://localhost:3000/facturas -H "Content-Type: application/json" -d "@$env:TEMP\f.json" | ConvertFrom-Json).id; echo $id

curl.exe http://localhost:3000/facturas/$id

[System.IO.File]::WriteAllText("$env:TEMP\f.json", '{"cif":"B12345678","denominacionSocial":"Empresa Actualizada S.L.","direccionFiscal":"Calle Mayor 1, 28001 Madrid","baseImponible":1500,"iva":315}'); curl.exe -X PUT http://localhost:3000/facturas/$id -H "Content-Type: application/json" -d "@$env:TEMP\f.json"

curl.exe -X PATCH http://localhost:3000/facturas/$id/confirmar

curl.exe -X DELETE http://localhost:3000/facturas/$id

curl.exe http://localhost:3000/facturas
```
