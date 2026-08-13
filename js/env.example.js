/* =========================================================
   EventSphere — Public Frontend Environment Configuration Template
   Copy this file to js/env.js for local development.
   Do NOT put secret keys (passwords, JWT secrets, etc.) here!
   ========================================================= */

window.ES_CONFIG = {
  // Base URL of the EventSphere Spring Boot API
  API_BASE: 'http://localhost:8080/api/v1',

  // PayHere Payment Gateway Checkout URL
  PAYHERE_GATEWAY_URL: 'https://sandbox.payhere.lk/pay/checkout',

  // Cloudinary Direct Image Upload Settings (Optional)
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_UPLOAD_PRESET: ''
};
