// Vercel serverless function: keeps the Gemini API key on the server, never in the browser.
// Set GEMINI_API_KEY (and optionally GEMINI_MODEL) in Vercel > Settings > Environment Variables.
const hits = {};
let good = null; // remembers the model name that worked
module.exports = async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ ready: !!key });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!key) return res.status(503).json({ error: 'AI is not configured' });
  // very small per-IP limit (best effort) to protect the free quota
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const minute = Math.floor(Date.now() / 60000);
  const h = hits[ip] && hits[ip].m === minute ? hits[ip] : (hits[ip] = { m: minute, n: 0 });
  if (++h.n > 60) return res.status(429).json({ error: 'too many requests' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(body).length > 1500000) return res.status(413).json({ error: 'too large' });
    // try the configured model first, then fall back if a model name is not found
    const list = [good, process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
      .filter((m, i, a) => m && a.indexOf(m) === i);
    let last = null;
    for (const model of list) {
      const call = (b) => fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(b),
      });
      // faster answers: low thinking for Gemini 3 models, none for 2.5 flash; retry plain if rejected
      const fast = JSON.parse(JSON.stringify(body));
      fast.generationConfig = fast.generationConfig || {};
      if (/^gemini-3/.test(model)) fast.generationConfig.thinkingConfig = { thinkingLevel: 'low' };
      else if (/^gemini-2\.5-flash$/.test(model)) fast.generationConfig.thinkingConfig = { thinkingBudget: 0 };
      let r = await call(fast);
      if (r.status === 400) r = await call(body);
      const text = await r.text();
      if (r.status === 404 || r.status === 429) { last = { status: r.status, text }; continue; } // another model has its own quota
      if (r.ok) good = model;
      return res.status(r.status).setHeader('Content-Type', 'application/json').setHeader('X-Model', model).send(text);
    }
    // every guess failed: ask Google which models this key can use, and try those
    if (last && last.status === 404) {
      try {
        const lr = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
        const lj = await lr.json();
        const names = (lj.models || [])
          .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini-[\d.]+-flash/.test(m.name) && !/image|tts|live|audio|thinking|embedding|robotics|computer/.test(m.name))
          .map((m) => m.name.replace('models/', ''))
          .sort((x, y) => (/preview|exp|lite/.test(x) - /preview|exp|lite/.test(y)) || (parseFloat(y.match(/[\d.]+/)[0]) - parseFloat(x.match(/[\d.]+/)[0])))
          .filter((n) => list.indexOf(n) < 0)
          .slice(0, 3);
        for (const model of names) {
          const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body),
          });
          const text = await r.text();
          if (r.status === 404 || r.status === 429) { last = { status: r.status, text }; continue; }
          if (r.ok) good = model;
          return res.status(r.status).setHeader('Content-Type', 'application/json').setHeader('X-Model', model).send(text);
        }
      } catch (e) { /* fall through */ }
    }
    return res.status(last ? last.status : 502).setHeader('Content-Type', 'application/json').send(last ? last.text : '{"error":"no model available"}');
  } catch (e) {
    res.status(502).json({ error: 'AI request failed' });
  }
};
