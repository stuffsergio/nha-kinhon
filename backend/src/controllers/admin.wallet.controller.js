import {
  listWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
} from "../services/walletWithdrawal.service.js";

export async function listWithdrawals(req, res) {
  const { status, cursor, limit } = req.query;
  const result = await listWithdrawalsForAdmin({
    status,
    cursor,
    limit: limit ? parseInt(limit, 10) : undefined,
  });
  res.json(result);
}

export async function approve(req, res) {
  const withdrawal = await approveWithdrawal({
    withdrawalId: req.params.withdrawalId,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });
  res.json({ withdrawal });
}

export async function reject(req, res) {
  const withdrawal = await rejectWithdrawal({
    withdrawalId: req.params.withdrawalId,
    adminId: req.user.id,
    adminNote: req.body.adminNote,
  });
  res.json({ withdrawal });
}

export async function markPaid(req, res) {
  const withdrawal = await markWithdrawalPaid({
    withdrawalId: req.params.withdrawalId,
    adminId: req.user.id,
    payoutReference: req.body.payoutReference,
  });
  res.json({ withdrawal });
}
