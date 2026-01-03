// Sostituisci tutto in src/services/licenseService.ts
const STRIPE_URL = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00';
const KEY = 'vocal_synth_pro_license';

export const licenseService = {
  isProUser: () => {
    // Controlla se abbiamo appena finito il pagamento
    if (window.location.search.includes('checkout=success')) {
      localStorage.setItem(KEY, 'active');
      // Pulisce l'URL senza ricaricare (evita il 404)
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    }
    return localStorage.getItem(KEY) === 'active';
  },
  redirectToPayment: () => {
    window.location.href = STRIPE_URL;
  }
};
