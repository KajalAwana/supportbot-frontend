import express from 'express';
import OpenAI from 'openai';
import supabase from '../lib/supabase.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log("chaaaaaa", openai);

const FREE_LIMIT = 100;
const PRO_LIMIT = 5000;

// POST /api/chat/:embed_key
router.post('/:embed_key', async (req, res) => {
  const { message, conversation_history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    // Fetch bot config
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, business_name, faqs, instructions, welcome_message, user_id')
      .eq('embed_key', req.params.embed_key)
      .eq('is_active', true)
      .single();

    if (botError || !bot) return res.status(404).json({ error: 'Bot not found' });

    // Fetch user and check limits
    const { data: user } = await supabase
      .from('users')
      .select('plan, message_count')
      .eq('id', bot.user_id)
      .single();

    const limit = user.plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;
    if (user.message_count >= limit) {
      return res.status(429).json({
        error: 'Message limit reached',
        reply: "I'm sorry, this bot has reached its message limit for the month. Please contact the business directly."
      });
    }

    // Build FAQ context
    const faqContext = bot.faqs?.length
      ? `FAQs for ${bot.business_name}:\n` + bot.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
      : '';

    // Build system prompt
    const systemPrompt = `You are a customer support bot for ${bot.business_name}.
${bot.instructions ? `Tone/Style: ${bot.instructions}` : 'Be friendly, concise, and helpful.'}

${faqContext}

Rules:
- Answer questions about ${bot.business_name} based on the FAQs above
- For unknown questions, give a helpful general response and suggest contacting the business directly
- Keep responses SHORT (2-4 sentences max)
- Never make up specific business details not in the FAQs
- If asked something off-topic, gently redirect to business support
- Do NOT say you are an AI or mention OpenAI`;

    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.slice(-6), // last 3 turns
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;

    // Increment message count
    await supabase
      .from('users')
      .update({ message_count: user.message_count + 1 })
      .eq('id', bot.user_id);

    // Log message
    await supabase.from('messages').insert({
      bot_id: bot.id,
      user_message: message,
      bot_reply: reply
    });

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed', reply: 'Sorry, I\'m having trouble right now. Please try again.' });
  }
});

export default router;
