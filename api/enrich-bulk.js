// Vercel Serverless Function - Bulk Enrichment with Outreach Intelligence
// Enriches companies with actionable data: WHY to reach out, WHEN to reach out, and PERSONALIZATION hooks

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { companies, enrichmentTypes = ['email', 'techStack', 'social', 'funding'] } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: 'companies array required' });
    }

    const MAX_BATCH = 10;
    const batch = companies.slice(0, MAX_BATCH);
    const results = [];

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
        companyName: name,
        enrichmentStatus: 'success',
        enrichedAt: new Date().toISOString(),
        enrichment: {},
        // NEW: Outreach Intelligence
        outreachIntelligence: {
          whyReachOut: [],
          whenToReachOut: null,
          urgencyScore: 0,
          personalization: [],
          icebreakers: [],
          painPoints: [],
          valueProps: []
        }
      };

      // Run all enrichments
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
          enrichSocialWithInsights(domain, name).then(data => {
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
          enrichFundingWithSignals(domain, name).then(data => {
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

      // Generate Outreach Intelligence based on all enrichment data
      generateOutreachIntelligence(enrichedData);

      // Calculate overall enrichment score
      let score = 0;
      if (enrichedData.primaryEmail) score += 20;
      if (enrichedData.technologies?.length > 0) score += 20;
      if (enrichedData.socialScore > 0) score += Math.min(20, enrichedData.socialScore / 5);
      if (enrichedData.growthScore > 0) score += Math.min(20, enrichedData.growthScore / 5);
      if (enrichedData.outreachIntelligence.whyReachOut.length > 0) score += 20;

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

// ==================== OUTREACH INTELLIGENCE ENGINE ====================

function generateOutreachIntelligence(data) {
  const intel = data.outreachIntelligence;
  const tech = data.enrichment.techStack || {};
  const social = data.enrichment.social || {};
  const funding = data.enrichment.funding || {};
  const technologies = data.technologies || [];

  // ========== WHY TO REACH OUT ==========

  // Tech-based reasons
  if (technologies.includes('HubSpot')) {
    intel.whyReachOut.push({
      reason: 'Using HubSpot CRM',
      insight: 'They invest in marketing automation - likely open to tools that integrate with their stack',
      angle: 'Integration or complementary solution'
    });
  }

  if (technologies.includes('Salesforce')) {
    intel.whyReachOut.push({
      reason: 'Salesforce customer',
      insight: 'Enterprise-level CRM investment signals budget and sophistication',
      angle: 'Enterprise solution positioning'
    });
  }

  if (technologies.some(t => ['Intercom', 'Drift', 'Zendesk'].includes(t))) {
    intel.whyReachOut.push({
      reason: 'Prioritizes customer communication',
      insight: 'Live chat tools show they value real-time customer engagement',
      angle: 'Customer experience enhancement'
    });
  }

  if (technologies.includes('Stripe') || technologies.includes('Shopify')) {
    intel.whyReachOut.push({
      reason: 'E-commerce/payments enabled',
      insight: 'They process transactions online - focus on revenue growth angles',
      angle: 'Revenue optimization or conversion improvement'
    });
  }

  if (technologies.some(t => ['Google Analytics', 'Mixpanel', 'Segment', 'Hotjar'].includes(t))) {
    intel.whyReachOut.push({
      reason: 'Data-driven decision making',
      insight: 'Multiple analytics tools = they measure everything. Come with metrics.',
      angle: 'Lead with ROI and measurable outcomes'
    });
  }

  // Funding-based reasons
  if (funding.funding?.recentRound) {
    intel.whyReachOut.push({
      reason: `Recently raised ${funding.funding.amount || 'funding'}`,
      insight: 'Fresh capital means active spending on growth initiatives',
      angle: 'Growth acceleration partner',
      urgency: 'high'
    });
    intel.urgencyScore += 30;
  }

  if (funding.hiring?.isHiring) {
    intel.whyReachOut.push({
      reason: `Actively hiring ${funding.hiring.openRoles || ''} roles`,
      insight: 'Expanding team = scaling operations, likely need new tools',
      angle: 'Scale enablement'
    });
    intel.urgencyScore += 20;
  }

  // Social-based reasons
  const socialProfiles = social.profiles || {};
  const activePlatforms = Object.keys(socialProfiles).filter(k => socialProfiles[k]);

  if (activePlatforms.length >= 4) {
    intel.whyReachOut.push({
      reason: 'Strong social media presence',
      insight: 'Investing heavily in brand building across channels',
      angle: 'Brand amplification or audience growth'
    });
  }

  if (socialProfiles.tiktok) {
    intel.whyReachOut.push({
      reason: 'Active on TikTok',
      insight: 'Targeting younger demographics, likely experimenting with new channels',
      angle: 'Innovative marketing partner'
    });
  }

  if (activePlatforms.length === 0) {
    intel.whyReachOut.push({
      reason: 'Limited social presence',
      insight: 'Potential gap in their marketing - could be an opportunity',
      angle: 'Help them build brand awareness'
    });
  }

  // ========== WHEN TO REACH OUT ==========

  let timing = {
    bestTime: 'Tuesday-Thursday, 9-11am their local time',
    urgency: 'normal',
    triggers: []
  };

  if (funding.funding?.recentRound) {
    timing.urgency = 'high';
    timing.triggers.push('Recent funding - reach out within 30 days while budget is fresh');
    timing.bestTime = 'ASAP - Monday morning to get ahead of other vendors';
  }

  if (funding.hiring?.isHiring && funding.hiring.departments?.includes('Sales')) {
    timing.urgency = 'high';
    timing.triggers.push('Hiring sales team - need tools to support new reps');
  }

  if (funding.hiring?.isHiring && funding.hiring.departments?.includes('Marketing')) {
    timing.urgency = 'high';
    timing.triggers.push('Marketing team growth - evaluating new solutions');
  }

  // Q4/Q1 budget timing
  const month = new Date().getMonth();
  if (month >= 9 || month <= 1) {
    timing.triggers.push('Budget season - decision makers planning next year spend');
  }

  intel.whenToReachOut = timing;

  // ========== PERSONALIZATION HOOKS ==========

  // Company-specific personalization
  if (data.companyName) {
    intel.personalization.push({
      type: 'company',
      hook: `Noticed ${data.companyName}'s growth`,
      usage: 'Subject line or opening sentence'
    });
  }

  // Tech stack personalization
  if (technologies.length > 0) {
    const mainTech = technologies[0];
    intel.personalization.push({
      type: 'tech_stack',
      hook: `Saw you're using ${mainTech}`,
      usage: `Reference their tech stack to show you did research`
    });

    if (technologies.includes('React') || technologies.includes('Webflow')) {
      intel.personalization.push({
        type: 'tech_compliment',
        hook: 'Your website/product looks great',
        usage: 'Genuine compliment about their tech choices'
      });
    }
  }

  // Social personalization
  if (socialProfiles.linkedin?.snippet) {
    intel.personalization.push({
      type: 'linkedin',
      hook: 'Reference their LinkedIn company updates',
      usage: socialProfiles.linkedin.snippet.slice(0, 100) + '...'
    });
  }

  if (socialProfiles.twitter?.snippet) {
    intel.personalization.push({
      type: 'twitter',
      hook: 'Mention their recent tweet or thread',
      usage: 'Shows you follow their content'
    });
  }

  // ========== ICEBREAKERS ==========

  intel.icebreakers = generateIcebreakers(data);

  // ========== PAIN POINTS (Inferred) ==========

  intel.painPoints = inferPainPoints(data);

  // ========== VALUE PROPOSITIONS ==========

  intel.valueProps = generateValueProps(data);

  // Calculate final urgency score (0-100)
  intel.urgencyScore = Math.min(100, intel.urgencyScore + (intel.whyReachOut.length * 10));
}

function generateIcebreakers(data) {
  const icebreakers = [];
  const tech = data.technologies || [];
  const social = data.enrichment.social?.profiles || {};
  const funding = data.enrichment.funding || {};

  if (funding.funding?.recentRound) {
    icebreakers.push({
      opener: `Congrats on the recent funding round!`,
      context: 'Celebrate their success before pitching',
      effectiveness: 'high'
    });
  }

  if (funding.hiring?.isHiring) {
    icebreakers.push({
      opener: `Noticed you're growing the team - exciting times!`,
      context: 'Acknowledge their growth trajectory',
      effectiveness: 'high'
    });
  }

  if (social.tiktok) {
    icebreakers.push({
      opener: `Love what you're doing on TikTok`,
      context: 'Shows you actually looked at their content',
      effectiveness: 'medium'
    });
  }

  if (tech.includes('Calendly')) {
    icebreakers.push({
      opener: `I see you use Calendly - made booking easy for your customers`,
      context: 'Small observation shows attention to detail',
      effectiveness: 'medium'
    });
  }

  // Generic but personalized
  icebreakers.push({
    opener: `Been following ${data.companyName || 'your company'}'s journey`,
    context: 'Works for any company, implies you did research',
    effectiveness: 'medium'
  });

  return icebreakers;
}

function inferPainPoints(data) {
  const painPoints = [];
  const tech = data.technologies || [];
  const social = data.enrichment.social || {};
  const funding = data.enrichment.funding || {};

  // Tech-based pain points
  if (!tech.some(t => ['HubSpot', 'Salesforce', 'Pipedrive'].includes(t))) {
    painPoints.push({
      pain: 'May lack structured CRM/sales process',
      implication: 'Leads falling through cracks, no visibility into pipeline',
      opportunity: 'Help them organize and track deals'
    });
  }

  if (!tech.some(t => ['Intercom', 'Drift', 'Zendesk'].includes(t))) {
    painPoints.push({
      pain: 'No live chat or support tool detected',
      implication: 'Missing out on real-time customer engagement',
      opportunity: 'Faster response times = more conversions'
    });
  }

  if (!tech.some(t => ['Mixpanel', 'Amplitude', 'Heap'].includes(t))) {
    painPoints.push({
      pain: 'Limited product analytics',
      implication: 'Making decisions without user behavior data',
      opportunity: 'Data-driven product improvements'
    });
  }

  // Social-based pain points
  const platformCount = Object.values(social.profiles || {}).filter(Boolean).length;
  if (platformCount < 2) {
    painPoints.push({
      pain: 'Weak social media presence',
      implication: 'Missing organic reach and brand awareness',
      opportunity: 'Build audience and reduce CAC'
    });
  }

  // Growth-based pain points
  if (funding.hiring?.isHiring) {
    painPoints.push({
      pain: 'Scaling challenges',
      implication: 'New hires need tools and processes',
      opportunity: 'Help them scale efficiently'
    });
  }

  return painPoints;
}

function generateValueProps(data) {
  const valueProps = [];
  const tech = data.technologies || [];
  const funding = data.enrichment.funding || {};

  // Match value props to their situation
  if (funding.hiring?.isHiring) {
    valueProps.push({
      prop: 'Scale without adding headcount',
      angle: 'Automation and efficiency',
      proof: 'Companies like X saved Y hours/week'
    });
  }

  if (tech.some(t => ['Google Analytics', 'Mixpanel'].includes(t))) {
    valueProps.push({
      prop: 'Measurable ROI from day one',
      angle: 'Data-driven, metrics they can track',
      proof: 'Average customer sees X% improvement in Y'
    });
  }

  if (funding.funding?.recentRound) {
    valueProps.push({
      prop: 'Accelerate growth with fresh capital',
      angle: 'Strategic investment in tools',
      proof: 'Portfolio companies seeing 2-3x faster growth'
    });
  }

  // Universal value props
  valueProps.push({
    prop: 'Quick time to value',
    angle: 'See results in first week',
    proof: 'Most teams fully onboarded in X days'
  });

  return valueProps;
}

// ==================== ENRICHMENT FUNCTIONS ====================

async function enrichEmail(domain, name) {
  const patterns = [
    `info@${domain}`,
    `hello@${domain}`,
    `contact@${domain}`,
    `sales@${domain}`,
    `team@${domain}`
  ];

  try {
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    const html = await response.text();

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = html.match(emailRegex) || [];

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
        source: 'website',
        verified: true
      };
    }
  } catch {
    // Website fetch failed
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

    const techPatterns = {
      'HubSpot': [/hubspot/i, /hs-scripts/i, /hbspt/i],
      'Salesforce': [/salesforce/i, /force\.com/i, /pardot/i],
      'Google Analytics': [/google-analytics/i, /gtag/i, /googletagmanager/i, /GA4/i],
      'Intercom': [/intercom/i, /widget\.intercom/i],
      'Drift': [/drift\.com/i, /driftt/i],
      'Stripe': [/stripe\.com/i, /js\.stripe/i],
      'Shopify': [/shopify/i, /cdn\.shopify/i],
      'WordPress': [/wp-content/i, /wp-includes/i],
      'React': [/react/i, /_next/i, /nextjs/i],
      'Webflow': [/webflow/i],
      'Segment': [/segment\.com/i, /analytics\.js/i],
      'Mixpanel': [/mixpanel/i],
      'Amplitude': [/amplitude/i],
      'Hotjar': [/hotjar/i],
      'FullStory': [/fullstory/i],
      'Calendly': [/calendly/i],
      'Zendesk': [/zendesk/i, /zdassets/i],
      'Freshdesk': [/freshdesk/i],
      'Pipedrive': [/pipedrive/i],
      'Mailchimp': [/mailchimp/i, /chimpstatic/i],
      'Klaviyo': [/klaviyo/i],
      'ActiveCampaign': [/activecampaign/i],
      'Crisp': [/crisp\.chat/i],
      'LiveChat': [/livechat/i],
      'Typeform': [/typeform/i],
      'Clearbit': [/clearbit/i],
      'ZoomInfo': [/zoominfo/i],
      'Gong': [/gong\.io/i],
      'Outreach': [/outreach\.io/i],
      'SalesLoft': [/salesloft/i]
    };

    for (const [tech, patterns] of Object.entries(techPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          technologies.push(tech);
          break;
        }
      }
    }

    // Generate signals based on tech
    if (technologies.some(t => ['HubSpot', 'Salesforce', 'Pipedrive'].includes(t))) {
      signals.push({ signal: 'Uses enterprise CRM', category: 'sales_maturity' });
    }
    if (technologies.some(t => ['Stripe', 'Shopify'].includes(t))) {
      signals.push({ signal: 'E-commerce enabled', category: 'business_model' });
    }
    if (technologies.some(t => ['Intercom', 'Drift', 'Zendesk', 'Crisp'].includes(t))) {
      signals.push({ signal: 'Customer support prioritized', category: 'customer_focus' });
    }
    if (technologies.some(t => ['Mixpanel', 'Amplitude', 'FullStory'].includes(t))) {
      signals.push({ signal: 'Product-led growth signals', category: 'growth_strategy' });
    }
    if (technologies.some(t => ['Gong', 'Outreach', 'SalesLoft'].includes(t))) {
      signals.push({ signal: 'Sales-led organization', category: 'growth_strategy' });
    }
    if (technologies.some(t => ['Mailchimp', 'Klaviyo', 'ActiveCampaign'].includes(t))) {
      signals.push({ signal: 'Email marketing active', category: 'marketing' });
    }

    return {
      found: technologies.length > 0,
      technologies,
      signals,
      techMaturity: technologies.length >= 5 ? 'high' : technologies.length >= 2 ? 'medium' : 'low'
    };
  } catch {
    return { found: false, technologies: [], signals: [], techMaturity: 'unknown' };
  }
}

async function enrichSocialWithInsights(domain, name) {
  const SERPER_KEY = process.env.SERPER_API_KEY;
  const searchName = name || domain.replace(/\.(com|io|co|net|org)$/i, '');

  const profiles = {
    instagram: null,
    tiktok: null,
    twitter: null,
    youtube: null,
    facebook: null,
    linkedin: null
  };

  // Enhanced data from searches
  let recentActivity = [];
  let engagementSignals = [];
  let contentThemes = [];

  if (!SERPER_KEY) {
    return { profiles, socialScore: 0, signals: [], insights: [], recentActivity: [], engagementSignals: [], contentThemes: [] };
  }

  try {
    // Basic social profile searches
    const socialSearches = [
      { platform: 'linkedin', query: `site:linkedin.com/company "${searchName}"` },
      { platform: 'twitter', query: `site:twitter.com OR site:x.com "${searchName}"` },
      { platform: 'instagram', query: `site:instagram.com "${searchName}"` },
      { platform: 'tiktok', query: `site:tiktok.com "@" "${searchName}"` },
      { platform: 'youtube', query: `site:youtube.com/@ "${searchName}"` },
      { platform: 'facebook', query: `site:facebook.com "${searchName}"` }
    ];

    // Enhanced searches for more intelligence
    const enhancedSearches = [
      // Recent LinkedIn posts/activity
      { type: 'linkedin_activity', query: `site:linkedin.com/posts "${searchName}"` },
      // Recent tweets
      { type: 'twitter_activity', query: `site:twitter.com "${searchName}" (announced OR launched OR excited OR hiring)` },
      // Company mentions and engagement
      { type: 'mentions', query: `"${searchName}" (review OR testimonial OR customer OR partnered)` },
      // Product/feature launches
      { type: 'launches', query: `"${searchName}" (launched OR introducing OR new feature OR announcing)` },
      // Awards and recognition
      { type: 'awards', query: `"${searchName}" (award OR recognized OR top OR best OR featured)` }
    ];

    // Run basic profile searches
    const searchPromises = socialSearches.map(async ({ platform, query }) => {
      try {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 3 }),
        });

        if (!response.ok) return { platform, data: null };

        const data = await response.json();
        const organic = data.organic || [];

        for (const result of organic) {
          const url = result.link || '';

          if (platform === 'linkedin' && url.includes('linkedin.com/company/')) {
            // Extract follower count from snippet if available
            const followerMatch = (result.snippet || '').match(/(\d+[,\d]*)\s*followers?/i);
            return {
              platform,
              data: {
                url,
                title: result.title,
                snippet: result.snippet,
                followers: followerMatch ? followerMatch[1] : null
              }
            };
          }
          if (platform === 'twitter' && (url.includes('twitter.com/') || url.includes('x.com/'))) {
            if (!url.includes('/status/')) {
              const followerMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*followers?/i);
              return {
                platform,
                data: {
                  url,
                  title: result.title,
                  snippet: result.snippet,
                  followers: followerMatch ? followerMatch[1] : null
                }
              };
            }
          }
          if (platform === 'instagram' && url.includes('instagram.com/') && !url.includes('/p/')) {
            const followerMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*followers?/i);
            return {
              platform,
              data: {
                url,
                title: result.title,
                snippet: result.snippet,
                followers: followerMatch ? followerMatch[1] : null
              }
            };
          }
          if (platform === 'tiktok' && url.includes('tiktok.com/@')) {
            const followerMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*followers?/i);
            const likesMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*likes?/i);
            return {
              platform,
              data: {
                url,
                title: result.title,
                snippet: result.snippet,
                followers: followerMatch ? followerMatch[1] : null,
                likes: likesMatch ? likesMatch[1] : null
              }
            };
          }
          if (platform === 'youtube' && (url.includes('/@') || url.includes('/channel/') || url.includes('/c/'))) {
            const subMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*subscribers?/i);
            return {
              platform,
              data: {
                url,
                title: result.title,
                snippet: result.snippet,
                subscribers: subMatch ? subMatch[1] : null
              }
            };
          }
          if (platform === 'facebook' && url.includes('facebook.com/') && !url.includes('/posts/')) {
            const likesMatch = (result.snippet || '').match(/(\d+[,\d\.]*[KMkm]?)\s*(?:people\s+)?(?:like|follow)/i);
            return {
              platform,
              data: {
                url,
                title: result.title,
                snippet: result.snippet,
                followers: likesMatch ? likesMatch[1] : null
              }
            };
          }
        }

        return { platform, data: null };
      } catch {
        return { platform, data: null };
      }
    });

    // Run enhanced searches for more intelligence
    const enhancedPromises = enhancedSearches.map(async ({ type, query }) => {
      try {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 3 }),
        });

        if (!response.ok) return { type, results: [] };

        const data = await response.json();
        return { type, results: data.organic || [] };
      } catch {
        return { type, results: [] };
      }
    });

    const [searchResults, enhancedResults] = await Promise.all([
      Promise.all(searchPromises),
      Promise.all(enhancedPromises)
    ]);

    // Process basic profile results
    for (const { platform, data } of searchResults) {
      profiles[platform] = data;
    }

    // Process enhanced results for additional intelligence
    for (const { type, results } of enhancedResults) {
      if (results.length === 0) continue;

      if (type === 'linkedin_activity' || type === 'twitter_activity') {
        for (const result of results.slice(0, 2)) {
          recentActivity.push({
            platform: type.replace('_activity', ''),
            title: result.title,
            snippet: result.snippet?.slice(0, 150) + '...',
            url: result.link,
            date: result.date || null
          });
        }
      }

      if (type === 'mentions') {
        for (const result of results) {
          const snippet = (result.snippet || '').toLowerCase();
          if (snippet.includes('partner') || snippet.includes('customer')) {
            engagementSignals.push({
              type: 'partnership',
              detail: result.title,
              source: result.link
            });
          }
          if (snippet.includes('review') || snippet.includes('testimonial')) {
            engagementSignals.push({
              type: 'social_proof',
              detail: result.title,
              source: result.link
            });
          }
        }
      }

      if (type === 'launches') {
        for (const result of results.slice(0, 2)) {
          recentActivity.push({
            platform: 'news',
            title: result.title,
            snippet: result.snippet?.slice(0, 150),
            url: result.link,
            type: 'launch'
          });
        }
      }

      if (type === 'awards') {
        for (const result of results) {
          const snippet = (result.snippet || '').toLowerCase();
          if (snippet.includes('award') || snippet.includes('recognized') || snippet.includes('top')) {
            engagementSignals.push({
              type: 'recognition',
              detail: result.title,
              source: result.link
            });
          }
        }
      }
    }

    // Analyze content themes from snippets
    const allSnippets = [
      ...Object.values(profiles).filter(Boolean).map(p => p.snippet || ''),
      ...recentActivity.map(a => a.snippet || '')
    ].join(' ').toLowerCase();

    const themePatterns = [
      { theme: 'Innovation', keywords: ['innovative', 'disrupt', 'revolutioniz', 'transform', 'cutting-edge'] },
      { theme: 'Customer Focus', keywords: ['customer', 'client', 'user experience', 'satisfaction'] },
      { theme: 'Growth', keywords: ['growth', 'scale', 'expand', 'growing', 'hiring'] },
      { theme: 'Sustainability', keywords: ['sustainable', 'green', 'eco', 'environment', 'carbon'] },
      { theme: 'Technology', keywords: ['ai', 'machine learning', 'automation', 'tech', 'digital'] },
      { theme: 'Community', keywords: ['community', 'giving back', 'nonprofit', 'charity', 'social impact'] }
    ];

    for (const { theme, keywords } of themePatterns) {
      if (keywords.some(kw => allSnippets.includes(kw))) {
        contentThemes.push(theme);
      }
    }

  } catch (err) {
    console.error('Social enrichment error:', err);
  }

  const activePlatforms = Object.values(profiles).filter(Boolean);
  let socialScore = Math.min(100, activePlatforms.length * 15);

  // Boost score for additional signals
  if (recentActivity.length > 0) socialScore += 10;
  if (engagementSignals.length > 0) socialScore += 10;
  socialScore = Math.min(100, socialScore);

  const signals = [];
  const insights = [];

  if (profiles.linkedin) {
    signals.push({ signal: 'LinkedIn company page active', category: 'b2b' });
    insights.push('B2B focused - likely responds to LinkedIn outreach');
    if (profiles.linkedin.followers) {
      insights.push(`LinkedIn following: ${profiles.linkedin.followers}`);
    }
  }
  if (profiles.tiktok) {
    signals.push({ signal: 'TikTok presence', category: 'consumer' });
    insights.push('Targets younger demographics, innovative marketing approach');
    if (profiles.tiktok.followers) {
      insights.push(`TikTok followers: ${profiles.tiktok.followers}`);
    }
  }
  if (profiles.instagram) {
    signals.push({ signal: 'Instagram active', category: 'brand' });
    insights.push('Visual brand focus - appreciates good design');
  }
  if (profiles.youtube) {
    signals.push({ signal: 'YouTube channel', category: 'content' });
    insights.push('Invests in video content - long-form education approach');
  }
  if (activePlatforms.length >= 4) {
    signals.push({ signal: 'Strong omnichannel presence', category: 'maturity' });
    insights.push('Mature marketing org - likely has dedicated social team');
  }
  if (activePlatforms.length === 0) {
    signals.push({ signal: 'No social presence found', category: 'gap' });
    insights.push('Potential opportunity - may need help with brand awareness');
  }

  // Add signals from enhanced data
  if (recentActivity.length > 0) {
    signals.push({ signal: 'Recent social activity detected', category: 'engagement' });
  }
  if (engagementSignals.some(s => s.type === 'recognition')) {
    signals.push({ signal: 'Industry recognition/awards', category: 'credibility' });
  }
  if (engagementSignals.some(s => s.type === 'partnership')) {
    signals.push({ signal: 'Active partnerships', category: 'ecosystem' });
  }
  if (contentThemes.length > 0) {
    insights.push(`Content themes: ${contentThemes.join(', ')}`);
  }

  return {
    profiles,
    socialScore,
    signals,
    insights,
    platformCount: activePlatforms.length,
    recentActivity,
    engagementSignals,
    contentThemes
  };
}

async function enrichFundingWithSignals(domain, name) {
  const SERPER_KEY = process.env.SERPER_API_KEY;
  const searchName = name || domain.replace(/\.(com|io|co|net|org)$/i, '');

  let funding = null;
  let hiring = { isHiring: false, departments: [], openRoles: 0 };
  let news = [];
  let growthScore = 0;
  const signals = [];

  if (!SERPER_KEY) {
    return { funding, hiring, news, growthScore, signals };
  }

  try {
    // Search for funding news
    const fundingResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `"${searchName}" (funding OR raised OR series OR investment) -jobs`,
        num: 5
      }),
    });

    if (fundingResponse.ok) {
      const fundingData = await fundingResponse.json();
      const organic = fundingData.organic || [];

      for (const result of organic) {
        const title = (result.title || '').toLowerCase();
        const snippet = (result.snippet || '').toLowerCase();
        const combined = title + ' ' + snippet;

        // Look for funding amounts
        const amountMatch = combined.match(/\$(\d+(?:\.\d+)?)\s*(million|m|billion|b)/i);
        const seriesMatch = combined.match(/series\s*([a-e])/i);
        const seedMatch = combined.match(/seed\s*(round|funding)?/i);

        if (amountMatch || seriesMatch || seedMatch) {
          funding = {
            recentRound: true,
            amount: amountMatch ? `$${amountMatch[1]}${amountMatch[2].charAt(0).toUpperCase()}` : null,
            series: seriesMatch ? `Series ${seriesMatch[1].toUpperCase()}` : seedMatch ? 'Seed' : null,
            source: result.link,
            headline: result.title
          };
          signals.push({ signal: 'Recent funding detected', category: 'growth', urgency: 'high' });
          growthScore += 40;
          break;
        }
      }
    }

    // Search for hiring signals
    const hiringResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `"${searchName}" (hiring OR careers OR jobs OR "open positions")`,
        num: 5
      }),
    });

    if (hiringResponse.ok) {
      const hiringData = await hiringResponse.json();
      const organic = hiringData.organic || [];

      const departments = new Set();
      let totalRoles = 0;

      for (const result of organic) {
        const combined = ((result.title || '') + ' ' + (result.snippet || '')).toLowerCase();

        if (combined.includes('hiring') || combined.includes('career') || combined.includes('job') || combined.includes('position')) {
          hiring.isHiring = true;

          // Detect departments
          if (combined.match(/sales|account executive|sdr|bdr/)) departments.add('Sales');
          if (combined.match(/marketing|growth|demand gen/)) departments.add('Marketing');
          if (combined.match(/engineer|developer|software/)) departments.add('Engineering');
          if (combined.match(/product|pm|product manager/)) departments.add('Product');
          if (combined.match(/customer success|support|cx/)) departments.add('Customer Success');
          if (combined.match(/design|ux|ui/)) departments.add('Design');
          if (combined.match(/finance|accounting|operations/)) departments.add('Operations');

          // Try to count roles
          const roleMatch = combined.match(/(\d+)\s*(?:open\s*)?(?:positions?|roles?|jobs?)/);
          if (roleMatch) {
            totalRoles = Math.max(totalRoles, parseInt(roleMatch[1]));
          }
        }
      }

      if (hiring.isHiring) {
        hiring.departments = Array.from(departments);
        hiring.openRoles = totalRoles || departments.size * 2; // Estimate if not found
        signals.push({ signal: `Hiring in ${hiring.departments.join(', ') || 'multiple departments'}`, category: 'growth' });
        growthScore += 25;

        if (departments.has('Sales')) {
          signals.push({ signal: 'Expanding sales team', category: 'sales_growth', urgency: 'high' });
          growthScore += 15;
        }
        if (departments.has('Marketing')) {
          signals.push({ signal: 'Growing marketing team', category: 'marketing_growth' });
          growthScore += 10;
        }
      }
    }

    // Search for recent news/announcements
    const newsResponse = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: searchName, num: 3 }),
    });

    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      news = (newsData.news || []).map(n => ({
        title: n.title,
        source: n.source,
        date: n.date,
        link: n.link
      }));

      if (news.length > 0) {
        signals.push({ signal: 'Recent press coverage', category: 'visibility' });
        growthScore += 10;
      }
    }

  } catch (err) {
    console.error('Funding enrichment error:', err);
  }

  return {
    funding,
    hiring,
    news,
    growthScore: Math.min(100, growthScore),
    signals
  };
}
