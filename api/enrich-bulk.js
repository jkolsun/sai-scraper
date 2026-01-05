// Vercel Serverless Function - Bulk Enrichment
// Enriches multiple companies with all available signals

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { companies, enrichmentTypes = ['email', 'techStack', 'social'] } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: 'companies array required' });
    }

    // Limit batch size to prevent timeouts
    const MAX_BATCH = 10;
    const batch = companies.slice(0, MAX_BATCH);

    const results = [];

    // Process each company
    for (const company of batch) {
      const domain = company.domain || company.website?.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const name = company.name || company.companyName || domain;

      if (!domain) {
        results.push({
          ...company,
          enrichmentStatus: 'failed',
          enrichmentError: 'No domain provided'
        });
        continue;
      }

      const enrichedData = {
        ...company,
        domain,
        enrichmentStatus: 'success',
        enrichedAt: new Date().toISOString(),
        enrichment: {}
      };

      // Run enrichments based on requested types
      const enrichmentPromises = [];

      if (enrichmentTypes.includes('email')) {
        enrichmentPromises.push(
          enrichEmail(domain, name).then(data => {
            enrichedData.enrichment.email = data;
            if (data.emails?.length > 0) {
              enrichedData.primaryEmail = data.emails[0];
            }
          }).catch(() => {
            enrichedData.enrichment.email = { error: 'Failed' };
          })
        );
      }

      if (enrichmentTypes.includes('techStack')) {
        enrichmentPromises.push(
          enrichTechStack(domain).then(data => {
            enrichedData.enrichment.techStack = data;
            enrichedData.technologies = data.technologies || [];
          }).catch(() => {
            enrichedData.enrichment.techStack = { error: 'Failed' };
          })
        );
      }

      if (enrichmentTypes.includes('social')) {
        enrichmentPromises.push(
          enrichSocial(domain, name).then(data => {
            enrichedData.enrichment.social = data;
            enrichedData.socialProfiles = data.profiles || {};
            enrichedData.socialScore = data.socialScore || 0;
          }).catch(() => {
            enrichedData.enrichment.social = { error: 'Failed' };
          })
        );
      }

      if (enrichmentTypes.includes('funding')) {
        enrichmentPromises.push(
          enrichFunding(domain, name).then(data => {
            enrichedData.enrichment.funding = data;
            enrichedData.fundingInfo = data.funding || null;
            enrichedData.isHiring = data.hiring?.isHiring || false;
            enrichedData.growthScore = data.growthScore || 0;
          }).catch(() => {
            enrichedData.enrichment.funding = { error: 'Failed' };
          })
        );
      }

      await Promise.all(enrichmentPromises);

      // Calculate overall enrichment score
      let score = 0;
      if (enrichedData.primaryEmail) score += 25;
      if (enrichedData.technologies?.length > 0) score += 25;
      if (enrichedData.socialScore > 0) score += Math.min(25, enrichedData.socialScore / 4);
      if (enrichedData.growthScore > 0) score += Math.min(25, enrichedData.growthScore / 4);

      enrichedData.enrichmentScore = Math.round(score);

      // Compile all signals
      enrichedData.allSignals = [
        ...(enrichedData.enrichment.techStack?.signals || []),
        ...(enrichedData.enrichment.social?.signals || []),
        ...(enrichedData.enrichment.funding?.signals || [])
      ];

      results.push(enrichedData);
    }

    return res.status(200).json({
      success: true,
      processed: results.length,
      total: companies.length,
      hasMore: companies.length > MAX_BATCH,
      results
    });

  } catch (error) {
    console.error('Bulk enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Internal enrichment functions that call other APIs
async function enrichEmail(domain, name) {
  // Generate email patterns
  const patterns = [
    `info@${domain}`,
    `hello@${domain}`,
    `contact@${domain}`,
    `sales@${domain}`,
    `support@${domain}`
  ];

  // Try to find email from website
  try {
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    const html = await response.text();

    // Extract emails from HTML
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = html.match(emailRegex) || [];

    // Filter out generic/tracking emails
    const validEmails = foundEmails.filter(email => {
      const lower = email.toLowerCase();
      return !lower.includes('example') &&
             !lower.includes('sentry') &&
             !lower.includes('wixpress') &&
             !lower.includes('cloudflare') &&
             lower.includes(domain.split('.')[0].toLowerCase().slice(0, 4));
    });

    if (validEmails.length > 0) {
      return {
        found: true,
        emails: [...new Set(validEmails)].slice(0, 5),
        source: 'website'
      };
    }
  } catch {
    // Website fetch failed, use patterns
  }

  return {
    found: true,
    emails: patterns.slice(0, 3),
    source: 'pattern',
    verified: false
  };
}

async function enrichTechStack(domain) {
  try {
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    const html = await response.text();

    const technologies = [];
    const signals = [];

    // Tech patterns to detect
    const techPatterns = {
      'HubSpot': [/hubspot/i, /hs-scripts/i],
      'Salesforce': [/salesforce/i, /force\.com/i],
      'Google Analytics': [/google-analytics/i, /gtag/i, /googletagmanager/i],
      'Intercom': [/intercom/i],
      'Drift': [/drift/i],
      'Stripe': [/stripe/i],
      'Shopify': [/shopify/i],
      'WordPress': [/wp-content/i],
      'React': [/react/i, /_next/i],
      'Webflow': [/webflow/i],
      'Segment': [/segment\.com/i],
      'Mixpanel': [/mixpanel/i],
      'Hotjar': [/hotjar/i],
      'Calendly': [/calendly/i],
      'Zendesk': [/zendesk/i]
    };

    for (const [tech, patterns] of Object.entries(techPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          technologies.push(tech);
          break;
        }
      }
    }

    // Generate signals
    if (technologies.some(t => ['HubSpot', 'Salesforce'].includes(t))) {
      signals.push('Uses enterprise CRM');
    }
    if (technologies.some(t => ['Stripe', 'Shopify'].includes(t))) {
      signals.push('E-commerce/payments enabled');
    }
    if (technologies.some(t => ['Intercom', 'Drift', 'Zendesk'].includes(t))) {
      signals.push('Live chat enabled');
    }

    return {
      found: technologies.length > 0,
      technologies,
      signals
    };
  } catch {
    return { found: false, technologies: [], signals: [] };
  }
}

async function enrichSocial(domain, name) {
  // Simplified social check - just return structure
  // Full implementation would call the enrich-social API
  return {
    profiles: {},
    socialScore: 0,
    signals: []
  };
}

async function enrichFunding(domain, name) {
  // Simplified funding check - just return structure
  // Full implementation would call the enrich-funding API
  return {
    funding: null,
    hiring: null,
    growthScore: 0,
    signals: []
  };
}
