import { z } from "zod";
import { DELIVERY_FAILURE_REASONS } from "../utils/deliveryFailure.js";

const failureReason = z.enum(DELIVERY_FAILURE_REASONS);

export const failedDeliveryAttemptSchema = z.object({
  reason: failureReason,
  note: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  photo: z.string().optional(),
  photos: z.array(z.string()).max(5).optional(),
});

export const buyerRecipientUpdateSchema = z.object({
  recipientName: z.string().min(1).max(120).optional(),
  recipientPhone: z.string().min(3).max(40).optional(),
  recipientAddress: z.string().min(3).max(500).optional(),
  recipientLat: z.number().min(-90).max(90).optional(),
  recipientLng: z.number().min(-180).max(180).optional(),
});

export const refundRequestSchema = z.object({
  reason: z.enum([
    "CANCEL_BEFORE_DISPATCH",
    "UNDELIVERABLE",
    "DAMAGED_PRODUCT",
    "MISSING_PRODUCT",
    "OTHER",
  ]),
  buyerNote: z.string().max(500).optional(),
  orderItemIds: z.array(z.string()).max(50).optional(),
});

export const adminRefundDecisionSchema = z.object({
  adminNote: z.string().max(500).optional(),
  amount: z.number().int().positive().optional(),
});

export const adminManualRefundSchema = z.object({
  refundToWallet: z.boolean().optional(),
  amount: z.number().int().positive(),
  reason: z
    .enum([
      "ADMIN_MANUAL",
      "UNDELIVERABLE",
      "DAMAGED_PRODUCT",
      "MISSING_PRODUCT",
      "OTHER",
    ])
    .optional(),
  adminNote: z.string().max(500).optional(),
  orderItemIds: z.array(z.string()).max(50).optional(),
});

export const adminResolveUndeliverableSchema = z.object({
  outcome: z.enum(["REFUND_FULL", "REFUND_PARTIAL", "REATTEMPT", "CLOSE_NO_REFUND"]),
  amount: z.number().int().positive().optional(),
  adminNote: z.string().max(500).optional(),
});
