/* Payments API — matches PaymentController (/api/v1/payments/**)
   Note: /payments/notify is a server-to-server PayHere webhook and is
   never called from the frontend. */
const PaymentsAPI = {
  initiate(bookingId) {
    return esFetch(`/payments/initiate/${bookingId}`, { method: 'POST' });
  }
};
window.PaymentsAPI = PaymentsAPI;
