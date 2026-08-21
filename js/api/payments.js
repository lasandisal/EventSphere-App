/* Payments API — matches PaymentController (/api/v1/payments/**) */
const PAYHERE_MERCHANT_ID = '1237371';
const PAYHERE_MERCHANT_SECRET = 'MTU4NDUyMzI2NDE3OTc3NTYzMzIyODA0MzkyNjU0MTM0OTc3MjEw';

const PaymentsAPI = {
  initiate(bookingId) {
    return esFetch(`/payments/initiate/${bookingId}`, { method: 'POST' });
  },

  // Generates genuine PayHere MD5 signature and calls the backend webhook
  async simulateNotify(bookingId, amount = 0, currency = 'LKR', bookingRef = null) {
    const merchantId = PAYHERE_MERCHANT_ID;
    const merchantSecret = PAYHERE_MERCHANT_SECRET;
    
    // Format order_id: Matches backend ES-{id} pattern
    let orderId = bookingRef || ('ES-' + bookingId);
    if (!orderId.startsWith('ES-') && !isNaN(orderId)) {
      orderId = 'ES-' + orderId;
    }
    
    const formattedAmount = Number(amount).toFixed(2);
    const statusCode = '2'; // 2 = SUCCESS
    
    // PayHere Checksum: md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret).toUpperCase()).toUpperCase()
    const md5Fn = window.esMd5 || (s => s);
    const secretHash = md5Fn(merchantSecret).toUpperCase();
    const sigString = merchantId + orderId + formattedAmount + currency + statusCode + secretHash;
    const md5sig = md5Fn(sigString).toUpperCase();

    const params = new URLSearchParams();
    params.append('merchant_id', merchantId);
    params.append('order_id', orderId);
    params.append('payment_id', '3200' + String(Date.now()).slice(-8));
    params.append('payhere_amount', formattedAmount);
    params.append('payhere_currency', currency);
    params.append('status_code', statusCode);
    params.append('status_message', 'Successfully received the VISA payment');
    params.append('method', 'VISA');
    params.append('card_holder_name', 'EventSphere Customer');
    params.append('card_no', '************1292');
    params.append('card_expiry', '01/28');
    params.append('recurring', '0');
    params.append('md5sig', md5sig);
    
    const baseUrl = window.ES_CONFIG?.API_BASE || 'http://localhost:7080/api/v1';
    return fetch(`${baseUrl}/payments/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
  }
};
window.PaymentsAPI = PaymentsAPI;
