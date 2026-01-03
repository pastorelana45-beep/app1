/**
 * PRODUCER LICENSE SERVICE - COMPLETO
 */

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00'; 
const STORAGE_KEY = 'vocal_synth_pro_license';

export const licenseService = {
  // Salva permanentemente la licenza nel browser
  saveLicense: () => {
    localStorage.setItem(STORAGE_KEY, 'active');
  },

  // Controlla se l'utente è PRO
  isProUser: (): boolean => {
    // 1. Controlla se è già salvata
    const isLocal = localStorage.getItem(STORAGE_KEY) === 'active';
    
    // 2. Controlla se l'utente è appena tornato dal pagamento (?checkout=success)
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('checkout') === 'success';

    if (isSuccess) {
      licenseService.saveLicense();
      // Pulisce l'URL per non mostrare "checkout=success" all'infinito
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return true;
    }

    return isLocal;
  },

  redirectToPayment: () => {
    // Redirect immediato senza loader complessi che potrebbero bloccare il browser
    window.location.href = STRIPE_CHECKOUT_URL;
  }
};
