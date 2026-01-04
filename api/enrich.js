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

    // Run all enrichments in parallel - 13 data sources
    const [linkedin, jobs, techstack, ads, website, funding, news, reviews, social, contacts, intent, competitors, webTraffic] = await Promise.all([
      enrichLinkedIn(domain, companyName),
      enrichJobs(domain, companyName),
      enrichTechStack(domain),
      enrichAds(domain, companyName, industry),
      enrichWebsite(domain),
      enrichFunding(domain, companyName),
      enrichNews(domain, companyName),
      enrichReviews(domain, companyName),
      enrichSocial(domain, companyName),
      enrichContacts(domain, companyName),
      enrichIntent(domain, companyName, industry),
      enrichCompetitors(domain, companyName, industry),
      enrichWebTraffic(domain)
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

    // Funding signals
    if (funding.data?.signals) {
      funding.data.signals.forEach(signal => {
        allSignals.push({ type: 'funding', source: 'funding', message: signal });
      });
    }

    // News signals
    if (news.data?.signals) {
      news.data.signals.forEach(signal => {
        allSignals.push({ type: 'news', source: 'news', message: signal });
      });
    }

    // Review signals
    if (reviews.data?.signals) {
      reviews.data.signals.forEach(signal => {
        allSignals.push({ type: 'reviews', source: 'reviews', message: signal });
      });
    }

    // Social signals
    if (social.data?.signals) {
      social.data.signals.forEach(signal => {
        allSignals.push({ type: 'social', source: 'social', message: signal });
      });
    }

    // Contact signals
    if (contacts.data?.signals) {
      contacts.data.signals.forEach(signal => {
        allSignals.push({ type: 'contacts', source: 'contacts', message: signal });
      });
    }

    // Intent signals
    if (intent.data?.signals) {
      intent.data.signals.forEach(signal => {
        allSignals.push({ type: 'intent', source: 'intent', message: signal });
      });
    }

    // Competitor signals
    if (competitors.data?.signals) {
      competitors.data.signals.forEach(signal => {
        allSignals.push({ type: 'competitors', source: 'competitors', message: signal });
      });
    }

    // Web traffic signals
    if (webTraffic.data?.signals) {
      webTraffic.data.signals.forEach(signal => {
        allSignals.push({ type: 'webTraffic', source: 'webTraffic', message: signal });
      });
    }

    // Calculate overall lead score (0-100)
    let score = 30; // Start at 30 to allow more room for signals
    if (jobs.data?.hiringIntensity === 'high') score += 15;
    else if (jobs.data?.hiringIntensity === 'medium') score += 8;
    else if (jobs.data?.hiringIntensity === 'low') score += 4;
    if (ads.data?.isRunningAds) score += 10;
    if (techstack.data?.totalDetected >= 5) score += 8;
    else if (techstack.data?.totalDetected >= 3) score += 4;
    if (website.data?.contact?.emails?.length > 0) score += 3;
    if (website.data?.contact?.hasScheduling) score += 4;
    if (website.data?.riskScores?.afterHoursRisk) score += 8;
    if (website.data?.riskScores?.responseRiskScore >= 50) score += 6;
    // New signal scoring
    if (funding.data?.hasRecentFunding) score += 15; // Recent funding is high-value
    if (funding.data?.totalRaised) score += 5;
    if (news.data?.recentNewsCount >= 3) score += 8;
    else if (news.data?.recentNewsCount >= 1) score += 4;
    if (reviews.data?.hasG2Profile) score += 6;
    if (reviews.data?.hasCapterraProfile) score += 4;
    if (reviews.data?.avgRating >= 4) score += 5;
    if (social.data?.isActive) score += 5;
    if (social.data?.hasLinkedIn) score += 3;
    // Contact scoring
    if (contacts.data?.decisionMakers?.length >= 3) score += 12;
    else if (contacts.data?.decisionMakers?.length >= 1) score += 6;
    if (contacts.data?.hasVerifiedEmails) score += 5;
    // Intent scoring
    if (intent.data?.intentScore === 'high') score += 15;
    else if (intent.data?.intentScore === 'medium') score += 8;
    if (intent.data?.recentJobChanges) score += 6;
    if (intent.data?.expandingDepartments?.length > 0) score += 5;
    // Competitor scoring
    if (competitors.data?.usingCompetitorProducts) score += 8;
    if (competitors.data?.recentCompetitorMentions) score += 4;
    // Web traffic scoring
    if (webTraffic.data?.trafficTrend === 'growing') score += 8;
    else if (webTraffic.data?.trafficTrend === 'stable') score += 3;
    if (webTraffic.data?.monthlyVisits >= 100000) score += 6;
    else if (webTraffic.data?.monthlyVisits >= 10000) score += 3;
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
    // New buying signals
    if (funding.data?.hasRecentFunding) {
      buyingSignals.push({ id: 'recentFunding', label: 'Recent Funding Round', detected: true });
    }
    if (news.data?.recentNewsCount >= 2) {
      buyingSignals.push({ id: 'activeNews', label: 'Active in News/PR', detected: true });
    }
    if (reviews.data?.hasG2Profile || reviews.data?.hasCapterraProfile) {
      buyingSignals.push({ id: 'b2bPresence', label: 'B2B Review Site Presence', detected: true });
    }
    if (social.data?.isActive) {
      buyingSignals.push({ id: 'socialActive', label: 'Active Social Media', detected: true });
    }
    // Advanced buying signals
    if (contacts.data?.decisionMakers?.length > 0) {
      buyingSignals.push({ id: 'decisionMakersFound', label: 'Decision Makers Identified', detected: true });
    }
    if (intent.data?.intentScore === 'high') {
      buyingSignals.push({ id: 'highIntent', label: 'High Buying Intent', detected: true });
    }
    if (intent.data?.recentJobChanges) {
      buyingSignals.push({ id: 'leadershipChange', label: 'Recent Leadership Change', detected: true });
    }
    if (competitors.data?.usingCompetitorProducts) {
      buyingSignals.push({ id: 'competitorUser', label: 'Uses Competitor Products', detected: true });
    }
    if (webTraffic.data?.trafficTrend === 'growing') {
      buyingSignals.push({ id: 'trafficGrowth', label: 'Website Traffic Growing', detected: true });
    }

    // Generate "Why Now" reason
    const whyNowReasons = [];
    if (funding.data?.hasRecentFunding) whyNowReasons.push(`Recent ${funding.data.fundingRound || 'funding'} - flush with capital`);
    if (intent.data?.intentScore === 'high') whyNowReasons.push('High buying intent signals detected');
    if (intent.data?.recentJobChanges) whyNowReasons.push('New leadership - likely evaluating vendors');
    if (jobs.data?.hiringIntensity === 'high') whyNowReasons.push('Rapidly expanding team');
    if (ads.data?.adIntensity === 'high') whyNowReasons.push('Heavy ad spend indicates growth investment');
    if (website.data?.riskScores?.afterHoursRisk) whyNowReasons.push('No after-hours coverage - missing leads');
    if (jobs.data?.rolesHiring?.includes('Sales / Account Executive')) whyNowReasons.push('Building sales team - scaling revenue');
    if (news.data?.hasExpansionNews) whyNowReasons.push('Expansion announced - entering growth phase');
    if (news.data?.hasProductLaunch) whyNowReasons.push('New product launch - investing in growth');
    if (competitors.data?.usingCompetitorProducts) whyNowReasons.push('Using competitor - potential switch opportunity');
    if (webTraffic.data?.trafficTrend === 'growing') whyNowReasons.push('Traffic growing - business momentum');
    if (reviews.data?.avgRating < 3.5 && reviews.data?.totalReviews > 5) whyNowReasons.push('Low review scores - may need to improve customer experience');

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
        website: website.found ? website.data : null,
        funding: funding.found ? funding.data : null,
        news: news.found ? news.data : null,
        reviews: reviews.found ? reviews.data : null,
        social: social.found ? social.data : null,
        contacts: contacts.found ? contacts.data : null,
        intent: intent.found ? intent.data : null,
        competitors: competitors.found ? competitors.data : null,
        webTraffic: webTraffic.found ? webTraffic.data : null
      },
      metadata: {
        enrichedAt: new Date().toISOString(),
        sourcesChecked: 13,
        sourcesFound: [linkedin, jobs, techstack, ads, website, funding, news, reviews, social, contacts, intent, competitors, webTraffic].filter(s => s.found).length
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

// ==================== FUNDING ENRICHMENT ====================
async function enrichFunding(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for funding news
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: `${company} funding OR raised OR series OR investment`,
        gl: 'us',
        hl: 'en',
        num: 10,
        tbs: 'qdr:y' // Last year
      }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    // Funding round patterns
    const fundingPatterns = {
      'Seed': /seed\s*(round|funding)/i,
      'Series A': /series\s*a/i,
      'Series B': /series\s*b/i,
      'Series C': /series\s*c/i,
      'Series D+': /series\s*[d-z]/i,
      'Funding': /(raised|secures?|closes?|announces?)\s*\$?\d+/i
    };

    const amountPattern = /\$(\d+(?:\.\d+)?)\s*(million|m|billion|b)/i;

    let hasRecentFunding = false;
    let fundingRound = null;
    let totalRaised = null;
    let fundingDate = null;
    const fundingNews = [];

    for (const result of results) {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      const fullText = `${result.title} ${result.snippet}`;

      // Check if it's about the right company
      if (!text.includes(company.toLowerCase().split(' ')[0])) continue;

      // Look for funding amounts
      const amountMatch = fullText.match(amountPattern);
      if (amountMatch) {
        hasRecentFunding = true;
        const amount = parseFloat(amountMatch[1]);
        const unit = amountMatch[2].toLowerCase();
        totalRaised = unit.startsWith('b') ? `$${amount}B` : `$${amount}M`;
      }

      // Identify funding round
      for (const [round, pattern] of Object.entries(fundingPatterns)) {
        if (pattern.test(text)) {
          hasRecentFunding = true;
          fundingRound = round;
          break;
        }
      }

      if (hasRecentFunding && fundingNews.length < 3) {
        fundingNews.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet
        });
      }
    }

    const signals = [];
    if (hasRecentFunding) {
      signals.push(`Recent funding detected${fundingRound ? ` (${fundingRound})` : ''}${totalRaised ? ` - ${totalRaised}` : ''}`);
      signals.push('Company has investor backing - likely growth focused');
    }
    if (totalRaised) {
      signals.push('Disclosed funding amount - transparent about growth');
    }

    return {
      found: hasRecentFunding,
      data: {
        hasRecentFunding,
        fundingRound,
        totalRaised,
        fundingDate,
        signals,
        recentFundingNews: fundingNews
      }
    };
  } catch (error) {
    console.error('Funding enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== NEWS ENRICHMENT ====================
async function enrichNews(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: company,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const newsItems = data.news || [];

    // News categories
    const expansionKeywords = /expand|expansion|new office|new market|enters|launch|opens|hiring|growth/i;
    const productKeywords = /launch|release|announces|new product|new feature|update|version/i;
    const partnershipKeywords = /partner|partnership|collaboration|alliance|integration|joins/i;
    const awardKeywords = /award|winner|recognized|named|ranked|top|best/i;

    let hasExpansionNews = false;
    let hasProductLaunch = false;
    let hasPartnership = false;
    let hasAward = false;

    const recentNews = [];

    for (const item of newsItems) {
      const text = `${item.title} ${item.snippet || ''}`;

      if (expansionKeywords.test(text)) hasExpansionNews = true;
      if (productKeywords.test(text)) hasProductLaunch = true;
      if (partnershipKeywords.test(text)) hasPartnership = true;
      if (awardKeywords.test(text)) hasAward = true;

      if (recentNews.length < 5) {
        recentNews.push({
          title: item.title,
          url: item.link,
          source: item.source,
          date: item.date
        });
      }
    }

    const signals = [];
    if (newsItems.length >= 3) {
      signals.push(`${newsItems.length} recent news mentions - active in media`);
    }
    if (hasExpansionNews) {
      signals.push('Expansion news detected - company growing');
    }
    if (hasProductLaunch) {
      signals.push('Product launch news - investing in development');
    }
    if (hasPartnership) {
      signals.push('Partnership announced - building ecosystem');
    }
    if (hasAward) {
      signals.push('Award/recognition received - industry credibility');
    }

    return {
      found: newsItems.length > 0,
      data: {
        recentNewsCount: newsItems.length,
        hasExpansionNews,
        hasProductLaunch,
        hasPartnership,
        hasAward,
        signals,
        recentNews
      }
    };
  } catch (error) {
    console.error('News enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== REVIEWS ENRICHMENT ====================
async function enrichReviews(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for G2 and Capterra profiles
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: `${company} site:g2.com OR site:capterra.com OR site:trustpilot.com`,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    let hasG2Profile = false;
    let hasCapterraProfile = false;
    let hasTrustpilot = false;
    let avgRating = null;
    let totalReviews = null;
    const reviewProfiles = [];

    // Rating extraction pattern
    const ratingPattern = /(\d(?:\.\d)?)\s*(?:out of 5|\/5|stars?)|(\d(?:\.\d)?)\s*rating/i;
    const reviewCountPattern = /(\d+(?:,\d+)?)\s*reviews?/i;

    for (const result of results) {
      const url = result.link || '';
      const text = `${result.title} ${result.snippet || ''}`;

      if (url.includes('g2.com')) {
        hasG2Profile = true;
        reviewProfiles.push({ platform: 'G2', url, title: result.title });
      }
      if (url.includes('capterra.com')) {
        hasCapterraProfile = true;
        reviewProfiles.push({ platform: 'Capterra', url, title: result.title });
      }
      if (url.includes('trustpilot.com')) {
        hasTrustpilot = true;
        reviewProfiles.push({ platform: 'Trustpilot', url, title: result.title });
      }

      // Try to extract rating
      const ratingMatch = text.match(ratingPattern);
      if (ratingMatch && !avgRating) {
        avgRating = parseFloat(ratingMatch[1] || ratingMatch[2]);
      }

      // Try to extract review count
      const reviewMatch = text.match(reviewCountPattern);
      if (reviewMatch && !totalReviews) {
        totalReviews = parseInt(reviewMatch[1].replace(',', ''));
      }
    }

    const signals = [];
    if (hasG2Profile) {
      signals.push('Listed on G2 - B2B software credibility');
    }
    if (hasCapterraProfile) {
      signals.push('Listed on Capterra - enterprise software presence');
    }
    if (hasTrustpilot) {
      signals.push('Listed on Trustpilot - consumer trust signals');
    }
    if (avgRating && avgRating >= 4) {
      signals.push(`High rating (${avgRating}/5) - strong customer satisfaction`);
    } else if (avgRating && avgRating < 3.5) {
      signals.push(`Lower rating (${avgRating}/5) - potential pain point`);
    }
    if (totalReviews && totalReviews >= 50) {
      signals.push(`${totalReviews}+ reviews - established market presence`);
    }

    return {
      found: reviewProfiles.length > 0,
      data: {
        hasG2Profile,
        hasCapterraProfile,
        hasTrustpilot,
        avgRating,
        totalReviews,
        signals,
        reviewProfiles
      }
    };
  } catch (error) {
    console.error('Reviews enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== SOCIAL ENRICHMENT ====================
async function enrichSocial(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for social media profiles
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: `${company} site:linkedin.com OR site:twitter.com OR site:facebook.com OR site:instagram.com`,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    let hasLinkedIn = false;
    let hasTwitter = false;
    let hasFacebook = false;
    let hasInstagram = false;
    let linkedInFollowers = null;
    let twitterFollowers = null;
    const socialProfiles = [];

    // Follower extraction pattern
    const followerPattern = /(\d+(?:,\d+)?(?:\.\d+)?[kKmM]?)\s*(?:followers|following)/i;

    for (const result of results) {
      const url = result.link || '';
      const text = `${result.title} ${result.snippet || ''}`;

      if (url.includes('linkedin.com/company')) {
        hasLinkedIn = true;
        socialProfiles.push({ platform: 'LinkedIn', url, title: result.title });

        const followerMatch = text.match(followerPattern);
        if (followerMatch) {
          linkedInFollowers = followerMatch[1];
        }
      }
      if (url.includes('twitter.com') || url.includes('x.com')) {
        hasTwitter = true;
        socialProfiles.push({ platform: 'Twitter/X', url, title: result.title });

        const followerMatch = text.match(followerPattern);
        if (followerMatch) {
          twitterFollowers = followerMatch[1];
        }
      }
      if (url.includes('facebook.com')) {
        hasFacebook = true;
        socialProfiles.push({ platform: 'Facebook', url, title: result.title });
      }
      if (url.includes('instagram.com')) {
        hasInstagram = true;
        socialProfiles.push({ platform: 'Instagram', url, title: result.title });
      }
    }

    // Determine if company is "active" on social
    const profileCount = [hasLinkedIn, hasTwitter, hasFacebook, hasInstagram].filter(Boolean).length;
    const isActive = profileCount >= 2;

    const signals = [];
    if (hasLinkedIn) {
      signals.push(`LinkedIn company page${linkedInFollowers ? ` (${linkedInFollowers} followers)` : ''}`);
    }
    if (hasTwitter) {
      signals.push(`Twitter/X presence${twitterFollowers ? ` (${twitterFollowers} followers)` : ''}`);
    }
    if (profileCount >= 3) {
      signals.push('Strong social media presence - marketing investment');
    } else if (profileCount === 0) {
      signals.push('Limited social presence - potential marketing gap');
    }
    if (isActive) {
      signals.push('Active across multiple platforms - brand awareness focus');
    }

    return {
      found: socialProfiles.length > 0,
      data: {
        hasLinkedIn,
        hasTwitter,
        hasFacebook,
        hasInstagram,
        linkedInFollowers,
        twitterFollowers,
        isActive,
        profileCount,
        signals,
        socialProfiles
      }
    };
  } catch (error) {
    console.error('Social enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== CONTACTS ENRICHMENT (Apollo-style) ====================
async function enrichContacts(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for decision makers at the company
    const titles = ['CEO', 'CTO', 'CMO', 'VP Sales', 'VP Marketing', 'Head of', 'Director', 'Founder'];
    const searchQuery = `site:linkedin.com/in "${company}" (${titles.join(' OR ')})`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: searchQuery, gl: 'us', hl: 'en', num: 15 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    const decisionMakers = [];
    const titlePatterns = {
      'C-Suite': /\b(CEO|CTO|CFO|CMO|COO|CRO|Chief)\b/i,
      'VP': /\b(VP|Vice President)\b/i,
      'Director': /\b(Director|Head of)\b/i,
      'Founder': /\b(Founder|Co-founder|Owner)\b/i,
      'Manager': /\b(Manager|Lead)\b/i
    };

    for (const result of results) {
      const title = result.title || '';
      const snippet = result.snippet || '';
      const url = result.link || '';

      if (!url.includes('linkedin.com/in/')) continue;

      // Extract name from LinkedIn title (usually "Name - Title - Company")
      const nameParts = title.split(/[-–|]/);
      const name = nameParts[0]?.trim().replace(' | LinkedIn', '');

      // Determine seniority level
      let level = 'Unknown';
      for (const [lvl, pattern] of Object.entries(titlePatterns)) {
        if (pattern.test(title) || pattern.test(snippet)) {
          level = lvl;
          break;
        }
      }

      // Extract role from title
      const roleMatch = title.match(/[-–]\s*([^-–|]+)/);
      const role = roleMatch ? roleMatch[1].trim() : '';

      if (name && name.length > 2 && name.length < 50) {
        decisionMakers.push({
          name,
          role,
          level,
          linkedinUrl: url,
          snippet: snippet.slice(0, 150)
        });
      }
    }

    // Remove duplicates by name
    const uniqueContacts = decisionMakers.filter((contact, index, self) =>
      index === self.findIndex(c => c.name.toLowerCase() === contact.name.toLowerCase())
    ).slice(0, 10);

    // Search for email patterns
    const emailSearchResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `"@${domain}" email contact`, gl: 'us', hl: 'en', num: 5 }),
    });

    let emailPattern = null;
    let hasVerifiedEmails = false;

    if (emailSearchResponse.ok) {
      const emailData = await emailSearchResponse.json();
      const emailResults = emailData.organic || [];

      // Try to detect email pattern
      const patterns = [
        { pattern: 'first.last', regex: /[a-z]+\.[a-z]+@/i },
        { pattern: 'firstlast', regex: /[a-z]{4,}@/i },
        { pattern: 'first', regex: /^[a-z]{2,10}@/i },
        { pattern: 'flast', regex: /[a-z]\.[a-z]+@/i }
      ];

      for (const result of emailResults) {
        const text = `${result.title} ${result.snippet}`.toLowerCase();
        for (const p of patterns) {
          if (p.regex.test(text)) {
            emailPattern = p.pattern;
            hasVerifiedEmails = true;
            break;
          }
        }
        if (emailPattern) break;
      }
    }

    const signals = [];
    const cSuiteCount = uniqueContacts.filter(c => c.level === 'C-Suite').length;
    const vpCount = uniqueContacts.filter(c => c.level === 'VP').length;

    if (cSuiteCount > 0) {
      signals.push(`${cSuiteCount} C-Suite executive(s) identified`);
    }
    if (vpCount > 0) {
      signals.push(`${vpCount} VP-level contact(s) found`);
    }
    if (uniqueContacts.length >= 5) {
      signals.push('Rich contact database available - multiple entry points');
    }
    if (hasVerifiedEmails) {
      signals.push(`Email pattern detected: ${emailPattern}@${domain}`);
    }

    return {
      found: uniqueContacts.length > 0,
      data: {
        decisionMakers: uniqueContacts,
        totalFound: uniqueContacts.length,
        cSuiteCount,
        vpCount,
        emailPattern,
        hasVerifiedEmails,
        signals
      }
    };
  } catch (error) {
    console.error('Contacts enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== INTENT ENRICHMENT ====================
async function enrichIntent(domain, companyName, industry) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for buying intent signals
    const intentQueries = [
      `"${company}" hiring OR "looking for" OR "searching for" OR "evaluating"`,
      `"${company}" "new" OR "switch" OR "replace" OR "upgrade"`,
      `site:linkedin.com "${company}" "joined" OR "started" OR "appointed"`
    ];

    const results = [];
    for (const query of intentQueries.slice(0, 2)) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'us', hl: 'en', num: 10, tbs: 'qdr:m3' }), // Last 3 months
      });

      if (response.ok) {
        const data = await response.json();
        results.push(...(data.organic || []));
      }
    }

    // Analyze intent signals
    let recentJobChanges = false;
    let expandingDepartments = [];
    let evaluatingVendors = false;
    let techEvaluations = [];

    const departmentKeywords = {
      'Sales': /sales|revenue|account executive|sdr|bdr/i,
      'Marketing': /marketing|growth|demand gen|content/i,
      'Engineering': /engineering|developer|software|technical/i,
      'Product': /product|PM|roadmap/i,
      'Operations': /operations|ops|process/i,
      'Customer Success': /customer success|csm|support/i
    };

    const vendorKeywords = /evaluating|comparing|looking for|searching for|switching|replacing|vendor selection/i;
    const jobChangeKeywords = /joined|appointed|hired|promoted|new role|started as/i;

    for (const result of results) {
      const text = `${result.title} ${result.snippet || ''}`.toLowerCase();

      // Check for job changes
      if (jobChangeKeywords.test(text)) {
        recentJobChanges = true;
      }

      // Check for department expansion
      for (const [dept, pattern] of Object.entries(departmentKeywords)) {
        if (pattern.test(text) && (text.includes('hiring') || text.includes('growing') || text.includes('expanding'))) {
          if (!expandingDepartments.includes(dept)) {
            expandingDepartments.push(dept);
          }
        }
      }

      // Check for vendor evaluation
      if (vendorKeywords.test(text)) {
        evaluatingVendors = true;
        // Try to extract what they're evaluating
        const evalMatch = text.match(/(?:evaluating|looking for|searching for)\s+([^.]+)/i);
        if (evalMatch) {
          techEvaluations.push(evalMatch[1].slice(0, 50));
        }
      }
    }

    // Calculate intent score
    let intentScore = 'low';
    let intentPoints = 0;
    if (recentJobChanges) intentPoints += 2;
    if (expandingDepartments.length > 0) intentPoints += expandingDepartments.length;
    if (evaluatingVendors) intentPoints += 3;

    if (intentPoints >= 5) intentScore = 'high';
    else if (intentPoints >= 2) intentScore = 'medium';

    const signals = [];
    if (recentJobChanges) {
      signals.push('Recent leadership/role changes detected - new decision makers');
    }
    if (expandingDepartments.length > 0) {
      signals.push(`Expanding departments: ${expandingDepartments.join(', ')}`);
    }
    if (evaluatingVendors) {
      signals.push('Actively evaluating vendors/solutions');
    }
    if (techEvaluations.length > 0) {
      signals.push(`Researching: ${techEvaluations.slice(0, 2).join(', ')}`);
    }
    if (intentScore === 'high') {
      signals.push('HIGH INTENT: Multiple buying signals detected');
    }

    return {
      found: intentPoints > 0,
      data: {
        intentScore,
        intentPoints,
        recentJobChanges,
        expandingDepartments,
        evaluatingVendors,
        techEvaluations: techEvaluations.slice(0, 3),
        signals
      }
    };
  } catch (error) {
    console.error('Intent enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== COMPETITORS ENRICHMENT ====================
async function enrichCompetitors(domain, companyName, industry) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Industry-specific competitor tools
    const industryCompetitors = {
      'SaaS': ['salesforce', 'hubspot', 'zendesk', 'intercom', 'drift', 'freshworks', 'pipedrive'],
      'Marketing Agency': ['hubspot', 'semrush', 'ahrefs', 'moz', 'hootsuite', 'sprout social'],
      'E-commerce': ['shopify', 'bigcommerce', 'woocommerce', 'magento', 'squarespace'],
      'Healthcare': ['epic', 'cerner', 'meditech', 'allscripts', 'athenahealth'],
      'FinTech': ['stripe', 'square', 'plaid', 'brex', 'ramp'],
      'Real Estate': ['zillow', 'realtor', 'redfin', 'compass', 'keller williams'],
      'Legal': ['clio', 'mycase', 'practicepanther', 'smokeball'],
      'Construction': ['procore', 'buildertrend', 'plangrid', 'fieldwire']
    };

    // Get competitors for this industry or use generic ones
    const relevantCompetitors = industryCompetitors[industry] ||
      ['salesforce', 'hubspot', 'intercom', 'zendesk', 'monday', 'asana'];

    // Search for competitor mentions
    const competitorQuery = `"${company}" (${relevantCompetitors.slice(0, 4).join(' OR ')})`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: competitorQuery, gl: 'us', hl: 'en', num: 10 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    let usingCompetitorProducts = false;
    let recentCompetitorMentions = false;
    const competitorsFound = [];
    const competitorContext = [];

    for (const result of results) {
      const text = `${result.title} ${result.snippet || ''}`.toLowerCase();

      for (const competitor of relevantCompetitors) {
        if (text.includes(competitor.toLowerCase())) {
          if (!competitorsFound.includes(competitor)) {
            competitorsFound.push(competitor);
          }

          // Check if they're using the product
          if (text.includes('uses') || text.includes('using') || text.includes('powered by') ||
              text.includes('integrated') || text.includes('customer')) {
            usingCompetitorProducts = true;
            competitorContext.push({
              competitor,
              context: result.snippet?.slice(0, 100)
            });
          }

          // Check for recent mentions (comparison, switching, etc.)
          if (text.includes('vs') || text.includes('versus') || text.includes('alternative') ||
              text.includes('switch') || text.includes('compare')) {
            recentCompetitorMentions = true;
          }
        }
      }
    }

    // Also check tech stack for competitor products
    const techResponse = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow'
    }).catch(() => null);

    if (techResponse?.ok) {
      const html = await techResponse.text();
      for (const competitor of relevantCompetitors) {
        if (html.toLowerCase().includes(competitor.toLowerCase())) {
          usingCompetitorProducts = true;
          if (!competitorsFound.includes(competitor)) {
            competitorsFound.push(competitor);
          }
        }
      }
    }

    const signals = [];
    if (usingCompetitorProducts) {
      signals.push(`Uses competitor products: ${competitorsFound.slice(0, 3).join(', ')}`);
      signals.push('OPPORTUNITY: May be open to switching solutions');
    }
    if (recentCompetitorMentions) {
      signals.push('Recently compared/mentioned competitors - evaluating options');
    }
    if (competitorsFound.length > 0) {
      signals.push(`${competitorsFound.length} competitor(s) in their ecosystem`);
    }

    return {
      found: competitorsFound.length > 0,
      data: {
        usingCompetitorProducts,
        recentCompetitorMentions,
        competitorsFound,
        competitorContext: competitorContext.slice(0, 3),
        signals
      }
    };
  } catch (error) {
    console.error('Competitors enrichment error:', error);
    return { found: false, error: error.message };
  }
}

// ==================== WEB TRAFFIC ENRICHMENT ====================
async function enrichWebTraffic(domain) {
  try {
    // Search for traffic/ranking data from public sources
    const trafficQuery = `"${domain}" (traffic OR visitors OR ranking OR alexa OR similarweb)`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: trafficQuery, gl: 'us', hl: 'en', num: 10 }),
    });

    if (!response.ok) return { found: false, data: null };

    const data = await response.json();
    const results = data.organic || [];

    let monthlyVisits = null;
    let globalRank = null;
    let trafficTrend = 'unknown';
    let bounceRate = null;
    let avgVisitDuration = null;

    // Patterns to extract traffic data
    const visitPattern = /(\d+(?:\.\d+)?)\s*(?:k|m|million|thousand)?\s*(?:monthly|visits|visitors)/i;
    const rankPattern = /(?:rank|ranking)[:\s]*#?(\d+(?:,\d+)*)/i;
    const trendPattern = /(growing|declining|increasing|decreasing|up|down)\s*(?:\d+)?%?/i;

    for (const result of results) {
      const text = `${result.title} ${result.snippet || ''}`;

      // Extract monthly visits
      const visitMatch = text.match(visitPattern);
      if (visitMatch && !monthlyVisits) {
        let visits = parseFloat(visitMatch[1]);
        const unit = text.toLowerCase();
        if (unit.includes('million') || unit.includes('m ')) visits *= 1000000;
        else if (unit.includes('k') || unit.includes('thousand')) visits *= 1000;
        monthlyVisits = Math.round(visits);
      }

      // Extract rank
      const rankMatch = text.match(rankPattern);
      if (rankMatch && !globalRank) {
        globalRank = parseInt(rankMatch[1].replace(/,/g, ''));
      }

      // Extract trend
      const trendMatch = text.match(trendPattern);
      if (trendMatch) {
        const trendWord = trendMatch[1].toLowerCase();
        if (['growing', 'increasing', 'up'].includes(trendWord)) {
          trafficTrend = 'growing';
        } else if (['declining', 'decreasing', 'down'].includes(trendWord)) {
          trafficTrend = 'declining';
        }
      }
    }

    // Estimate traffic tier based on rank if no visits found
    if (!monthlyVisits && globalRank) {
      if (globalRank < 10000) monthlyVisits = 1000000;
      else if (globalRank < 50000) monthlyVisits = 500000;
      else if (globalRank < 100000) monthlyVisits = 100000;
      else if (globalRank < 500000) monthlyVisits = 50000;
      else monthlyVisits = 10000;
    }

    // Default traffic trend to stable if we have some data
    if (trafficTrend === 'unknown' && (monthlyVisits || globalRank)) {
      trafficTrend = 'stable';
    }

    // Determine traffic tier
    let trafficTier = 'unknown';
    if (monthlyVisits >= 1000000) trafficTier = 'enterprise';
    else if (monthlyVisits >= 100000) trafficTier = 'high';
    else if (monthlyVisits >= 10000) trafficTier = 'medium';
    else if (monthlyVisits > 0) trafficTier = 'low';

    const signals = [];
    if (trafficTier === 'enterprise') {
      signals.push('Enterprise-level traffic (1M+ monthly visits)');
    } else if (trafficTier === 'high') {
      signals.push('High traffic website (100K+ monthly visits)');
    } else if (monthlyVisits) {
      signals.push(`Estimated ${monthlyVisits.toLocaleString()} monthly visits`);
    }

    if (trafficTrend === 'growing') {
      signals.push('Traffic trending upward - business momentum');
    } else if (trafficTrend === 'declining') {
      signals.push('Traffic declining - may need help with growth');
    }

    if (globalRank && globalRank < 100000) {
      signals.push(`Global rank: ${globalRank.toLocaleString()} - established web presence`);
    }

    return {
      found: monthlyVisits !== null || globalRank !== null,
      data: {
        monthlyVisits,
        globalRank,
        trafficTrend,
        trafficTier,
        bounceRate,
        avgVisitDuration,
        signals
      }
    };
  } catch (error) {
    console.error('Web traffic enrichment error:', error);
    return { found: false, error: error.message };
  }
}
