const STATUS_LABELS = {
  PENDING_PAYMENT: "Pendiente de pago",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En preparación",
  SHIPPED: "Listo para reparto",
  PICKED_UP: "Recogido",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

function formatFcfa(amount) {
  return `${Math.round(Number(amount) || 0).toLocaleString("es-ES")} FCFA`;
}

function formatDate(date) {
  return new Date(date).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildOrderReceipt(order) {
  const shortId = order.id.slice(0, 8);
  const items = (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  }));

  const receipt = {
    orderId: order.id,
    shortId,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] || order.status,
    createdAt: order.createdAt,
    createdAtLabel: formatDate(order.createdAt),
    recipient: {
      name: order.recipientName,
      phone: order.recipientPhone || null,
      address: order.recipientAddress || null,
    },
    items,
    subtotal: order.subtotal,
    shipping: order.shipping ?? 0,
    total: order.total,
    notes: order.notes || null,
    currency: "FCFA",
  };

  const lines = [
    "🛒 *Nha Kinhon* — Recibo de pedido",
    `Pedido: #${shortId}`,
    `Fecha: ${receipt.createdAtLabel}`,
    `Estado: ${receipt.statusLabel}`,
    "",
    `*Destinatario:* ${order.recipientName}`,
  ];

  if (order.recipientPhone) lines.push(`Tel: ${order.recipientPhone}`);
  if (order.recipientAddress) lines.push(`Dirección: ${order.recipientAddress}`);
  lines.push("", "*Productos:*");

  for (const item of items) {
    lines.push(`• ${item.name} ×${item.quantity} — ${formatFcfa(item.lineTotal)}`);
  }

  lines.push(
    "",
    `Subtotal: ${formatFcfa(order.subtotal)}`,
    `Envío: ${formatFcfa(order.shipping ?? 0)}`,
    `*Total: ${formatFcfa(order.total)}*`,
  );

  if (order.notes) {
    lines.push("", `Notas: ${order.notes}`);
  }

  return {
    receipt,
    shareText: lines.join("\n"),
    trackingPath: `/perfil?tab=orders&orderId=${order.id}`,
  };
}
