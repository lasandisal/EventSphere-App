/* =========================================================
   EventSphere — Generated Runtime Environment Configuration
   ========================================================= */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.ES_CONFIG = {
  API_BASE: isLocalhost 
    ? "http://localhost:7080/api/v1" 
    : "https://its-1114-eventsphere-booking-platform.onrender.com/api/v1",
  PAYHERE_GATEWAY_URL: "https://sandbox.payhere.lk/pay/checkout",
  CLOUDINARY_CLOUD_NAME: "ze21miiw",
  CLOUDINARY_UPLOAD_PRESET: "eventsphere_preset"
};