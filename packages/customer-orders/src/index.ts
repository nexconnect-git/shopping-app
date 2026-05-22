export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryPartnerLocation extends GeoCoordinates {
  partnerId?: string;
  updatedAt?: string;
}

export interface TrackingRoute {
  polyline?: string;
  points?: GeoCoordinates[];
  estimatedArrivalTime?: string;
}

export interface OrderStatusTimelineItem {
  status: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  description?: string;
}

export interface OrderTrackingState {
  orderId: string;
  status: string;
  storeLocation?: GeoCoordinates;
  customerLocation?: GeoCoordinates;
  deliveryPartnerLocation?: DeliveryPartnerLocation;
  route?: TrackingRoute;
  etaLabel?: string;
  timeline: OrderStatusTimelineItem[];
}

export const CUSTOMER_ORDER_STATUS_FLOW = [
  'placed',
  'accepted',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'on_the_way',
  'arriving',
  'delivered',
] as const;

export function getOrderStatusTimeline(status: string, tracking: Array<{ status?: string; timestamp?: string; description?: string }> = []): OrderStatusTimelineItem[] {
  const normalizedStatus = normalizeStatus(status);
  const activeIndex = CUSTOMER_ORDER_STATUS_FLOW.findIndex((item) => item === normalizedStatus);
  const completedAll = normalizedStatus === 'delivered';
  return CUSTOMER_ORDER_STATUS_FLOW.map((flowStatus, index) => {
    const event = tracking.find((item) => normalizeStatus(item.status || '') === flowStatus);
    return {
      status: flowStatus,
      label: statusLabel(flowStatus),
      completed: completedAll || (activeIndex >= 0 && index <= activeIndex),
      timestamp: event?.timestamp,
      description: event?.description,
    };
  });
}

export function statusLabel(status: string): string {
  return normalizeStatus(status).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeStatus(status: string): string {
  return String(status || '').toLowerCase().trim();
}
