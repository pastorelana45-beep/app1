
export const licenseService = {
  /**
   * Verifica se l'utente ha sbloccato la versione Pro.
   */
  isUserPro: async (): Promise<boolean> => {
    return localStorage.getItem('vocal-synth-pro') === 'active';
  },

  /**
   * Attiva la licenza localmente.
   */
  activatePro: () => {
    localStorage.setItem('vocal-synth-pro', 'active');
    window.location.reload();
  },

  /**
   * Redirige l'utente alla pagina di pagamento Stripe.
   */
  redirectToPayment: () => {
    window.location.href = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00';
  }
};
