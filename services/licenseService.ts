const STRIPE_URL = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00';
const STORAGE_KEY = 'vocal_synth_pro_license';

export const licenseService = {
  // Controlla se l'utente è PRO (URL o Memoria locale)
  checkIsPro: (): boolean => {
    // 1. Controlla se è già attivo in memoria
    if (localStorage.getItem(STORAGE_KEY) === 'active') return true;

    // 2. Controlla se è appena tornato da Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      localStorage.setItem(STORAGE_KEY, 'active');
      // Rimuove i parametri dall'URL senza ricaricare la pagina
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    }
    return false;
  },

  redirectToPayment: () => {
    window.location.href = STRIPE_URL;
  }
};
