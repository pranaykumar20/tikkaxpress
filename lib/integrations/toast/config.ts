export type ToastConfig = {
  clientId: string;
  clientSecret: string;
  restaurantExternalId: string;
  merchantUuid: string;
  apiBaseUrl: string;
  paymentsApiBaseUrl: string;
  paymentsCheckoutOrigin: string;
  pickupDiningOptionGuid: string;
  deliveryDiningOptionGuid: string;
  payAtStorePaymentTypeGuid: string;
  revenueCenterGuid: string;
  webhookSecret: string;
  paymentMethodConfigId: string;
};

export function isToastApiConfigured() {
  return Boolean(
    process.env.TOAST_CLIENT_ID &&
      process.env.TOAST_CLIENT_SECRET &&
      process.env.TOAST_RESTAURANT_EXTERNAL_ID
  );
}

export function isToastPaymentsConfigured() {
  return isToastApiConfigured() && Boolean(process.env.TOAST_MERCHANT_UUID);
}

export function getToastConfig(): ToastConfig {
  return {
    clientId: process.env.TOAST_CLIENT_ID || "",
    clientSecret: process.env.TOAST_CLIENT_SECRET || "",
    restaurantExternalId: process.env.TOAST_RESTAURANT_EXTERNAL_ID || "",
    merchantUuid: process.env.TOAST_MERCHANT_UUID || "",
    apiBaseUrl: process.env.TOAST_API_BASE_URL || "https://toast-api-server.toasttab.com",
    paymentsApiBaseUrl: process.env.TOAST_PAYMENTS_API_BASE_URL || "https://payments-api.toasttab.com",
    paymentsCheckoutOrigin:
      process.env.NEXT_PUBLIC_TOAST_PAYMENTS_CHECKOUT_ORIGIN || "https://payments.toasttab.com",
    pickupDiningOptionGuid: process.env.TOAST_PICKUP_DINING_OPTION_GUID || "",
    deliveryDiningOptionGuid: process.env.TOAST_DELIVERY_DINING_OPTION_GUID || "",
    payAtStorePaymentTypeGuid: process.env.TOAST_PAY_AT_STORE_PAYMENT_TYPE_GUID || "",
    revenueCenterGuid: process.env.TOAST_REVENUE_CENTER_GUID || "",
    webhookSecret: process.env.TOAST_WEBHOOK_SECRET || "",
    paymentMethodConfigId: process.env.TOAST_PAYMENT_METHOD_CONFIG_ID || ""
  };
}
