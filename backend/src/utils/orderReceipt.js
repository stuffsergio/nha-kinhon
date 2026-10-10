import { DEFAULT_LOCALE, t } from "../i18n/index.js";

const INTL_LOCALE = {
  es: "es-ES",
  pt: "pt-PT",
  pov: "pt-GW",
};

function formatFcfa(amount, locale) {
  const intl = INTL_LOCALE[locale] || INTL_LOCALE.es;
  return `${Math.round(Number(amount) || 0).toLocaleString(intl)} FCFA`;
}

function formatDate(date, locale) {
  const intl = INTL_LOCALE[locale] || INTL_LOCALE.es;
  return new Date(date).toLocaleString(intl, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildOrderReceipt(order, locale = DEFAULT_LOCALE) {
  const shortId = order.id.slice(0, 8);
  const items = (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  }));

  const statusLabel =
    t(`orderStatus.${order.status}`, locale) || order.status;

  const receipt = {
    orderId: order.id,
    shortId,
    status: order.status,
    statusLabel,
    createdAt: order.createdAt,
    createdAtLabel: formatDate(order.createdAt, locale),
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
    locale,
  };

  const lines = [
    t("receipt.header", locale),
    t("receipt.orderLine", locale, { shortId }),
    t("receipt.dateLine", locale, { date: receipt.createdAtLabel }),
    t("receipt.statusLine", locale, { status: statusLabel }),
    "",
    t("receipt.recipient", locale, { name: order.recipientName }),
  ];

  if (order.recipientPhone) {
    lines.push(t("receipt.phone", locale, { phone: order.recipientPhone }));
  }
  if (order.recipientAddress) {
    lines.push(t("receipt.address", locale, { address: order.recipientAddress }));
  }
  lines.push("", t("receipt.products", locale));

  for (const item of items) {
    lines.push(
      t("receipt.productLine", locale, {
        name: item.name,
        quantity: item.quantity,
        amount: formatFcfa(item.lineTotal, locale),
      }),
    );
  }

  lines.push(
    "",
    t("receipt.subtotal", locale, { amount: formatFcfa(order.subtotal, locale) }),
    t("receipt.shipping", locale, { amount: formatFcfa(order.shipping ?? 0, locale) }),
    t("receipt.total", locale, { amount: formatFcfa(order.total, locale) }),
  );

  if (order.notes) {
    lines.push("", t("receipt.notes", locale, { notes: order.notes }));
  }

  return {
    receipt,
    shareText: lines.join("\n"),
    trackingPath: `/perfil?tab=orders&orderId=${order.id}`,
  };
}
