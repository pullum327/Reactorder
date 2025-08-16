import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from './config';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

export default stripePromise;
