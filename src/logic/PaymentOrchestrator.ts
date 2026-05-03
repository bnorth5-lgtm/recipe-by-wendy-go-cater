export interface CompanyConfig {
  legalName: string;
  mailingAddress: string;
  businessZip?: string;
  customizableFooter: string;
  provenanceBio?: string;
}

export const NBS_COMPANY_CONFIG: CompanyConfig = {
  legalName: "Delicious Catering & Events by Wendy",
  mailingAddress: "PO Box 123, North Conway, NH",
  businessZip: "03860", // North Conway zip
  customizableFooter: "Professional Catering Services",
  provenanceBio: `From Legal Pad to Logic.

For years, every recipe, every event, and every detail existed on yellow legal pads. Our legacy was built on handwritten notes, early mornings, and an endless dedication to the craft of catering.

Today, that rich legacy has evolved. It powers a modern logic engine, seamlessly translating decades of intuitive hospitality into a precise, digital system—all without losing the soul of the kitchen.`,
};

export interface PaymentPlan {
  depositAmount: number;
  finalBalance: number;
  dueDate: Date;
  method: 'STRIPE' | 'CHECK' | 'PENDING';
}

export function calculateTotalWithFees(baseTotal: number, method: PaymentPlan['method']): number {
  if (method === 'STRIPE') {
    return baseTotal * 1.035;
  }
  if (method === 'CHECK') {
    return baseTotal;
  }
  return baseTotal;
}

export function prepareStripePayload(orderID: string, total: number, email?: string) {
  // Warm-Standby: Prepare metadata payload for Stripe checkout session
  // Do NOT call stripe.com API here
  return {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Catering Order ${orderID}`,
          },
          unit_amount: Math.round(total * 100), // in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      orderID,
      paymentMethod: 'STRIPE',
    },
    customer_email: email,
  };
}