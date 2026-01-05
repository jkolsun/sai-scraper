// Vercel Serverless Function - Tech Stack Detection
// Detects technologies used by a company's website

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

    // Fetch the website HTML
    const url = `https://${domain}`;
    let html = '';

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'follow',
        timeout: 10000
      });
      html = await response.text();
    } catch (fetchError) {
      // Try with www
      try {
        const wwwResponse = await fetch(`https://www.${domain}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow',
          timeout: 10000
        });
        html = await wwwResponse.text();
      } catch {
        return res.status(200).json({
          found: false,
          domain,
          error: 'Could not fetch website',
          data: null
        });
      }
    }

    // Detect technologies from HTML
    const detectedTech = [];
    const techSignals = [];

    // CRM & Marketing Automation
    const crmPatterns = {
      'HubSpot': [/hubspot/i, /hs-scripts\.com/i, /hsforms/i, /hbspt/i],
      'Salesforce': [/salesforce/i, /force\.com/i, /pardot/i],
      'Marketo': [/marketo/i, /munchkin/i],
      'Pardot': [/pardot/i, /pi\.pardot/i],
      'ActiveCampaign': [/activecampaign/i],
      'Mailchimp': [/mailchimp/i, /mc\.us/i],
      'Klaviyo': [/klaviyo/i],
      'Intercom': [/intercom/i, /widget\.intercom\.io/i],
      'Drift': [/drift\.com/i, /driftt/i],
      'Zendesk': [/zendesk/i, /zdassets/i],
      'Freshdesk': [/freshdesk/i, /freshworks/i],
      'Crisp': [/crisp\.chat/i],
      'Tidio': [/tidio/i],
      'LiveChat': [/livechat/i, /livechatinc/i]
    };

    // Analytics & Tracking
    const analyticsPatterns = {
      'Google Analytics': [/google-analytics/i, /gtag/i, /googletagmanager/i, /ga\.js/i, /analytics\.js/i],
      'Google Tag Manager': [/googletagmanager/i, /gtm\.js/i],
      'Segment': [/segment\.com/i, /analytics\.js/i, /cdn\.segment/i],
      'Mixpanel': [/mixpanel/i],
      'Amplitude': [/amplitude/i],
      'Hotjar': [/hotjar/i, /static\.hotjar/i],
      'FullStory': [/fullstory/i],
      'Heap': [/heap\.io/i, /heapanalytics/i],
      'Crazy Egg': [/crazyegg/i],
      'Lucky Orange': [/luckyorange/i],
      'Microsoft Clarity': [/clarity\.ms/i]
    };
    
    // E-commerce & Payments
    const ecomPatterns = {
      'Shopify': [/shopify/i, /cdn\.shopify/i],
      'WooCommerce': [/woocommerce/i, /wc-/i],
      'Magento': [/magento/i, /mage\//i],
      'BigCommerce': [/bigcommerce/i],
      'Stripe': [/stripe\.com/i, /js\.stripe/i],
      'PayPal': [/paypal/i],
      'Square': [/squareup/i, /square\.com/i]
    };

    // Scheduling & Forms
    const toolPatterns = {
      'Calendly': [/calendly/i],
      'Chili Piper': [/chilipiper/i],
      'SavvyCal': [/savvycal/i],
      'Typeform': [/typeform/i],
      'JotForm': [/jotform/i],
      'Formstack': [/formstack/i],
      'Webflow': [/webflow/i],
      'WordPress': [/wp-content/i, /wordpress/i],
      'Wix': [/wix\.com/i, /wixstatic/i],
      'Squarespace': [/squarespace/i]
    };

    // Chat & Support
    const chatPatterns = {
      'Intercom': [/intercom/i],
      'Drift': [/drift/i],
      'Zendesk Chat': [/zopim/i, /zendesk.*chat/i],
      'Freshchat': [/freshchat/i],
      'Olark': [/olark/i],
      'Tawk.to': [/tawk\.to/i]
    };

    // Check all patterns
    const allPatterns = { ...crmPatterns, ...analyticsPatterns, ...ecomPatterns, ...toolPatterns, ...chatPatterns };

    for (const [tech, patterns] of Object.entries(allPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          if (!detectedTech.includes(tech)) {
            detectedTech.push(tech);
          }
          break;
        }
      }
    }

    // Generate signals based on tech stack
    if (detectedTech.some(t => ['HubSpot', 'Salesforce', 'Marketo', 'Pardot'].includes(t))) {
      techSignals.push('Uses enterprise CRM - likely has structured sales process');
    }
    if (detectedTech.some(t => ['Intercom', 'Drift', 'Zendesk Chat'].includes(t))) {
      techSignals.push('Has live chat - values real-time customer engagement');
    }
    if (detectedTech.some(t => ['Stripe', 'PayPal'].includes(t))) {
      techSignals.push('Online payments enabled - transactional business');
    }
    if (detectedTech.some(t => ['Calendly', 'Chili Piper'].includes(t))) {
      techSignals.push('Uses scheduling tools - likely has sales/demo process');
    }
    if (detectedTech.some(t => ['Segment', 'Mixpanel', 'Amplitude'].includes(t))) {
      techSignals.push('Advanced analytics - data-driven organization');
    }
    if (detectedTech.some(t => ['Hotjar', 'FullStory', 'Crazy Egg'].includes(t))) {
      techSignals.push('Uses session recording - focused on UX optimization');
    }
    if (detectedTech.some(t => ['Shopify', 'WooCommerce', 'Magento'].includes(t))) {
      techSignals.push('E-commerce platform detected');
    }

    // Categorize detected tech
    const categories = {
      crm: detectedTech.filter(t => Object.keys(crmPatterns).includes(t)),
      analytics: detectedTech.filter(t => Object.keys(analyticsPatterns).includes(t)),
      ecommerce: detectedTech.filter(t => Object.keys(ecomPatterns).includes(t)),
      tools: detectedTech.filter(t => Object.keys(toolPatterns).includes(t)),
      chat: detectedTech.filter(t => Object.keys(chatPatterns).includes(t))
    };

    return res.status(200).json({
      found: detectedTech.length > 0,
      domain,
      data: {
        technologies: detectedTech,
        categories,
        signals: techSignals,
        totalDetected: detectedTech.length
      }
    });

  } catch (error) {
    console.error('Tech stack enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
