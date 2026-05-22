export type EmailTemplateType =
  | 'customer_welcome'
  | 'login_otp'
  | 'order_placed'
  | 'order_delivered_invoice'
  | 'order_delivered_tax_invoice'
  | 'order_cancelled'
  | 'refund_initiated'
  | 'refund_completed'
  | 'payment_failed'
  | 'account_suspended';

export interface EmailTemplatePayload {
  type: EmailTemplateType;
  customerName?: string;
  supportContact?: string;
  brandName?: string;
}

export interface OtpEmailPayload extends EmailTemplatePayload {
  type: 'login_otp';
  otp: string;
  expiryMinutes: number;
}

export interface OrderEmailItem {
  name: string;
  quantity: number;
  amount: number;
}

export interface OrderPlacedEmailPayload extends EmailTemplatePayload {
  type: 'order_placed';
  orderId: string;
  orderDate: string;
  storeName: string;
  deliveryAddress: string;
  items: OrderEmailItem[];
  priceBreakup: Record<string, unknown>;
}

export interface InvoiceEmailPayload extends EmailTemplatePayload {
  type: 'order_delivered_invoice';
  orderId: string;
  invoiceNumber: string;
  priceBreakup: Record<string, unknown>;
}

export interface TaxInvoiceEmailPayload extends EmailTemplatePayload {
  type: 'order_delivered_tax_invoice';
  orderId: string;
  invoiceNumber: string;
  taxDetails: Record<string, unknown>;
  priceBreakup: Record<string, unknown>;
}

export const CUSTOMER_EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  'customer_welcome',
  'login_otp',
  'order_placed',
  'order_delivered_invoice',
  'order_delivered_tax_invoice',
  'order_cancelled',
  'refund_initiated',
  'refund_completed',
  'payment_failed',
  'account_suspended',
];

export function emailTemplateSubject(type: EmailTemplateType, brandName = 'NexConnect'): string {
  const subjects: Record<EmailTemplateType, string> = {
    customer_welcome: `Welcome to ${brandName}`,
    login_otp: `Your ${brandName} login OTP`,
    order_placed: `Your ${brandName} order is placed`,
    order_delivered_invoice: `Your ${brandName} invoice`,
    order_delivered_tax_invoice: `Your ${brandName} tax invoice`,
    order_cancelled: `Your ${brandName} order was cancelled`,
    refund_initiated: `Your ${brandName} refund was initiated`,
    refund_completed: `Your ${brandName} refund is complete`,
    payment_failed: `Your ${brandName} payment failed`,
    account_suspended: `Your ${brandName} account status changed`,
  };
  return subjects[type];
}
