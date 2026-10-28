import { z } from "zod";

export const walletDepositSchema = z.object({
  amount: z.number().int().positive().or(z.string().regex(/^\d+$/)),
});

export const walletTransferSchema = z.object({
  recipient: z.string().min(3).max(200),
  amount: z.number().int().positive().or(z.string().regex(/^\d+$/)),
  note: z.string().max(280).optional(),
});

export const walletWithdrawalSchema = z.object({
  amount: z.number().int().positive().or(z.string().regex(/^\d+$/)),
  method: z.enum(["MOBILE_MONEY", "BANK"]),
  destination: z.record(z.unknown()),
});

export const walletRecipientLookupSchema = z.object({
  q: z.string().min(3).max(200),
});

export const adminWithdrawalDecisionSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

export const adminWithdrawalPaidSchema = z.object({
  payoutReference: z.string().max(200).optional(),
});
