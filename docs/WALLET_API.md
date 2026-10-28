# Guía API — Billetera (XOF) y eliminación de cuenta

Documentación para implementar la billetera y el borrado de cuenta en clientes web/móvil. Todos los importes están en **unidades mínimas XOF (enteros)**, nunca en float.

## Conceptos

- **Billetera (`Wallet`)**: una por usuario, moneda `XOF`.
- **Libro mayor (`LedgerEntry`)**: asientos inmutables débito/crédito; el saldo se deriva de entradas `POSTED` menos retenciones `PENDING`.
- **Transacción (`WalletTransaction`)**: registro de negocio (depósito, transferencia, pago de pedido, retiro…) con estados `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REVERSED`.
- **Retiro (`WithdrawalRequest`)**: solicitud admin con flujo manual de pago (Orange Money / MTN / banco).

### Diagrama de estados (retiro)

```mermaid
stateDiagram-v2
  [*] --> PENDING: POST /wallet/withdrawals
  PENDING --> APPROVED: admin approve
  PENDING --> REJECTED: admin reject
  REJECTED --> [*]: fondos liberados
  APPROVED --> PAID: admin mark-paid
  PAID --> [*]
```

## Feature flag

La billetera solo responde si `WALLET_ENABLED=true` (u `1`, `yes`, `on`). Si está desactivada: `503` con código `WALLET_DISABLED`.

## Cabeceras comunes

| Cabecera | Cuándo |
|----------|--------|
| `Authorization: Bearer <accessToken>` | Todas las rutas autenticadas |
| `X-Idempotency-Key: <8-128 chars [A-Za-z0-9._-]>` | **Obligatoria** en depósitos, transferencias, retiros y pago de pedido con billetera |
| `Accept-Language: es \| pt \| pov` | Notificaciones y errores i18n |

## Variables de entorno (backend)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `WALLET_ENABLED` | Activa la billetera | desactivado |
| `WALLET_DEPOSIT_MIN_MINOR` | Mínimo depósito | `500` |
| `WALLET_DEPOSIT_MAX_MINOR` | Máximo depósito | `5000000` |
| `WALLET_TRANSFER_MIN_MINOR` | Mínimo transferencia | `100` |
| `WALLET_TRANSFER_MAX_MINOR` | Máximo por transferencia | `500000` |
| `WALLET_TRANSFER_DAILY_LIMIT_MINOR` | Límite diario enviado | `1000000` |
| `WALLET_WITHDRAWAL_MIN_MINOR` | Mínimo retiro | `500` |
| `WALLET_WITHDRAWAL_MAX_MINOR` | Máximo retiro | `2000000` |
| `WALLET_AMOUNT_ABSOLUTE_MAX_MINOR` | Tope de seguridad | `2147483647` |

Stripe (depósitos): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — el crédito **solo** llega por webhook verificado.

---

## Eliminar cuenta

### `DELETE /api/auth/me`

Rate limit: 5/h por IP.

**Body**

```json
{
  "confirmUsername": "Carlos Mendes",
  "password": "123456"
}
```

- `confirmUsername` debe coincidir **exactamente** con el campo `name` del usuario.
- Reautenticación con contraseña actual.

**Éxito `200`**

```json
{
  "message": "Tu cuenta ha sido eliminada",
  "code": "ACCOUNT_DELETED",
  "deletedAt": "2026-10-28T12:00:00.000Z"
}
```

**Errores**

| Código | HTTP | Motivo |
|--------|------|--------|
| `ACCOUNT_DELETE_USERNAME_MISMATCH` | 400 | Nombre no coincide |
| `PASSWORD_WRONG` | 400 | Contraseña incorrecta |
| `ACCOUNT_DELETE_ACTIVE_ORDERS` | 409 | Pedidos en curso |
| `ACCOUNT_DELETE_WALLET_BALANCE` | 409 | Saldo o retenciones ≠ 0 |
| `ACCOUNT_ALREADY_DELETED` | 409 | Ya eliminada |

Efecto: soft-delete, PII anonimizada, tokens push/contactos borrados, refresh revocado; pedidos/pagos históricos conservados.

---

## Billetera — lectura

### `GET /api/wallet`

**Respuesta `200`**

```json
{
  "walletId": "clx…",
  "currency": "XOF",
  "balanceMinor": 15000,
  "availableMinor": 12000,
  "pendingHoldMinor": 3000,
  "limits": {
    "deposit": { "minMinor": 500, "maxMinor": 5000000 },
    "transfer": { "minMinor": 100, "maxMinor": 500000, "dailyLimitMinor": 1000000 },
    "withdrawal": { "minMinor": 500, "maxMinor": 2000000 }
  }
}
```

### `GET /api/wallet/transactions?cursor=&limit=20&type=&status=`

Paginación cursor. `limit` máx. 50.

### `GET /api/wallet/recipients/lookup?q=maria@example.com`

Respuesta si existe (sin enumeración de emails):

```json
{ "found": true, "maskedName": "M••••" }
```

o `{ "found": false }`.

---

## Depósito (Stripe PaymentSheet)

### `POST /api/wallet/deposits`

**Body:** `{ "amount": 5000 }` (entero minor units)

**Respuesta `201`**

```json
{
  "walletTransactionId": "…",
  "amountMinor": 5000,
  "currency": "XOF",
  "paymentIntent": "pi_…_secret_…",
  "ephemeralKey": "ek_…",
  "customer": "cus_…",
  "publishableKey": "pk_test_…"
}
```

**Flujo móvil**

1. Llamar a este endpoint con `X-Idempotency-Key`.
2. Inicializar Stripe PaymentSheet con `paymentIntent`, `customer`, `ephemeralKey`, `publishableKey`.
3. **No** acreditar saldo en cliente; esperar push/notificación `WALLET_DEPOSIT_RECEIVED` o refrescar `GET /api/wallet`.
4. Backend acredita en `payment_intent.succeeded` con `metadata.type=wallet_deposit`.

---

## Transferencia

### `POST /api/wallet/transfers`

```json
{
  "recipient": "joao@example.com",
  "amount": 2000,
  "note": "Gracias"
}
```

`recipient`: email o teléfono de usuario existente. No puedes enviarte a ti mismo.

**Errores:** `WALLET_INSUFFICIENT_FUNDS`, `WALLET_TRANSFER_DAILY_LIMIT`, `WALLET_TRANSFER_SELF`, `WALLET_RECIPIENT_NOT_FOUND`.

---

## Retiro

### `POST /api/wallet/withdrawals`

```json
{
  "amount": 10000,
  "method": "MOBILE_MONEY",
  "destination": {
    "operator": "ORANGE_MONEY",
    "phone": "+245…",
    "accountName": "Carlos"
  }
}
```

`method`: `MOBILE_MONEY` | `BANK`. Retiene fondos (`pendingHoldMinor`) hasta resolución admin.

### Admin

| Método | Ruta |
|--------|------|
| GET | `/api/admin/wallet/withdrawals?status=PENDING&cursor=` |
| POST | `/api/admin/wallet/withdrawals/:withdrawalId/approve` `{ "adminNote"?: "…" }` |
| POST | `/api/admin/wallet/withdrawals/:withdrawalId/reject` |
| POST | `/api/admin/wallet/withdrawals/:withdrawalId/mark-paid` `{ "payoutReference"?: "…" }` |

Auditoría en `AdminAuditLog`. Payout por defecto **manual** (`walletPayout.provider.js`).

---

## Pagar pedido con billetera

### `POST /api/orders/:id/pay-with-wallet`

Requiere pedido `PENDING_PAYMENT`, saldo disponible, `X-Idempotency-Key`.

**Respuesta `200`**

```json
{
  "order": { "id": "…", "status": "CONFIRMED", … },
  "walletTransaction": { "id": "…", "type": "ORDER_PAYMENT", "amountMinor": 12000 },
  "idempotent": false
}
```

## Reembolso a billetera (admin)

En `POST /api/admin/orders/:id/refund` body opcional:

```json
{ "amount": 5000, "refundToWallet": true }
```

Pedidos pagados con billetera (`stripePaymentId` prefijo `wallet:`) reembolsan a billetera automáticamente si la feature está activa.

---

## Notificaciones (push + bandeja)

| Tipo | Plantilla i18n |
|------|----------------|
| `WALLET_DEPOSIT_RECEIVED` | es / pt / pov |
| `WALLET_TRANSFER_SENT` / `WALLET_TRANSFER_RECEIVED` | es / pt / pov |
| `WALLET_WITHDRAWAL_APPROVED` / `REJECTED` / `PAID` | es / pt / pov |

Deep links: bandeja `/notificaciones` (sin `orderId`).

---

## Checklist frontend

- [ ] Leer saldo desde `GET /api/wallet` (no usar `user.balance` legacy salvo compatibilidad).
- [ ] Enviar `X-Idempotency-Key` UUID v4 en cada mutación.
- [ ] PaymentSheet depósito: no optimizar saldo local sin webhook.
- [ ] Lookup destinatario antes de confirmar transferencia.
- [ ] UI retiros: estados PENDING / APPROVED / PAID / REJECTED.
- [ ] Manejar `503 WALLET_DISABLED` ocultando sección billetera.
- [ ] Flujo borrar cuenta: confirmar nombre exacto + contraseña; bloqueos 409.
- [ ] Formatear XOF como entero con separadores locales.
- [ ] Polling 5–10 s tras depósito opcional; preferir push.

---

## Códigos de error billetera (resumen)

`WALLET_DISABLED`, `WALLET_INSUFFICIENT_FUNDS`, `WALLET_AMOUNT_*`, `WALLET_TRANSFER_*`, `WALLET_WITHDRAWAL_*`, `IDEMPOTENCY_KEY_*`, `ACCOUNT_*`.
