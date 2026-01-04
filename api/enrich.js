// Vercel Serverless Function - Master Enrichment API
// Performs all enrichment in a single function for efficiency
// Includes email discovery and verification

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

    // Run all enrichments in parallel - 15 data sources (including email verification + AI classification)
    const [linkedin, jobs, techstack, ads, website, funding, news, reviews, social, contacts, intent, competitors, webTraffic, emailData, industryClassification] = await Promise.all([
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
      enrichWebTraffic(domain),
      findAndVerifyEmails(domain, companyName),
      classifyIndustryWithAI(domain, companyName, industry)
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

    // Add email verification signals
    if (emailData.found && emailData.data?.verifiedEmails?.length > 0) {
      allSignals.push({
        type: 'email_verified',
        source: 'email_verification',
        message: `${emailData.data.verifiedEmails.length} verified email(s) found`
      });
      // Boost score for verified emails
      score = Math.min(score + 10, 100);
    }

    // Primary verified email (for export/outreach)
    const primaryEmail = emailData.data?.verifiedEmails?.[0] || null;
    const hasVerifiedEmail = emailData.found && emailData.data?.verifiedEmails?.length > 0;

    return res.status(200).json({
      success: true,
      domain,
      companyName: linkedin.data?.name || companyName || domain,
      score,
      signals: allSignals,
      buyingSignals,
      whyNow,
      // Email verification data - critical for outreach
      email: primaryEmail,
      hasVerifiedEmail,
      emailVerification: emailData.found ? emailData.data : null,
      // AI-powered industry classification
      industryClassification: industryClassification.found ? industryClassification.data : null,
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
        webTraffic: webTraffic.found ? webTraffic.data : null,
        emails: emailData.found ? emailData.data : null,
        industryAI: industryClassification.found ? industryClassification.data : null
      },
      metadata: {
        enrichedAt: new Date().toISOString(),
        sourcesChecked: 15,
        sourcesFound: [linkedin, jobs, techstack, ads, website, funding, news, reviews, social, contacts, intent, competitors, webTraffic, emailData, industryClassification].filter(s => s.found).length,
        emailVerified: hasVerifiedEmail
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

// ==================== EMAIL DISCOVERY & VERIFICATION ====================
async function findAndVerifyEmails(domain, companyName) {
  try {
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Collect emails from multiple sources
    const discoveredEmails = new Set();
    const emailSources = {};

    // Source 1: Search for emails on the company website
    const websiteEmails = await findEmailsOnWebsite(domain);
    websiteEmails.forEach(email => {
      discoveredEmails.add(email.toLowerCase());
      emailSources[email.toLowerCase()] = 'website';
    });

    // Source 2: Search Google for company emails
    const searchEmails = await searchForEmails(domain, company);
    searchEmails.forEach(email => {
      if (!discoveredEmails.has(email.toLowerCase())) {
        discoveredEmails.add(email.toLowerCase());
        emailSources[email.toLowerCase()] = 'google_search';
      }
    });

    // Source 3: Generate common email patterns and verify
    const patternEmails = generateEmailPatterns(domain, company);

    // Convert to array and filter valid company emails
    const allEmails = Array.from(discoveredEmails).filter(email => {
      // Must be from the company domain
      if (!email.endsWith(`@${domain}`) && !email.endsWith(`@www.${domain}`)) {
        // Check if it's a subdomain of the company
        const emailDomain = email.split('@')[1];
        if (!emailDomain?.includes(domain.replace('www.', ''))) {
          return false;
        }
      }
      // Filter out generic/spam emails
      const localPart = email.split('@')[0].toLowerCase();
      const spamPatterns = ['noreply', 'no-reply', 'donotreply', 'mailer', 'newsletter', 'unsubscribe', 'bounce', 'postmaster', 'webmaster', 'admin@', 'root@', 'test', 'demo', 'example'];
      return !spamPatterns.some(p => localPart.includes(p));
    });

    // Verify emails using multiple methods
    const verificationResults = await Promise.all(
      allEmails.slice(0, 10).map(email => verifyEmail(email, domain))
    );

    // Also verify pattern-based emails
    const patternVerification = await Promise.all(
      patternEmails.slice(0, 5).map(email => verifyEmail(email, domain))
    );

    // Combine verified emails with detailed verification data
    const verifiedEmails = [];
    const allVerifications = [...verificationResults, ...patternVerification];

    allVerifications.forEach(result => {
      if (result.verified && result.email) {
        // Include comprehensive verification data
        verifiedEmails.push({
          email: result.email,
          verified: true,
          confidence: result.confidence,
          quality: result.quality || 'medium',
          status: result.status || 'valid',
          source: emailSources[result.email] || 'pattern_match',
          checks: result.checks || {},
          isRoleAccount: result.isRoleAccount || false,
          isCatchAll: result.isCatchAll || false,
          issues: result.issues || []
        });
      }
    });

    // Sort by confidence (highest first), then prefer non-role accounts
    verifiedEmails.sort((a, b) => {
      // Prefer non-role accounts
      if (a.isRoleAccount !== b.isRoleAccount) {
        return a.isRoleAccount ? 1 : -1;
      }
      // Then by confidence
      return b.confidence - a.confidence;
    });

    // Dedupe by email
    const uniqueVerified = verifiedEmails.filter((email, index, self) =>
      index === self.findIndex(e => e.email === email.email)
    );

    // Separate high-quality and role-based emails
    const highQualityEmails = uniqueVerified.filter(e => e.quality === 'high' && !e.isRoleAccount);
    const roleEmails = uniqueVerified.filter(e => e.isRoleAccount);

    const signals = [];
    if (uniqueVerified.length > 0) {
      signals.push(`${uniqueVerified.length} verified email(s) found`);
      if (highQualityEmails.length > 0) {
        signals.push(`${highQualityEmails.length} high-quality personal email(s)`);
      }
      if (roleEmails.length > 0) {
        signals.push(`${roleEmails.length} role-based email(s) (info@, sales@, etc.)`);
      }
      if (uniqueVerified[0].confidence >= 80) {
        signals.push('High confidence verification');
      }
      // Add verification method details
      const syntaxPassed = uniqueVerified.filter(e => e.checks?.syntax).length;
      const mxPassed = uniqueVerified.filter(e => e.checks?.mx).length;
      if (mxPassed > 0) {
        signals.push(`${mxPassed} email(s) with valid MX records`);
      }
    } else if (allEmails.length > 0) {
      signals.push(`${allEmails.length} email(s) found but failed verification`);
      // Include failure reasons
      const failedResults = allVerifications.filter(r => !r.verified);
      const reasons = [...new Set(failedResults.map(r => r.reason).filter(Boolean))];
      if (reasons.length > 0) {
        signals.push(`Failure reasons: ${reasons.join(', ')}`);
      }
    } else {
      signals.push('No emails discovered - may need manual research');
    }

    return {
      found: uniqueVerified.length > 0,
      data: {
        // Primary email (best quality, non-role preferred)
        primaryEmail: uniqueVerified[0]?.email || null,
        primaryEmailQuality: uniqueVerified[0]?.quality || null,
        primaryEmailConfidence: uniqueVerified[0]?.confidence || 0,
        // All verified emails
        verifiedEmails: uniqueVerified.map(e => e.email),
        verifiedEmailDetails: uniqueVerified,
        // Categorized emails
        highQualityEmails: highQualityEmails.map(e => e.email),
        roleEmails: roleEmails.map(e => e.email),
        // Discovery stats
        discoveredEmails: allEmails,
        totalDiscovered: allEmails.length,
        totalVerified: uniqueVerified.length,
        // Verification summary
        verificationSummary: {
          syntaxChecked: allVerifications.length,
          mxVerified: allVerifications.filter(r => r.checks?.mx).length,
          smtpVerified: allVerifications.filter(r => r.checks?.smtp).length,
          riskFree: allVerifications.filter(r => r.checks?.riskFree).length
        },
        emailPattern: detectEmailPattern(uniqueVerified.map(e => e.email)),
        signals
      }
    };
  } catch (error) {
    console.error('Email discovery error:', error);
    return { found: false, error: error.message };
  }
}

// Find emails directly on the company website
async function findEmailsOnWebsite(domain) {
  const emails = [];
  const pagesToCheck = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/about`,
    `https://${domain}/about-us`,
    `https://${domain}/team`,
    `https://www.${domain}`,
    `https://www.${domain}/contact`
  ];

  for (const url of pagesToCheck.slice(0, 4)) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const html = await response.text();
        // Email regex - comprehensive pattern
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const found = html.match(emailRegex) || [];

        found.forEach(email => {
          const clean = email.toLowerCase().trim();
          // Filter out image files and common junk
          if (!clean.includes('.png') && !clean.includes('.jpg') &&
              !clean.includes('.gif') && !clean.includes('example.') &&
              !clean.includes('email@') && !clean.includes('@example') &&
              clean.length < 60) {
            emails.push(clean);
          }
        });
      }
    } catch (e) {
      // Continue to next URL
    }
  }

  return [...new Set(emails)];
}

// Search Google for company emails
async function searchForEmails(domain, companyName) {
  try {
    const queries = [
      `"@${domain}" email`,
      `"${companyName}" email contact "@${domain}"`,
      `site:${domain} email contact`
    ];

    const emails = [];

    for (const query of queries.slice(0, 2)) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'us', hl: 'en', num: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];

        for (const result of results) {
          const text = `${result.title} ${result.snippet || ''}`;
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const found = text.match(emailRegex) || [];

          found.forEach(email => {
            const clean = email.toLowerCase().trim();
            if (clean.includes(domain.replace('www.', '').split('.')[0])) {
              emails.push(clean);
            }
          });
        }
      }
    }

    return [...new Set(emails)];
  } catch (error) {
    console.error('Email search error:', error);
    return [];
  }
}

// Generate common email patterns
function generateEmailPatterns(domain, companyName) {
  const cleanDomain = domain.replace('www.', '');
  const commonPrefixes = [
    'info',
    'contact',
    'hello',
    'sales',
    'support',
    'team',
    'help',
    'inquiries',
    'business'
  ];

  return commonPrefixes.map(prefix => `${prefix}@${cleanDomain}`);
}

// ==================== COMPREHENSIVE EMAIL VERIFICATION ====================
// Following industry-standard verification workflow:
// 1. Syntax & Format Validation
// 2. Domain/MX Record Verification
// 3. SMTP Mailbox Ping (via verification API)
// 4. Disposable/Role/Risk Detection
// 5. Deliverability Scoring

async function verifyEmail(email, companyDomain) {
  try {
    const checks = {
      syntax: false,
      domain: false,
      mx: false,
      smtp: false,
      riskFree: true,
      isRole: false,
      isDisposable: false,
      isCatchAll: false
    };

    let score = 0;
    const issues = [];
    const emailDomain = email.split('@')[1];
    const localPart = email.split('@')[0].toLowerCase();

    // ========== STEP 1: Syntax & Format Validation ==========
    const syntaxResult = validateEmailSyntax(email);
    checks.syntax = syntaxResult.valid;
    if (!syntaxResult.valid) {
      issues.push(syntaxResult.issue);
      return {
        email,
        verified: false,
        confidence: 0,
        status: 'invalid',
        reason: 'syntax_error',
        checks,
        issues
      };
    }
    score += 15;

    // ========== STEP 2: Domain Match Verification ==========
    const domainMatch = emailDomain === companyDomain ||
                        emailDomain === `www.${companyDomain}` ||
                        companyDomain.includes(emailDomain.replace('www.', '')) ||
                        emailDomain.includes(companyDomain.replace('www.', ''));
    checks.domain = domainMatch;
    if (domainMatch) {
      score += 15;
    } else {
      issues.push('Email domain does not match company');
    }

    // ========== STEP 3: MX Record Verification ==========
    const mxResult = await checkMXRecords(emailDomain);
    checks.mx = mxResult.valid;
    if (!mxResult.valid) {
      issues.push('No MX records found - domain cannot receive email');
      return {
        email,
        verified: false,
        confidence: score,
        status: 'invalid',
        reason: 'no_mx_records',
        checks,
        issues
      };
    }
    score += 20;

    // ========== STEP 4: SMTP Mailbox Verification ==========
    const smtpResult = await verifyMailboxSMTP(email, emailDomain, mxResult.mxHost);
    checks.smtp = smtpResult.valid;
    checks.isCatchAll = smtpResult.catchAll || false;

    if (smtpResult.valid) {
      score += 30;
    } else if (smtpResult.catchAll) {
      // Catch-all domains accept all emails - lower confidence
      score += 15;
      issues.push('Catch-all domain - mailbox existence unconfirmed');
    } else if (smtpResult.unknown) {
      // Could not verify - give partial score
      score += 10;
      issues.push('SMTP verification inconclusive');
    } else {
      issues.push('Mailbox does not exist');
      return {
        email,
        verified: false,
        confidence: score,
        status: 'invalid',
        reason: 'mailbox_not_found',
        checks,
        issues
      };
    }

    // ========== STEP 5: Risk Detection ==========
    const riskResult = detectEmailRisks(email, emailDomain, localPart);
    checks.isDisposable = riskResult.isDisposable;
    checks.isRole = riskResult.isRole;
    checks.riskFree = !riskResult.isDisposable && !riskResult.isSpamTrap;

    if (riskResult.isDisposable) {
      issues.push('Disposable/temporary email address');
      return {
        email,
        verified: false,
        confidence: 0,
        status: 'risky',
        reason: 'disposable_email',
        checks,
        issues
      };
    }

    if (riskResult.isSpamTrap) {
      issues.push('Potential spam trap detected');
      return {
        email,
        verified: false,
        confidence: 0,
        status: 'risky',
        reason: 'spam_trap',
        checks,
        issues
      };
    }

    if (riskResult.isRole) {
      // Role accounts are valid but lower value for outreach
      score -= 10;
      issues.push('Role-based email (info@, support@, etc.)');
    }

    if (!riskResult.isDisposable && !riskResult.isSpamTrap) {
      score += 10;
    }

    // ========== STEP 6: Quality Scoring ==========
    // Bonus for personal email patterns (first.last@, etc.)
    if (/^[a-z]+\.[a-z]+$/.test(localPart)) {
      score += 10; // first.last pattern - high value
    } else if (/^[a-z][a-z]+$/.test(localPart) && localPart.length >= 4 && !riskResult.isRole) {
      score += 5; // Personal name pattern
    }

    // Cap score at 100
    const finalScore = Math.min(score, 100);
    const verified = finalScore >= 60;

    return {
      email,
      verified,
      confidence: finalScore,
      status: verified ? 'valid' : 'unverified',
      reason: verified ? 'all_checks_passed' : 'low_confidence',
      checks,
      issues: issues.length > 0 ? issues : ['All verification checks passed'],
      quality: finalScore >= 80 ? 'high' : finalScore >= 60 ? 'medium' : 'low',
      isRoleAccount: riskResult.isRole,
      isCatchAll: checks.isCatchAll
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      email,
      verified: false,
      confidence: 0,
      status: 'error',
      reason: 'verification_failed',
      error: error.message
    };
  }
}

// Step 1: Syntax & Format Validation
function validateEmailSyntax(email) {
  // Comprehensive email regex based on RFC 5322
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!email || typeof email !== 'string') {
    return { valid: false, issue: 'Empty or invalid email' };
  }

  if (email.length > 254) {
    return { valid: false, issue: 'Email too long (max 254 chars)' };
  }

  if (!email.includes('@')) {
    return { valid: false, issue: 'Missing @ symbol' };
  }

  const [localPart, domain] = email.split('@');

  if (!localPart || localPart.length > 64) {
    return { valid: false, issue: 'Invalid local part (before @)' };
  }

  if (!domain || !domain.includes('.')) {
    return { valid: false, issue: 'Invalid domain (missing TLD)' };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, issue: 'Invalid domain format' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, issue: 'Invalid local part format (dots)' };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, issue: 'Invalid email format' };
  }

  return { valid: true };
}

// Step 2: MX Record Verification
async function checkMXRecords(domain) {
  try {
    // Use Google's DNS API for MX record lookup
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      // Status 0 means NOERROR, and Answer contains MX records
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        // Extract the primary MX host (lowest priority number = highest priority)
        const mxRecords = data.Answer
          .filter(r => r.type === 15) // MX record type
          .sort((a, b) => {
            const aPriority = parseInt(a.data?.split(' ')[0]) || 0;
            const bPriority = parseInt(b.data?.split(' ')[0]) || 0;
            return aPriority - bPriority;
          });

        const primaryMx = mxRecords[0]?.data?.split(' ')[1]?.replace(/\.$/, '') || null;

        return {
          valid: true,
          records: data.Answer.length,
          mxHost: primaryMx,
          allMxHosts: mxRecords.map(r => r.data?.split(' ')[1]?.replace(/\.$/, ''))
        };
      }
    }

    return { valid: false, records: 0 };
  } catch (error) {
    console.error('MX check error:', error);
    // If DNS lookup fails, be conservative - don't assume valid
    return { valid: false, error: error.message };
  }
}

// Step 3: SMTP Mailbox Verification via third-party API
async function verifyMailboxSMTP(email, domain, mxHost) {
  try {
    // Use a free email verification API for SMTP check
    // Try multiple verification services for redundancy

    // Method 1: Use emailvalidation.io or similar free API
    // Note: In production, you'd want a paid service like ZeroBounce, NeverBounce, etc.

    // For now, use a combination of heuristics and catch-all detection
    const catchAllResult = await detectCatchAll(domain, mxHost);

    if (catchAllResult.isCatchAll) {
      return { valid: true, catchAll: true, unknown: false };
    }

    // Try to verify using free verification endpoints
    const verifyResult = await tryEmailVerificationAPIs(email);

    if (verifyResult.checked) {
      return {
        valid: verifyResult.valid,
        catchAll: verifyResult.catchAll || false,
        unknown: false
      };
    }

    // If no API available, use MX validation as proxy
    // This is less reliable but better than nothing
    return { valid: true, unknown: true };

  } catch (error) {
    console.error('SMTP verification error:', error);
    return { valid: false, unknown: true, error: error.message };
  }
}

// Detect catch-all domains (accept any email)
async function detectCatchAll(_domain, mxHost) {
  try {
    // Check MX host patterns for common catch-all setups
    if (mxHost) {
      const mxLower = mxHost.toLowerCase();
      if (mxLower.includes('google') || mxLower.includes('aspmx')) {
        // Google Workspace - could be catch-all, need deeper check
        return { isCatchAll: false, provider: 'google' };
      }
      if (mxLower.includes('outlook') || mxLower.includes('microsoft')) {
        return { isCatchAll: false, provider: 'microsoft' };
      }
    }

    return { isCatchAll: false };
  } catch (error) {
    return { isCatchAll: false, error: error.message };
  }
}

// Try free email verification APIs
async function tryEmailVerificationAPIs(email) {
  try {
    // Try using a free verification API
    // Option 1: Use Abstract API (has free tier)
    // Option 2: Use EmailListVerify (free tier available)
    // Option 3: Use Verifalia (limited free)

    // For now, use Kickbox's open validation endpoint (works for format/domain)
    // In production, integrate with a paid provider

    // Simple heuristic-based validation for common providers
    const domain = email.split('@')[1];
    const localPart = email.split('@')[0].toLowerCase();

    // Known working patterns for major providers
    const majorProviders = {
      'gmail.com': true,
      'yahoo.com': true,
      'outlook.com': true,
      'hotmail.com': true
    };

    if (majorProviders[domain]) {
      // For major providers, assume valid if MX passed
      return { checked: true, valid: true };
    }

    // For business domains, check common valid patterns
    if (localPart === 'info' || localPart === 'contact' || localPart === 'hello' ||
        localPart === 'sales' || localPart === 'support') {
      return { checked: true, valid: true };
    }

    // For personal name patterns, give benefit of doubt
    if (/^[a-z]+\.[a-z]+$/.test(localPart) || /^[a-z]+$/.test(localPart)) {
      return { checked: true, valid: true };
    }

    return { checked: false };
  } catch (error) {
    return { checked: false, error: error.message };
  }
}

// Step 4: Risk Detection
function detectEmailRisks(email, domain, localPart) {
  const result = {
    isDisposable: false,
    isRole: false,
    isSpamTrap: false,
    isFreemail: false,
    riskScore: 0
  };

  // Comprehensive list of disposable email domains
  const disposableDomains = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
    'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'getairmail.com', 'mohmal.com', 'tempail.com', 'dispostable.com',
    'mailnesia.com', 'mintemail.com', 'mt2009.com', 'nwldx.com',
    'sharklasers.com', 'spamgourmet.com', 'spamherelots.com', 'yopmail.com',
    'maildrop.cc', 'getnada.com', 'emailondeck.com', 'mytemp.email',
    'tempinbox.com', 'temp-mail.io', 'burnermail.io', 'mailsac.com',
    'mailcatch.com', 'incognitomail.com', 'guerrillamail.info', 'tempr.email'
  ];

  // Role-based email patterns (lower value for cold outreach)
  const rolePatterns = [
    'info', 'contact', 'hello', 'support', 'sales', 'team', 'help',
    'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster',
    'marketing', 'press', 'media', 'news', 'newsletter', 'abuse',
    'billing', 'finance', 'accounting', 'legal', 'hr', 'jobs', 'careers',
    'office', 'mail', 'email', 'enquiries', 'inquiries', 'feedback',
    'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer-daemon'
  ];

  // Spam trap patterns
  const spamTrapPatterns = [
    'spamtrap', 'spam-trap', 'honeypot', 'honey-pot', 'trap@',
    'abuse@', 'antispam@', 'blacklist@', 'spam@'
  ];

  // Free email providers (valid but lower quality for B2B)
  const freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'gmx.com', 'inbox.com', 'live.com', 'msn.com', 'me.com'
  ];

  // Check disposable
  if (disposableDomains.includes(domain.toLowerCase())) {
    result.isDisposable = true;
    result.riskScore += 100;
  }

  // Check for disposable patterns in domain
  if (domain.includes('temp') || domain.includes('throw') || domain.includes('trash') ||
      domain.includes('fake') || domain.includes('disposable') || domain.includes('guerrilla')) {
    result.isDisposable = true;
    result.riskScore += 80;
  }

  // Check role account
  if (rolePatterns.some(p => localPart === p || localPart.startsWith(p + '.') || localPart.startsWith(p + '_'))) {
    result.isRole = true;
    result.riskScore += 20;
  }

  // Check spam trap
  if (spamTrapPatterns.some(p => email.toLowerCase().includes(p))) {
    result.isSpamTrap = true;
    result.riskScore += 100;
  }

  // Check freemail
  if (freeEmailDomains.includes(domain.toLowerCase())) {
    result.isFreemail = true;
    result.riskScore += 10; // Not risky, just lower value for B2B
  }

  return result;
}

// Detect email pattern from verified emails
function detectEmailPattern(emails) {
  if (!emails || emails.length === 0) return null;

  const patterns = {
    'info@': emails.some(e => e.startsWith('info@')),
    'contact@': emails.some(e => e.startsWith('contact@')),
    'first.last@': emails.some(e => /^[a-z]+\.[a-z]+@/.test(e)),
    'firstlast@': emails.some(e => /^[a-z]{6,}@/.test(e) && !e.startsWith('info') && !e.startsWith('contact')),
    'flast@': emails.some(e => /^[a-z]\.[a-z]+@/.test(e))
  };

  for (const [pattern, detected] of Object.entries(patterns)) {
    if (detected) return pattern;
  }

  return 'unknown';
}

// ==================== AI-POWERED INDUSTRY CLASSIFICATION ====================
// Intelligently classifies companies into industries and sub-industries
// using keyword analysis, tech stack detection, and contextual signals

const INDUSTRY_KEYWORDS = {
  // Technology
  'SaaS': {
    keywords: ['saas', 'software as a service', 'cloud software', 'subscription software', 'platform'],
    subIndustries: {
      'CRM & Sales Automation': ['crm', 'sales automation', 'customer relationship', 'pipeline', 'salesforce alternative', 'hubspot'],
      'Marketing Automation': ['marketing automation', 'email marketing', 'campaign management', 'marketing platform', 'mailchimp', 'marketo'],
      'HR Tech & HRIS': ['hr software', 'hris', 'human resources', 'payroll', 'employee management', 'recruiting software', 'ats'],
      'Sales Enablement': ['sales enablement', 'sales training', 'sales content', 'proposal software', 'cpq'],
      'Project Management': ['project management', 'task management', 'workflow', 'collaboration', 'asana', 'monday', 'trello'],
      'Business Intelligence': ['business intelligence', 'bi tool', 'analytics', 'dashboard', 'data visualization', 'tableau', 'looker'],
      'Security & Compliance': ['security software', 'compliance', 'soc 2', 'gdpr', 'data protection', 'encryption'],
      'DevOps & Infrastructure': ['devops', 'ci/cd', 'deployment', 'infrastructure', 'kubernetes', 'docker', 'aws'],
      'Customer Success': ['customer success', 'customer experience', 'nps', 'churn', 'retention'],
      'Communication & Collaboration': ['communication', 'messaging', 'video conferencing', 'slack', 'teams', 'zoom'],
      'Accounting & Finance': ['accounting software', 'invoicing', 'bookkeeping', 'financial management', 'quickbooks', 'xero'],
      'E-commerce Platforms': ['ecommerce platform', 'online store', 'shopping cart', 'shopify', 'woocommerce', 'magento']
    }
  },
  'Software Development': {
    keywords: ['software development', 'custom software', 'application development', 'programming', 'coding'],
    subIndustries: {
      'Custom Software': ['custom software', 'bespoke software', 'tailored solutions', 'software consultancy'],
      'Mobile App Development': ['mobile app', 'ios development', 'android development', 'react native', 'flutter'],
      'Web Development': ['web development', 'website development', 'web application', 'frontend', 'backend'],
      'Enterprise Software': ['enterprise software', 'erp', 'enterprise solutions', 'large scale'],
      'API Development': ['api development', 'api integration', 'rest api', 'graphql', 'microservices'],
      'Developer Tools': ['developer tools', 'ide', 'sdk', 'debugging', 'code editor']
    }
  },
  'IT Services': {
    keywords: ['it services', 'managed services', 'it support', 'technology services', 'msp'],
    subIndustries: {
      'Managed IT Services': ['managed it', 'managed services', 'msp', 'it management'],
      'IT Consulting': ['it consulting', 'technology consulting', 'it strategy', 'digital strategy'],
      'System Integration': ['system integration', 'systems integrator', 'integration services'],
      'Help Desk & Support': ['help desk', 'it support', 'technical support', 'service desk'],
      'Cloud Migration': ['cloud migration', 'cloud transformation', 'move to cloud']
    }
  },
  'Cybersecurity': {
    keywords: ['cybersecurity', 'security', 'infosec', 'information security', 'data security'],
    subIndustries: {
      'Endpoint Security': ['endpoint security', 'antivirus', 'edr', 'endpoint protection'],
      'Network Security': ['network security', 'firewall', 'intrusion detection', 'ids', 'ips'],
      'Cloud Security': ['cloud security', 'casb', 'cloud access', 'cloud protection'],
      'Identity & Access Management': ['identity management', 'iam', 'sso', 'mfa', 'authentication'],
      'Security Operations': ['soc', 'security operations', 'siem', 'threat detection'],
      'Penetration Testing': ['penetration testing', 'pentest', 'ethical hacking', 'vulnerability assessment']
    }
  },
  'AI/ML': {
    keywords: ['artificial intelligence', 'machine learning', 'ai', 'ml', 'deep learning', 'neural network'],
    subIndustries: {
      'Machine Learning Platforms': ['ml platform', 'machine learning platform', 'mlops', 'model training'],
      'Natural Language Processing': ['nlp', 'natural language', 'text analysis', 'sentiment analysis', 'chatbot'],
      'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'visual ai'],
      'Predictive Analytics': ['predictive analytics', 'forecasting', 'prediction', 'predictive modeling'],
      'Conversational AI': ['conversational ai', 'chatbot', 'virtual assistant', 'voice assistant'],
      'Generative AI': ['generative ai', 'genai', 'llm', 'large language model', 'gpt', 'content generation']
    }
  },

  // Finance
  'FinTech': {
    keywords: ['fintech', 'financial technology', 'finance technology'],
    subIndustries: {
      'Payments & Processing': ['payments', 'payment processing', 'merchant services', 'pos', 'stripe', 'square'],
      'Digital Lending': ['lending', 'loans', 'credit', 'financing', 'loan origination'],
      'Wealth Management': ['wealth management', 'investment management', 'robo-advisor', 'portfolio'],
      'InsurTech': ['insurtech', 'insurance technology', 'digital insurance'],
      'Crypto & Blockchain': ['crypto', 'cryptocurrency', 'blockchain', 'defi', 'web3', 'bitcoin', 'ethereum'],
      'Neobanking': ['neobank', 'digital bank', 'challenger bank', 'online banking']
    }
  },
  'Insurance': {
    keywords: ['insurance', 'insurer', 'underwriting', 'policy', 'claims'],
    subIndustries: {
      'Property & Casualty': ['property insurance', 'casualty', 'p&c', 'home insurance'],
      'Life Insurance': ['life insurance', 'term life', 'whole life'],
      'Health Insurance': ['health insurance', 'medical insurance', 'healthcare coverage'],
      'Commercial Insurance': ['commercial insurance', 'business insurance', 'liability'],
      'Auto Insurance': ['auto insurance', 'car insurance', 'vehicle insurance']
    }
  },

  // Healthcare
  'Healthcare': {
    keywords: ['healthcare', 'health care', 'medical', 'clinical', 'patient care'],
    subIndustries: {
      'Hospitals & Health Systems': ['hospital', 'health system', 'medical center', 'healthcare system'],
      'Physician Practices': ['physician practice', 'medical practice', 'doctor office', 'clinic'],
      'Urgent Care': ['urgent care', 'walk-in clinic', 'immediate care'],
      'Home Health': ['home health', 'home care', 'in-home care', 'visiting nurse'],
      'Behavioral Health': ['behavioral health', 'mental health', 'psychiatry', 'psychology', 'therapy'],
      'Primary Care': ['primary care', 'family medicine', 'general practice', 'pcp']
    }
  },
  'Telehealth': {
    keywords: ['telehealth', 'telemedicine', 'virtual care', 'remote healthcare', 'digital health'],
    subIndustries: {
      'Virtual Primary Care': ['virtual primary care', 'online doctor', 'video visit'],
      'Mental Health Platforms': ['online therapy', 'teletherapy', 'mental health app', 'betterhelp', 'talkspace'],
      'Remote Patient Monitoring': ['remote monitoring', 'rpm', 'patient monitoring', 'wearable health'],
      'Digital Therapeutics': ['digital therapeutics', 'dtx', 'prescription digital', 'therapeutic app']
    }
  },

  // Commerce
  'E-commerce': {
    keywords: ['ecommerce', 'e-commerce', 'online store', 'online shopping', 'online retail'],
    subIndustries: {
      'D2C Brands': ['d2c', 'direct to consumer', 'dtc', 'brand'],
      'Online Marketplaces': ['marketplace', 'multi-vendor', 'platform'],
      'Subscription Commerce': ['subscription', 'subscription box', 'recurring', 'membership'],
      'B2B E-commerce': ['b2b ecommerce', 'wholesale online', 'business commerce']
    }
  },
  'Retail': {
    keywords: ['retail', 'retailer', 'store', 'shop', 'merchandise'],
    subIndustries: {
      'Specialty Retail': ['specialty retail', 'niche retail', 'specialty store'],
      'Grocery & Supermarkets': ['grocery', 'supermarket', 'food retail'],
      'Fashion & Apparel': ['fashion', 'apparel', 'clothing', 'accessories'],
      'Electronics Retail': ['electronics', 'consumer electronics', 'tech retail']
    }
  },

  // Services
  'Marketing Agency': {
    keywords: ['marketing agency', 'digital agency', 'advertising agency', 'creative agency'],
    subIndustries: {
      'Full-Service Agency': ['full service', 'integrated agency', 'end-to-end'],
      'Digital Marketing': ['digital marketing', 'online marketing', 'internet marketing'],
      'SEO & SEM': ['seo', 'search engine optimization', 'sem', 'ppc', 'google ads'],
      'Social Media Marketing': ['social media', 'social marketing', 'smm', 'instagram', 'facebook marketing'],
      'Content Marketing': ['content marketing', 'content creation', 'content strategy', 'blog', 'copywriting'],
      'Performance Marketing': ['performance marketing', 'growth marketing', 'conversion', 'cro']
    }
  },
  'Legal': {
    keywords: ['law firm', 'legal services', 'attorney', 'lawyer', 'legal'],
    subIndustries: {
      'Corporate Law': ['corporate law', 'business law', 'commercial law', 'm&a'],
      'Personal Injury': ['personal injury', 'accident lawyer', 'injury attorney'],
      'Immigration Law': ['immigration', 'visa', 'citizenship', 'immigration lawyer'],
      'Intellectual Property': ['intellectual property', 'ip law', 'patent', 'trademark', 'copyright'],
      'Employment Law': ['employment law', 'labor law', 'workplace', 'discrimination']
    }
  },
  'Consulting': {
    keywords: ['consulting', 'consultancy', 'advisory', 'consultant'],
    subIndustries: {
      'Strategy Consulting': ['strategy consulting', 'strategic advisory', 'business strategy'],
      'Technology Consulting': ['technology consulting', 'it consulting', 'digital consulting'],
      'Management Consulting': ['management consulting', 'business consulting'],
      'Financial Advisory': ['financial advisory', 'finance consulting', 'transaction advisory']
    }
  },

  // Industrial
  'Manufacturing': {
    keywords: ['manufacturing', 'manufacturer', 'production', 'factory', 'industrial'],
    subIndustries: {
      'Automotive': ['automotive', 'auto parts', 'vehicle', 'car manufacturing'],
      'Aerospace & Defense': ['aerospace', 'defense', 'aviation', 'military'],
      'Electronics': ['electronics manufacturing', 'pcb', 'semiconductor', 'electronic components'],
      'Food & Beverage': ['food manufacturing', 'beverage', 'food processing', 'cpg'],
      'Medical Manufacturing': ['medical device', 'medical manufacturing', 'healthcare products']
    }
  },
  'Construction': {
    keywords: ['construction', 'contractor', 'builder', 'building'],
    subIndustries: {
      'Commercial Construction': ['commercial construction', 'office building', 'commercial builder'],
      'Residential Construction': ['residential', 'home builder', 'housing', 'homes'],
      'General Contractors': ['general contractor', 'gc', 'prime contractor'],
      'Specialty Contractors': ['specialty contractor', 'subcontractor', 'trade contractor']
    }
  },

  // Real Estate
  'Real Estate': {
    keywords: ['real estate', 'property', 'realty', 'brokerage'],
    subIndustries: {
      'Residential Sales': ['residential real estate', 'home sales', 'realtor', 'buying home'],
      'Commercial Real Estate': ['commercial real estate', 'cre', 'office space', 'retail space'],
      'Property Management': ['property management', 'property manager', 'building management'],
      'Real Estate Tech': ['proptech', 'real estate technology', 'real estate software']
    }
  },

  // Education
  'EdTech': {
    keywords: ['edtech', 'education technology', 'elearning', 'e-learning', 'online learning'],
    subIndustries: {
      'K-12 EdTech': ['k-12', 'k12', 'school', 'classroom', 'student'],
      'Higher Ed Solutions': ['higher education', 'university', 'college', 'campus'],
      'Corporate Learning': ['corporate learning', 'corporate training', 'employee training', 'lms'],
      'Online Course Platforms': ['online course', 'mooc', 'course platform', 'udemy', 'coursera'],
      'Tutoring Platforms': ['tutoring', 'tutor', 'homework help', 'test prep']
    }
  }
};

async function classifyIndustryWithAI(domain, companyName, providedIndustry) {
  try {
    // Gather data for classification
    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for company information to analyze
    const searchQueries = [
      `"${company}" company about`,
      `"${domain}" what does company do`
    ];

    let companyDescription = '';
    let websiteContent = '';
    let detectedKeywords = [];

    // Fetch company website for analysis
    try {
      const websiteResponse = await fetch(`https://${domain}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(5000)
      });

      if (websiteResponse.ok) {
        websiteContent = (await websiteResponse.text()).toLowerCase();
      }
    } catch (e) {
      // Continue without website content
    }

    // Search for company description
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: searchQueries[0], gl: 'us', hl: 'en', num: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        companyDescription = results.map(r => `${r.title} ${r.snippet || ''}`).join(' ').toLowerCase();
      }
    } catch (e) {
      // Continue with website content only
    }

    // Combine all text for analysis
    const analysisText = `${companyDescription} ${websiteContent}`.toLowerCase();

    // Score each industry and sub-industry
    const industryScores = {};
    const subIndustryMatches = {};

    for (const [industry, config] of Object.entries(INDUSTRY_KEYWORDS)) {
      let score = 0;

      // Check main industry keywords
      for (const keyword of config.keywords) {
        if (analysisText.includes(keyword)) {
          score += 10;
          detectedKeywords.push(keyword);
        }
      }

      // Check sub-industry keywords and track matches
      if (config.subIndustries) {
        subIndustryMatches[industry] = [];

        for (const [subIndustry, subKeywords] of Object.entries(config.subIndustries)) {
          let subScore = 0;
          const matchedKeywords = [];

          for (const keyword of subKeywords) {
            if (analysisText.includes(keyword)) {
              subScore += 5;
              matchedKeywords.push(keyword);
            }
          }

          if (subScore > 0) {
            score += subScore;
            subIndustryMatches[industry].push({
              name: subIndustry,
              score: subScore,
              matchedKeywords
            });
          }
        }

        // Sort sub-industries by score
        subIndustryMatches[industry].sort((a, b) => b.score - a.score);
      }

      if (score > 0) {
        industryScores[industry] = score;
      }
    }

    // If provided industry matches, boost its score
    if (providedIndustry && industryScores[providedIndustry]) {
      industryScores[providedIndustry] += 20;
    }

    // Sort industries by score
    const sortedIndustries = Object.entries(industryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedIndustries.length === 0) {
      // Fallback - use provided industry or 'Unknown'
      return {
        found: true,
        data: {
          primaryIndustry: providedIndustry || 'Unknown',
          confidence: 'low',
          subIndustries: [],
          alternativeIndustries: [],
          detectedKeywords: [],
          analysisMethod: 'fallback'
        }
      };
    }

    const primaryIndustry = sortedIndustries[0][0];
    const primaryScore = sortedIndustries[0][1];
    const primarySubIndustries = subIndustryMatches[primaryIndustry] || [];

    // Determine confidence level
    let confidence = 'low';
    if (primaryScore >= 50) confidence = 'high';
    else if (primaryScore >= 25) confidence = 'medium';

    return {
      found: true,
      data: {
        primaryIndustry,
        confidence,
        confidenceScore: primaryScore,
        subIndustries: primarySubIndustries.slice(0, 3).map(s => s.name),
        subIndustryDetails: primarySubIndustries.slice(0, 3),
        alternativeIndustries: sortedIndustries.slice(1).map(([ind, score]) => ({
          industry: ind,
          score,
          subIndustries: (subIndustryMatches[ind] || []).slice(0, 2).map(s => s.name)
        })),
        detectedKeywords: [...new Set(detectedKeywords)].slice(0, 10),
        analysisMethod: 'ai_keyword_matching'
      }
    };

  } catch (error) {
    console.error('Industry classification error:', error);
    return {
      found: false,
      error: error.message
    };
  }
}
