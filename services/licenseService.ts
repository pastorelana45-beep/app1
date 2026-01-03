/**
 * PRODUCER LICENSE SERVICE - OTTIMIZZATO
 */

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00'; 
const STORAGE_KEY = 'vocal_synth_pro_license_status';

export const licenseService = {
  // Salva lo stato PRO nel localStorage
  setProActive: () => {
    localStorage.setItem(STORAGE_KEY, 'active');
  },

  // Controlla se l'utente è PRO (sia da URL che da memoria locale)
  checkIsPro: (): boolean => {
    // 1. Controlla memoria locale
    const isLocalActive = localStorage.getItem(STORAGE_KEY) === 'active';
    
    // 2. Controlla parametro URL
    const params = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = params.get('checkout') === 'success';

    if (isCheckoutSuccess) {
      licenseService.setProActive();
      // Pulisce l'URL per estetica e sicurezza
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return true;
    }

    return isLocalActive;
  },

  redirectToPayment: () => {
    const loader = document.createElement('div');
    loader.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(5,5,7,0.98); display: flex; align-items: center; justify-content: center;';
    loader.innerHTML = `<div style="text-align:center;"><div class="spinner"></div><p style="color:white; font-family:sans-serif; margin-top:20px;">Redirecting to Stripe...</p></div>`;
    document.body.appendChild(loader);
    
    setTimeout(() => {
      window.location.href = STRIPE_CHECKOUT_URL;
    }, 500);
  }
};
