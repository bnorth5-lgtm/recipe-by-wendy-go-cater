import { useState, useCallback } from 'react';

export interface PaymentGateStatus {
  isApproved: boolean;
  requiresManualApproval: boolean;
  orderID: string;
}

export function usePaymentGate(orderID: string, totalAmount: number) {
  const requiresManualApproval = totalAmount > 5000;
  const [isApproved, setIsApproved] = useState(!requiresManualApproval);

  const toggleApproval = useCallback(() => {
    setIsApproved((prev) => !prev);
  }, []);

  return {
    status: {
      isApproved,
      requiresManualApproval,
      orderID,
    } as PaymentGateStatus,
    toggleApproval,
  };
}