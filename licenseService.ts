
export const licenseService = {
  isUserPro: async () => localStorage.getItem('vocal-synth-pro') === 'active',
  activatePro: () => localStorage.setItem('vocal-synth-pro', 'active'),
  redirectToPayment: () => window.location.href = 'https://buy.stripe.com/3cI4gA03A8LZ2hnb4zfrW00'
};
