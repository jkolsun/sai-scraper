// Vercel Serverless Function - Website Scraping & Analysis
// Extracts contact info, forms, and buying signals from company websites

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain required' });
    }

    // Fetch the website
    let html = '';
    let finalUrl = '';

    const urls = [`https://${domain}`, `https://www.${domain}`, `http://${domain}`];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow'
        });
        if (response.ok) {
          html = await response.text();
          finalUrl = response.url;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!html) {
      return res.status(200).json({
        found: false,
        domain,
        error: 'Could not fetch website',
        data: null
      });
    }

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(html.match(emailRegex) || [])].filter(email =>
      !email.includes('example.com') &&
      !email.includes('domain.com') &&
      !email.includes('email.com') &&
      !email.includes('.png') &&
      !email.includes('.jpg')
    );

    // Extract phone numbers
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = [...new Set(html.match(phoneRegex) || [])];

    // Check for contact forms
    const hasContactForm = /contact.*form|form.*contact|<form[^>]*contact|name=["']?(?:contact|email|message)/i.test(html);

    // Check for chat widgets
    const hasChatWidget = /intercom|drift|zendesk|tawk|crisp|livechat|hubspot.*chat|freshchat/i.test(html);

    // Check for scheduling/booking
    const hasScheduling = /calendly|chili\s*piper|savvycal|acuity|book.*demo|schedule.*call|book.*meeting/i.test(html);

    // Check for pricing page
    const hasPricing = /pricing|plans|packages|subscription|\/pricing/i.test(html);

    // Check for free trial/demo
    const hasFreeTrial = /free\s*trial|start\s*free|try\s*free|get\s*started\s*free|request.*demo|book.*demo/i.test(html);

    // Check social links
    const socialLinks = {
      linkedin: /linkedin\.com\/company/i.test(html),
      twitter: /twitter\.com\/|x\.com\//i.test(html),
      facebook: /facebook\.com\//i.test(html),
      instagram: /instagram\.com\//i.test(html),
      youtube: /youtube\.com\//i.test(html)
    };

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDescription = metaMatch ? metaMatch[1] : null;

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : null;

    // Check for "After Hours" signals - no live chat, delayed response indicators
    const afterHoursRisk = !hasChatWidget && hasContactForm;

    // Generate signals
    const signals = [];

    if (hasContactForm && !hasChatWidget) {
      signals.push('Contact form only - no live chat (After Hours Coverage Gap)');
    }
    if (hasChatWidget) {
      signals.push('Has live chat widget - values immediate response');
    }
    if (hasScheduling) {
      signals.push('Has demo/meeting scheduling - active sales process');
    }
    if (hasFreeTrial) {
      signals.push('Offers free trial/demo - product-led growth');
    }
    if (hasPricing) {
      signals.push('Public pricing available - transparent sales model');
    }
    if (emails.length > 0) {
      signals.push(`Found ${emails.length} email(s) on website`);
    }
    if (phones.length > 0) {
      signals.push(`Found ${phones.length} phone number(s) on website`);
    }

    // Calculate response risk score (higher = more risk of slow response)
    let responseRisk = 0;
    if (!hasChatWidget) responseRisk += 30;
    if (!hasScheduling) responseRisk += 20;
    if (hasContactForm) responseRisk += 10; // Forms often have delayed responses
    if (emails.length === 0 && phones.length === 0) responseRisk += 20;

    return res.status(200).json({
      found: true,
      domain,
      finalUrl,
      data: {
        contact: {
          emails: emails.slice(0, 5),
          phones: phones.slice(0, 3),
          hasContactForm,
          hasChatWidget,
          hasScheduling
        },
        features: {
          hasPricing,
          hasFreeTrial,
          socialLinks
        },
        content: {
          pageTitle,
          metaDescription
        },
        signals,
        riskScores: {
          afterHoursRisk,
          responseRiskScore: Math.min(responseRisk, 100)
        }
      }
    });

  } catch (error) {
    console.error('Website enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
