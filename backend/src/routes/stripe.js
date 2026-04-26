import express from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.js';
import supabase from '../lib/supabase.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

// Create checkout session
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users').select('email, stripe_customer_id').eq('id', req.user.id).single();

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
      metadata: { user_id: req.user.id }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create portal session
router.post('/portal', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users').select('stripe_customer_id').eq('id', req.user.id).single();

    if (!user.stripe_customer_id)
      return res.status(400).json({ error: 'No subscription found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.user_id;
      await supabase.from('users').update({
        plan: 'pro',
        stripe_subscription_id: session.subscription,
        message_count: 0
      }).eq('id', userId);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const { data: user } = await supabase
        .from('users').select('id').eq('stripe_subscription_id', sub.id).single();
      if (user) {
        await supabase.from('users').update({ plan: 'free', stripe_subscription_id: null }).eq('id', user.id);
      }
      break;
    }
  }

  res.json({ received: true });
});

export default router;
