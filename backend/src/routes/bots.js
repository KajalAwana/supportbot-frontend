import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/* ---------------------------------------------
   PUBLIC ROUTE — MUST COME FIRST
   /api/bots/embed/:embed_key
---------------------------------------------- */
router.get('/embed/:embed_key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('id, business_name, welcome_message, theme_color, faqs, instructions')
      .eq('embed_key', req.params.embed_key)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.json({ bot: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bot' });
  }
});

/* ---------------------------------------------
   AUTHENTICATED ROUTES
---------------------------------------------- */

// Get all bots for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bots: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Get single bot
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.json({ bot: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bot' });
  }
});

// Create bot
router.post('/', authenticate, async (req, res) => {
  const { business_name, faqs, instructions, theme_color, welcome_message } = req.body;

  if (!business_name) {
    return res.status(400).json({ error: 'Business name required' });
  }

  try {
    // Check plan limits
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', req.user.id)
      .single();

    const { count } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (user.plan === 'free' && count >= 1) {
      return res.status(403).json({ error: 'Free plan limited to 1 bot. Upgrade to Pro.' });
    }

    const embed_key = uuidv4();

    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        user_id: req.user.id,
        business_name,
        faqs: faqs || [],
        instructions: instructions || '',
        theme_color: theme_color || '#6366f1',
        welcome_message: welcome_message || `Hi! I'm ${business_name}'s support bot. How can I help?`,
        embed_key,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ bot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// Update bot
router.put('/:id', authenticate, async (req, res) => {
  const { business_name, faqs, instructions, theme_color, welcome_message } = req.body;

  try {
    const { data: existing } = await supabase
      .from('bots')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const { data: bot, error } = await supabase
      .from('bots')
      .update({ business_name, faqs, instructions, theme_color, welcome_message })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ bot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bot' });
  }
});

// Delete bot
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

export default router;
