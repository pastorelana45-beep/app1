
/**
 * PRODUCER LICENSE SERVICE
 * Gestisce l'attivazione della licenza tramite Stripe.
 */

// IL TUO LINK DI PAGAMENTO REALE
const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00'; 

export const licenseService = {
  /**
   * Restituisce l'URL corrente pulito.
   */
  getCurrentBaseUrl: (): string => {
    return window.location.origin + window.location.pathname;
  },

  /**
   * Genera l'URL esatto per Stripe basandosi su dove l'app è ospitata (es. Vercel).
   */
  getRedirectUrl: (): string => {
    const base = window.location.origin + window.location.pathname;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/?checkout=success`;
  },

  /**
   * Porta l'utente alla pagina di pagamento.
   */
  redirectToPayment: () => {
    if (!STRIPE_CHECKOUT_URL || STRIPE_CHECKOUT_URL.includes('QUI_IL_TUO_LINK_REALE')) {
      alert("⚠️ ERRORE: Link Stripe non configurato correttamente.");
      return;
    }

    const loader = document.createElement('div');
    loader.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(5,5,7,0.98); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); color: white; font-family: system-ui, sans-serif;';
    loader.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;">
        <div style="width: 50px; height: 50px; border: 3px solid rgba(245, 158, 11, 0.1); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div>
          <p style="font-size: 16px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">Connessione a Stripe</p>
          <p style="font-size: 11px; color: rgba(255,255,255,0.4); margin: 4px 0 0 0;">Verifica della sessione sicura...</p>
        </div>
      </div>
      <style> @keyframes spin { to { transform: rotate(360deg); } } </style>
    `;
    document.body.appendChild(loader);
    
    setTimeout(() => {
      window.location.href = STRIPE_CHECKOUT_URL;
    }, 800);
  },

  /**
   * Verifica se l'utente torna da un pagamento riuscito.
   */
  checkPaymentSuccess: (): boolean => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return true;
    }
    return false;
  },

  /**
   * Controlla se l'utente è Pro.
   */
  isUserPro: async (): Promise<boolean> => {
    return localStorage.getItem('vocal-synth-pro-license') === 'active';
  },

  /**
   * Attiva la licenza.
   */
  activatePro: () => {
    localStorage.setItem('vocal-synth-pro-license', 'active');
  }
};
