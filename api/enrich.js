// Vercel Serverless Function - Master Enrichment API
// Performs all enrichment in a single function for efficiency

const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, companyName, industry } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain required' });
    }

    console.log(`Enriching ${domain}...`);

    // Run all enrichments in parallel
    const [linkedin, jobs, techstack, ads, website] = await Promise.all([
      enrichLinkedIn(domain, companyName),
      enrichJobs(domain, companyName),
      enrichTechStack(domain),
      enrichAds(domain, companyName, industry),
      enrichWebsite(domain)
    ]);

    // Aggregate all signals
    const allSignals = [];

    // LinkedIn signals
    if (linkedin.data?.employeeCount) {
      allSignals.push({
        type: 'company_size',
        source: 'linkedin',
        message: `${linkedin.data.employeeCount} employees on LinkedIn`
      });
    }

    // Job signals
    if (jobs.data?.signals) {
      jobs.data.signals.forEach(signal => {
        allSignals.push({ type: 'hiring', source: 'jobs', message: signal });
      });
    }
    if (jobs.data?.rolesHiring?.length > 0) {
      allSignals.push({
        type: 'hiring_roles',
        source: 'jobs',
        message: `Hiring for: ${jobs.data.rolesHiring.join(', ')}`
      });
    }

    // Tech stack signals
    if (techstack.data?.signals) {
      techstack.data.signals.forEach(signal => {
        allSignals.push({ type: 'tech_stack', source: 'techstack', message: signal });
      });
    }

    // Ads signals
    if (ads.data?.signals) {
      ads.data.signals.forEach(signal => {
        allSignals.push({ type: 'advertising', source: 'ads', message: signal });
      });
    }

    // Website signals
    if (website.data?.signals) {
      website.data.signals.forEach(signal => {
        allSignals.push({ type: 'website', source: 'website', message: signal });
      });
    }

    // Calculate overall lead score (0-100)
    let score = 50;
    if (jobs.data?.hiringIntensity === 'high') score += 20;
    else if (jobs.data?.hiringIntensity === 'medium') score += 10;
    else if (jobs.data?.hiringIntensity === 'low') score += 5;
    if (ads.data?.isRunningAds) score += 15;
    if (techstack.data?.totalDetected >= 5) score += 10;
    else if (techstack.data?.totalDetected >= 3) score += 5;
    if (website.data?.contact?.emails?.length > 0) score += 5;
    if (website.data?.contact?.hasScheduling) score += 5;
    if (website.data?.riskScores?.afterHoursRisk) score += 10;
    if (website.data?.riskScores?.responseRiskScore >= 50) score += 10;
    score = Math.min(score, 100);

    // Determine buying intent signals
    const buyingSignals = [];
    if (ads.data?.isRunningAds) {
      buyingSignals.push({ id: 'googlePaidTraffic', label: 'Google Paid Traffic Active', detected: true });
    }
    if (website.data?.riskScores?.afterHoursRisk) {
      buyingSignals.push({ id: 'afterHoursCoverage', label: 'After Hours Coverage Gap', detected: true });
    }
    if (website.data?.riskScores?.responseRiskScore >= 50) {
      buyingSignals.push({ id: 'inboundResponseRisk', label: 'Inbound Response Risk', detected: true });
    }
    if (jobs.data?.hiringIntensity && jobs.data.hiringIntensity !== 'none') {
      buyingSignals.push({ id: 'activelyHiring', label: 'Actively Hiring', detected: true });
    }
    if (techstack.data?.categories?.crm?.length > 0) {
      buyingSignals.push({ id: 'hasCRM', label: 'Uses CRM Software', detected: true });
    }

    // Generate "Why Now" reason
    const whyNowReasons = [];
    if (jobs.data?.hiringIntensity === 'high') whyNowReasons.push('Rapidly expanding team');
    if (ads.data?.adIntensity === 'high') whyNowReasons.push('Heavy ad spend indicates growth investment');
    if (website.data?.riskScores?.afterHoursRisk) whyNowReasons.push('No after-hours coverage - missing leads');
    if (jobs.data?.rolesHiring?.includes('Sales / Account Executive')) whyNowReasons.push('Building sales team - scaling revenue');

    const whyNow = whyNowReasons.length > 0
      ? whyNowReasons.join('. ') + '.'
      : 'Company shows standard growth indicators.';

    return res.status(200).json({
      success: true,
      domain,
      companyName: linkedin.data?.name || companyName || domain,
      score,
      signals: allSignals,
      buyingSignals,
      whyNow,
      enrichment: {
        linkedin: linkedin.found ? linkedin.data : null,
        jobs: jobs.found ? jobs.data : null,
        techstack: techstack.found ? techstack.data : null,
        ads: ads.found ? ads.data : null,
        website: website.found ? website.data : null
      },
      metadata: {
        enrichedAt: new Date().toISOString(),
        sourcesChecked: 5,
        sourcesFound: [linkedin, jobs, techstack, ads, website].filter(s => s.found).length
      }
    });

  } catch (error) {
    console.error('Master enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ==================== LINKEDIN ENRICHMENT ====================
async function enrichLinkedIn(domain, companyName) {
  try {
    const searchQuery = companyName
      ? `site:linkedin.com/company "${companyName}"`
      : `site:linkedin.com/company "${domain.replace(/\.(com|io|co|net|org)$/i, '')}"`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: searchQuery, gl: 'us', hl: 'en', num: 5 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const linkedinResult = (data.organic || []).find(r => r.link?.includes('linkedin.com/company/'));

    if (!linkedinResult) return { found: false, data: null };

    const snippet = linkedinResult.snippet || '';
    const title = linkedinResult.title || '';

    const employeeMatch = snippet.match(/(\d[\d,]*)\s*(?:employees|followers)/i) ||
                          snippet.match(/(\d+[-–]\d+)\s*employees/i);
    const locationMatch = snippet.match(/(?:located in|headquarters in|based in)\s*([^|•\n,]+)/i);
    const foundedMatch = snippet.match(/(?:founded|established|since)\s*(?:in\s*)?(\d{4})/i);

    return {
      found: true,
      data: {
        name: title.replace(/\s*[|\-–].*$/, '').replace(/LinkedIn$/, '').trim(),
        employeeCount: employeeMatch ? employeeMatch[1].replace(/,/g, '') : null,
        location: locationMatch ? locationMatch[1].trim() : null,
        founded: foundedMatch ? foundedMatch[1] : null,
        linkedinUrl: linkedinResult.link,
        linkedinSnippet: snippet
      }
    };
  } catch (error) {
    console.error('LinkedIn enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== JOBS ENRICHMENT ====================
async function enrichJobs(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');
    const searchQuery = `"${company}" jobs hiring`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: searchQuery, gl: 'us', hl: 'en', num: 20 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const organic = data.organic || [];

    const jobBoards = ['indeed.com', 'linkedin.com/jobs', 'glassdoor.com', 'ziprecruiter.com',
                       'monster.com', 'careers.', 'jobs.', 'workday.com', 'greenhouse.io',
                       'lever.co', 'ashbyhq.com'];

    const rolePatterns = {
      'Sales / Account Executive': /\b(sales|account executive|ae|closer)\b/i,
      'Business Development': /\b(business development|bdr|bd rep)\b/i,
      'SDR / BDR': /\b(sdr|bdr|sales development|outbound)\b/i,
      'Marketing': /\b(marketing|growth|demand gen|content)\b/i,
      'Customer Success': /\b(customer success|csm|client success|account manager)\b/i,
      'Engineering': /\b(engineer|developer|software|frontend|backend|fullstack)\b/i,
      'Product': /\b(product manager|product owner|pm)\b/i,
      'Operations': /\b(operations|ops|chief of staff)\b/i
    };

    const jobs = [];
    const rolesHiring = new Set();

    for (const result of organic) {
      const url = result.link || '';
      const title = result.title || '';
      const snippet = result.snippet || '';
      const text = `${title} ${snippet}`.toLowerCase();

      if (jobBoards.some(board => url.toLowerCase().includes(board))) {
        for (const [role, pattern] of Object.entries(rolePatterns)) {
          if (pattern.test(text)) rolesHiring.add(role);
        }
        jobs.push({
          title: title.split(/[|\-–—]/)[0].trim(),
          url,
          source: url.includes('indeed') ? 'Indeed' : url.includes('linkedin') ? 'LinkedIn' : 'Other'
        });
      }
    }

    let hiringIntensity = 'none';
    if (jobs.length >= 10) hiringIntensity = 'high';
    else if (jobs.length >= 5) hiringIntensity = 'medium';
    else if (jobs.length >= 1) hiringIntensity = 'low';

    const signals = [];
    if (rolesHiring.has('Sales / Account Executive') || rolesHiring.has('SDR / BDR')) {
      signals.push('Expanding sales team - likely scaling revenue');
    }
    if (rolesHiring.has('Engineering')) {
      signals.push('Building engineering - likely developing new products');
    }
    if (rolesHiring.has('Marketing')) {
      signals.push('Growing marketing - likely investing in growth');
    }
    if (jobs.length >= 10) {
      signals.push('High hiring volume - company in growth phase');
    }

    return {
      found: jobs.length > 0,
      data: {
        totalJobs: jobs.length,
        hiringIntensity,
        rolesHiring: Array.from(rolesHiring),
        signals,
        recentJobs: jobs.slice(0, 5)
      }
    };
  } catch (error) {
    console.error('Jobs enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== TECH STACK ENRICHMENT ====================
async function enrichTechStack(domain) {
  try {
    let html = '';
    const urls = [`https://${domain}`, `https://www.${domain}`];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          redirect: 'follow'
        });
        if (response.ok) {
          html = await response.text();
          break;
        }
      } catch { continue; }
    }

    if (!html) return { found: false, data: null };

    const techPatterns = {
      'HubSpot': [/hubspot/i, /hs-scripts\.com/i, /hsforms/i],
      'Salesforce': [/salesforce/i, /force\.com/i],
      'Intercom': [/intercom/i, /widget\.intercom\.io/i],
      'Drift': [/drift\.com/i, /driftt/i],
      'Zendesk': [/zendesk/i, /zdassets/i],
      'Google Analytics': [/google-analytics/i, /gtag/i, /googletagmanager/i],
      'Segment': [/segment\.com/i, /cdn\.segment/i],
      'Mixpanel': [/mixpanel/i],
      'Hotjar': [/hotjar/i],
      'Stripe': [/stripe\.com/i, /js\.stripe/i],
      'Shopify': [/shopify/i, /cdn\.shopify/i],
      'Calendly': [/calendly/i],
      'Chili Piper': [/chilipiper/i],
      'Typeform': [/typeform/i],
      'WordPress': [/wp-content/i, /wordpress/i],
      'Webflow': [/webflow/i]
    };

    const crmTools = ['HubSpot', 'Salesforce', 'Intercom', 'Drift', 'Zendesk'];
    const analyticsTools = ['Google Analytics', 'Segment', 'Mixpanel', 'Hotjar'];
    const detected = [];

    for (const [tech, patterns] of Object.entries(techPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          if (!detected.includes(tech)) detected.push(tech);
          break;
        }
      }
    }

    const signals = [];
    if (detected.some(t => crmTools.includes(t))) {
      signals.push('Uses enterprise CRM - likely has structured sales process');
    }
    if (detected.some(t => ['Intercom', 'Drift', 'Zendesk'].includes(t))) {
      signals.push('Has live chat - values real-time customer engagement');
    }
    if (detected.includes('Stripe')) {
      signals.push('Online payments enabled - transactional business');
    }
    if (detected.some(t => ['Calendly', 'Chili Piper'].includes(t))) {
      signals.push('Uses scheduling tools - likely has sales/demo process');
    }

    return {
      found: detected.length > 0,
      data: {
        technologies: detected,
        categories: {
          crm: detected.filter(t => crmTools.includes(t)),
          analytics: detected.filter(t => analyticsTools.includes(t))
        },
        signals,
        totalDetected: detected.length
      }
    };
  } catch (error) {
    console.error('Tech stack enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== ADS ENRICHMENT ====================
async function enrichAds(domain, companyName, industry) {
  try {
    const brandName = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: brandName, gl: 'us', hl: 'en', num: 10 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const paidAds = data.ads || [];

    const adsForDomain = paidAds.filter(ad =>
      ad.link && ad.link.toLowerCase().includes(domain.toLowerCase())
    );

    let adIntensity = 'none';
    if (adsForDomain.length >= 3) adIntensity = 'high';
    else if (adsForDomain.length >= 1) adIntensity = 'medium';

    const signals = [];
    if (adsForDomain.length > 0) {
      signals.push('Running brand protection ads - protecting their brand name');
    }
    if (adsForDomain.length >= 3) {
      signals.push('Heavy ad spend detected - significant marketing budget');
    }
    if (adsForDomain.length === 0) {
      signals.push('No Google Ads detected - may rely on organic/referral traffic');
    }

    return {
      found: adsForDomain.length > 0,
      data: {
        isRunningAds: adsForDomain.length > 0,
        adIntensity,
        totalAdsFound: adsForDomain.length,
        signals,
        adCopy: adsForDomain.slice(0, 3).map(ad => ({
          title: ad.title,
          description: ad.description,
          url: ad.link
        }))
      }
    };
  } catch (error) {
    console.error('Ads enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== WEBSITE ENRICHMENT ====================
async function enrichWebsite(domain) {
  try {
    let html = '';
    let finalUrl = '';
    const urls = [`https://${domain}`, `https://www.${domain}`];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          redirect: 'follow'
        });
        if (response.ok) {
          html = await response.text();
          finalUrl = response.url;
          break;
        }
      } catch { continue; }
    }

    if (!html) return { found: false, data: null };

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [...new Set(html.match(emailRegex) || [])].filter(email =>
      !email.includes('example.') && !email.includes('.png') && !email.includes('.jpg')
    );

    // Extract phones
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = [...new Set(html.match(phoneRegex) || [])];

    // Check features
    const hasContactForm = /contact.*form|form.*contact|<form[^>]*contact/i.test(html);
    const hasChatWidget = /intercom|drift|zendesk|tawk|crisp|livechat|hubspot.*chat/i.test(html);
    const hasScheduling = /calendly|chili\s*piper|savvycal|book.*demo|schedule.*call/i.test(html);
    const hasPricing = /pricing|plans|packages|\/pricing/i.test(html);
    const hasFreeTrial = /free\s*trial|start\s*free|try\s*free|request.*demo/i.test(html);

    // Meta info
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

    // Signals
    const signals = [];
    const afterHoursRisk = !hasChatWidget && hasContactForm;

    if (hasContactForm && !hasChatWidget) {
      signals.push('Contact form only - no live chat (After Hours Coverage Gap)');
    }
    if (hasChatWidget) signals.push('Has live chat widget - values immediate response');
    if (hasScheduling) signals.push('Has demo/meeting scheduling - active sales process');
    if (hasFreeTrial) signals.push('Offers free trial/demo - product-led growth');
    if (emails.length > 0) signals.push(`Found ${emails.length} email(s) on website`);
    if (phones.length > 0) signals.push(`Found ${phones.length} phone number(s) on website`);

    // Response risk score
    let responseRisk = 0;
    if (!hasChatWidget) responseRisk += 30;
    if (!hasScheduling) responseRisk += 20;
    if (hasContactForm) responseRisk += 10;
    if (emails.length === 0 && phones.length === 0) responseRisk += 20;

    return {
      found: true,
      data: {
        contact: {
          emails: emails.slice(0, 5),
          phones: phones.slice(0, 3),
          hasContactForm,
          hasChatWidget,
          hasScheduling
        },
        features: { hasPricing, hasFreeTrial },
        content: {
          pageTitle: titleMatch ? titleMatch[1].trim() : null,
          metaDescription: metaMatch ? metaMatch[1] : null
        },
        signals,
        riskScores: {
          afterHoursRisk,
          responseRiskScore: Math.min(responseRisk, 100)
        }
      }
    };
  } catch (error) {
    console.error('Website enrichment error:', error);
    return { found: false, error: error.message };
  }
}
