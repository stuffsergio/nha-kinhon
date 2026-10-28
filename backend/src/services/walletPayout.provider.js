/**
 * Payout provider interface — manual by default (no external Orange/MTN API).
 */
const manualProvider = {
  name: "manual",
  async recordManualPayout({ withdrawalRequest, adminId: _adminId }) {
    return `manual-${withdrawalRequest.id}-${Date.now()}`;
  },
};

let activeProvider = manualProvider;

export function getPayoutProvider() {
  return activeProvider;
}

/** For tests or future Orange Money / MTN integration. */
export function setPayoutProvider(provider) {
  activeProvider = provider || manualProvider;
}
