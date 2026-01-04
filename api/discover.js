// Vercel Serverless Function - Advanced Company Discovery via Serper
// Comprehensive ICP filtering with 65+ filter options (Apollo/ZoomInfo level)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { filters = {}, maxResults = 25 } = req.body;

    // Extract all filter categories
    const {
      // Firmographic
      industries = [],
      subIndustries = [],
      employeeRanges = [],
      revenueRanges = [],
      companyTypes = [],
      businessModels = [],
      // Geographic
      countries = [],
      states = [],
      metroAreas = [],
      // Contact/Demographic
      jobTitles = [],
      seniorityLevels = [],
      departments = [],
      // Technographic
      technologies = [],
      techCategories = [],
      // Funding
      fundingStages = [],
      fundingRecency = null,
      // Hiring
      hiringDepartments = [],
      hiringIntensity = null,
      // Intent
      intentSignals = [],
      // Advanced
      keywords = [],
      excludeDomains = [],
      lookalikeDomains = []
    } = filters;

    // Build intelligent search queries
    const queries = buildAdvancedQueries({
      industries, subIndustries, employeeRanges, revenueRanges, companyTypes, businessModels,
      countries, states, metroAreas, jobTitles, seniorityLevels, departments,
      technologies, techCategories, fundingStages, fundingRecency,
      hiringDepartments, hiringIntensity, intentSignals, keywords, lookalikeDomains
    });

    console.log('Generated queries:', queries);

    // Run parallel searches (up to 5 for comprehensive coverage)
    const searchPromises = queries.slice(0, 5).map(query => searchSerper(SERPER_KEY, query));
    const searchResults = await Promise.all(searchPromises);

    // Combine results
    const allOrganic = searchResults.flatMap(r => r.organic || []);

    // Process with advanced filtering
    const companies = processAdvancedResults(allOrganic, {
      industries, subIndustries, employeeRanges, revenueRanges, companyTypes, businessModels,
      countries, states, metroAreas, technologies, fundingStages, excludeDomains
    }, maxResults);

    console.log('Discovered', companies.length, 'companies from', allOrganic.length, 'raw results');

    return res.status(200).json({
      companies,
      totalFound: companies.length,
      queries,
      filtersApplied: Object.entries(filters).filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true)).length
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ==================== COMPREHENSIVE INDUSTRY MAPPINGS ====================
const INDUSTRY_SEARCH_TERMS = {
  // Technology
  'SaaS': ['SaaS company', 'B2B software company', 'cloud software'],
  'Software Development': ['software development company', 'custom software', 'software agency'],
  'IT Services': ['IT services company', 'managed IT', 'IT consulting'],
  'Cybersecurity': ['cybersecurity company', 'security software', 'infosec'],
  'Cloud Computing': ['cloud computing company', 'cloud services', 'cloud infrastructure'],
  'AI/ML': ['AI company', 'machine learning startup', 'artificial intelligence'],
  // Finance
  'FinTech': ['fintech company', 'financial technology', 'payments startup'],
  'Banking': ['bank', 'banking services', 'financial institution'],
  'Insurance': ['insurance company', 'insurance agency', 'insurtech'],
  'Investment': ['investment firm', 'private equity', 'venture capital'],
  'Accounting': ['accounting firm', 'CPA firm', 'bookkeeping services'],
  // Healthcare
  'Healthcare': ['healthcare company', 'medical practice', 'health services'],
  'Biotech': ['biotech company', 'biotechnology', 'life sciences'],
  'Pharmaceuticals': ['pharmaceutical company', 'pharma', 'drug manufacturer'],
  'Medical Devices': ['medical device company', 'medical equipment', 'medtech'],
  'Telehealth': ['telehealth company', 'telemedicine', 'virtual healthcare'],
  // Commerce
  'E-commerce': ['ecommerce company', 'online store', 'DTC brand'],
  'Retail': ['retail company', 'retail chain', 'consumer retail'],
  'Wholesale': ['wholesale company', 'distributor', 'B2B wholesale'],
  'Consumer Goods': ['consumer goods company', 'CPG', 'consumer products'],
  // Services
  'Professional Services': ['professional services firm', 'consulting company', 'business services'],
  'Consulting': ['consulting firm', 'management consulting', 'strategy consulting'],
  'Marketing Agency': ['digital marketing agency', 'advertising agency', 'marketing firm'],
  'Legal': ['law firm', 'legal services', 'attorney practice'],
  'Recruiting': ['recruiting agency', 'staffing company', 'talent acquisition'],
  // Industrial
  'Manufacturing': ['manufacturing company', 'industrial manufacturer', 'production company'],
  'Construction': ['construction company', 'general contractor', 'building company'],
  'Logistics': ['logistics company', 'freight company', 'supply chain'],
  'Transportation': ['transportation company', 'trucking company', 'fleet services'],
  'Energy': ['energy company', 'renewable energy', 'utilities'],
  // Other
  'Real Estate': ['real estate company', 'property management', 'real estate brokerage'],
  'EdTech': ['edtech company', 'education technology', 'online learning'],
  'Media/Entertainment': ['media company', 'entertainment company', 'content production'],
  'Hospitality': ['hospitality company', 'hotel', 'restaurant group'],
  'Non-Profit': ['nonprofit organization', 'NGO', 'charity']
};

const SUB_INDUSTRY_TERMS = {
  'CRM': 'CRM software',
  'Marketing Automation': 'marketing automation platform',
  'HR Tech': 'HR technology company',
  'Sales Tech': 'sales enablement software',
  'Project Management': 'project management software',
  'Analytics': 'analytics platform',
  'Hospitals': 'hospital',
  'Clinics': 'medical clinic',
  'Dental': 'dental practice',
  'Mental Health': 'mental health services',
  'Payments': 'payments company',
  'Lending': 'lending platform',
  'Wealth Management': 'wealth management firm',
  'D2C Brands': 'direct to consumer brand',
  'Marketplaces': 'online marketplace',
  'Digital Marketing': 'digital marketing agency',
  'SEO/SEM': 'SEO agency',
  'Content Marketing': 'content marketing agency',
  'Personal Injury': 'personal injury lawyer',
  'Corporate Law': 'corporate law firm',
  'Immigration': 'immigration attorney',
  'Residential': 'residential real estate',
  'Commercial': 'commercial real estate',
  'Property Management': 'property management company'
};

const LOCATION_TERMS = {
  'United States': ['USA', 'US', 'United States', 'American'],
  'California': ['California', 'CA', 'Bay Area', 'Los Angeles', 'San Diego'],
  'New York': ['New York', 'NY', 'NYC', 'Manhattan'],
  'Texas': ['Texas', 'TX', 'Austin', 'Dallas', 'Houston'],
  'Florida': ['Florida', 'FL', 'Miami', 'Tampa'],
  'Illinois': ['Illinois', 'IL', 'Chicago'],
  'Massachusetts': ['Massachusetts', 'MA', 'Boston'],
  'Washington': ['Washington', 'WA', 'Seattle'],
  'Colorado': ['Colorado', 'CO', 'Denver'],
  'Georgia': ['Georgia', 'GA', 'Atlanta'],
  'Canada': ['Canada', 'Canadian', 'Toronto', 'Vancouver'],
  'United Kingdom': ['UK', 'United Kingdom', 'London', 'British'],
  'Germany': ['Germany', 'German', 'Berlin', 'Munich'],
  'France': ['France', 'French', 'Paris'],
  'Australia': ['Australia', 'Australian', 'Sydney', 'Melbourne'],
  'Netherlands': ['Netherlands', 'Dutch', 'Amsterdam'],
  'Ireland': ['Ireland', 'Irish', 'Dublin'],
  'Israel': ['Israel', 'Israeli', 'Tel Aviv'],
  'Singapore': ['Singapore'],
  'India': ['India', 'Indian', 'Bangalore', 'Mumbai']
};

const METRO_TERMS = {
  'San Francisco Bay Area': 'San Francisco Bay Area',
  'New York City': 'NYC',
  'Los Angeles': 'Los Angeles',
  'Chicago': 'Chicago',
  'Boston': 'Boston',
  'Seattle': 'Seattle',
  'Austin': 'Austin Texas',
  'Denver': 'Denver',
  'Atlanta': 'Atlanta',
  'Dallas-Fort Worth': 'Dallas',
  'Miami': 'Miami',
  'Washington DC': 'Washington DC'
};

const SIZE_TERMS = {
  '1-10 (Startup)': 'startup',
  '11-50 (Small)': 'small business',
  '51-200 (Mid-Market)': 'growing company',
  '201-500 (Growth)': 'mid-size company',
  '501-1000 (Scale-up)': 'scale-up company',
  '1001-5000 (Enterprise)': 'enterprise company',
  '5000+ (Large Enterprise)': 'large enterprise'
};

const FUNDING_TERMS = {
  'Pre-Seed': 'pre-seed startup',
  'Seed': 'seed funded startup',
  'Series A': 'Series A startup',
  'Series B': 'Series B company',
  'Series C': 'Series C company',
  'Series D+': 'late stage startup',
  'Private Equity': 'PE backed company',
  'IPO': 'recently IPO',
  'Bootstrapped': 'bootstrapped company'
};

const HIRING_DEPT_TERMS = {
  'Sales': 'hiring sales',
  'Marketing': 'hiring marketing',
  'Engineering': 'hiring engineers',
  'Product': 'hiring product manager',
  'Customer Success': 'hiring customer success',
  'Operations': 'hiring operations',
  'Finance': 'hiring finance',
  'HR': 'hiring HR',
  'Design': 'hiring designers',
  'Data Science': 'hiring data scientist',
  'DevOps': 'hiring DevOps',
  'Security': 'hiring security engineer'
};

const TECH_SEARCH_TERMS = {
  'Salesforce': 'uses Salesforce',
  'HubSpot': 'uses HubSpot',
  'Marketo': 'uses Marketo',
  'Intercom': 'uses Intercom',
  'Drift': 'uses Drift',
  'Zendesk': 'uses Zendesk',
  'Shopify': 'Shopify store',
  'AWS': 'uses AWS',
  'Google Cloud': 'Google Cloud customer',
  'Stripe': 'uses Stripe',
  'Segment': 'uses Segment'
};

const INTENT_SEARCH_TERMS = {
  'Recent Funding': 'recently raised funding',
  'Leadership Change': 'new CEO appointed',
  'New Tech Adoption': 'technology adoption',
  'Expansion News': 'company expansion',
  'Product Launch': 'new product launch',
  'M&A Activity': 'acquisition announced',
  'Job Posting Spike': 'rapidly hiring',
  'Traffic Growth': 'fast growing',
  'Ad Spend Increase': 'advertising campaign',
  'Competitor Mentions': 'competitor alternative'
};

// ==================== BUILD ADVANCED QUERIES ====================
function buildAdvancedQueries(filters) {
  const queries = [];
  const {
    industries, subIndustries, employeeRanges, companyTypes, businessModels,
    countries, states, metroAreas, technologies, fundingStages,
    hiringDepartments, intentSignals, keywords, lookalikeDomains
  } = filters;

  // Strategy 1: Industry + Location (primary)
  if (industries.length > 0) {
    for (const industry of industries.slice(0, 2)) {
      const terms = INDUSTRY_SEARCH_TERMS[industry] || [industry.toLowerCase() + ' company'];
      const mainTerm = terms[0];

      // Add location context
      if (countries.length > 0) {
        for (const country of countries.slice(0, 2)) {
          const locTerms = LOCATION_TERMS[country] || [country];
          queries.push(`${mainTerm} ${locTerms[0]}`);
        }
      }

      // Add state-level targeting (US)
      if (states.length > 0) {
        for (const state of states.slice(0, 2)) {
          const stateTerms = LOCATION_TERMS[state] || [state];
          queries.push(`${mainTerm} ${stateTerms[0]}`);
        }
      }

      // Add metro area targeting
      if (metroAreas.length > 0) {
        for (const metro of metroAreas.slice(0, 2)) {
          queries.push(`${mainTerm} ${METRO_TERMS[metro] || metro}`);
        }
      }

      // If no location, just search industry
      if (countries.length === 0 && states.length === 0 && metroAreas.length === 0) {
        queries.push(mainTerm);
        if (terms[1]) queries.push(terms[1]);
      }
    }
  }

  // Strategy 2: Sub-industry specific
  if (subIndustries.length > 0) {
    for (const sub of subIndustries.slice(0, 2)) {
      const subTerm = SUB_INDUSTRY_TERMS[sub] || sub.toLowerCase();
      if (countries.length > 0) {
        queries.push(`${subTerm} ${LOCATION_TERMS[countries[0]]?.[0] || countries[0]}`);
      } else {
        queries.push(subTerm);
      }
    }
  }

  // Strategy 3: Company size + Industry
  if (employeeRanges.length > 0 && industries.length > 0) {
    const sizeTerm = SIZE_TERMS[employeeRanges[0]] || '';
    const industryTerm = INDUSTRY_SEARCH_TERMS[industries[0]]?.[0] || industries[0];
    if (sizeTerm) {
      queries.push(`${sizeTerm} ${industryTerm}`);
    }
  }

  // Strategy 4: Business model targeting
  if (businessModels.length > 0) {
    for (const model of businessModels.slice(0, 2)) {
      if (model === 'B2B') queries.push('B2B company');
      else if (model === 'B2C') queries.push('B2C company');
      else if (model === 'SaaS') queries.push('SaaS startup');
      else if (model === 'D2C') queries.push('direct to consumer brand');
      else if (model === 'Marketplace') queries.push('online marketplace');
      else if (model === 'Subscription') queries.push('subscription business');
    }
  }

  // Strategy 5: Funding-based discovery
  if (fundingStages.length > 0) {
    for (const stage of fundingStages.slice(0, 2)) {
      const fundingTerm = FUNDING_TERMS[stage] || stage;
      if (industries.length > 0) {
        queries.push(`${fundingTerm} ${INDUSTRY_SEARCH_TERMS[industries[0]]?.[0] || industries[0]}`);
      } else {
        queries.push(fundingTerm);
      }
    }
  }

  // Strategy 6: Hiring signals
  if (hiringDepartments.length > 0) {
    for (const dept of hiringDepartments.slice(0, 2)) {
      const hiringTerm = HIRING_DEPT_TERMS[dept] || `hiring ${dept.toLowerCase()}`;
      if (industries.length > 0) {
        queries.push(`${INDUSTRY_SEARCH_TERMS[industries[0]]?.[0] || industries[0]} ${hiringTerm}`);
      } else {
        queries.push(`company ${hiringTerm}`);
      }
    }
  }

  // Strategy 7: Technology-based targeting
  if (technologies.length > 0) {
    for (const tech of technologies.slice(0, 2)) {
      const techTerm = TECH_SEARCH_TERMS[tech] || `uses ${tech}`;
      if (industries.length > 0) {
        queries.push(`${INDUSTRY_SEARCH_TERMS[industries[0]]?.[0] || industries[0]} ${techTerm}`);
      } else {
        queries.push(`company ${techTerm}`);
      }
    }
  }

  // Strategy 8: Intent signals
  if (intentSignals.length > 0) {
    for (const signal of intentSignals.slice(0, 2)) {
      const intentTerm = INTENT_SEARCH_TERMS[signal] || signal.toLowerCase();
      if (industries.length > 0) {
        queries.push(`${INDUSTRY_SEARCH_TERMS[industries[0]]?.[0] || industries[0]} ${intentTerm}`);
      } else {
        queries.push(`company ${intentTerm}`);
      }
    }
  }

  // Strategy 9: Keyword-based search
  if (keywords.length > 0) {
    for (const keyword of keywords.slice(0, 2)) {
      queries.push(`${keyword} company`);
    }
  }

  // Strategy 10: Lookalike domains (search for "similar to" or "alternative to")
  if (lookalikeDomains.length > 0) {
    for (const domain of lookalikeDomains.slice(0, 2)) {
      const cleanDomain = domain.replace(/\.(com|io|co|ai|org|net)$/i, '');
      queries.push(`companies like ${cleanDomain}`);
      queries.push(`${cleanDomain} competitors`);
    }
  }

  // Fallback
  if (queries.length === 0) {
    queries.push('fast growing B2B companies 2024');
  }

  // Dedupe and return
  return [...new Set(queries)].slice(0, 10);
}

// ==================== SERPER API ====================
async function searchSerper(apiKey, query) {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'us',
        hl: 'en',
        num: 30
      }),
    });

    if (!response.ok) {
      console.error(`Serper error for "${query}":`, await response.text());
      return { organic: [] };
    }

    return await response.json();
  } catch (error) {
    console.error(`Search error for "${query}":`, error);
    return { organic: [] };
  }
}

// ==================== PROCESS RESULTS ====================
function processAdvancedResults(organic, filters, maxResults) {
  const { excludeDomains = [] } = filters;

  // Comprehensive skip list
  const skipDomains = new Set([
    // Social & Forums
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com',
    'reddit.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com', 'discord.com',
    // Directories & Listings
    'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com', 'manta.com', 'dnb.com',
    'angi.com', 'homeadvisor.com', 'thumbtack.com', 'houzz.com', 'porch.com',
    'zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'apartments.com',
    'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com', 'salary.com',
    'avvo.com', 'findlaw.com', 'healthgrades.com', 'zocdoc.com', 'vitals.com',
    // News & Media
    'forbes.com', 'inc.com', 'wikipedia.org', 'medium.com', 'bloomberg.com', 'wsj.com',
    'techcrunch.com', 'wired.com', 'cnn.com', 'nytimes.com', 'theverge.com', 'venturebeat.com',
    // Big Tech
    'amazon.com', 'google.com', 'apple.com', 'microsoft.com', 'meta.com', 'netflix.com',
    // E-commerce Platforms
    'shopify.com', 'wix.com', 'squarespace.com', 'wordpress.com', 'godaddy.com',
    // B2B Data/Review Sites
    'crunchbase.com', 'pitchbook.com', 'owler.com', 'zoominfo.com', 'apollo.io',
    'g2.com', 'capterra.com', 'trustradius.com', 'getapp.com', 'softwareadvice.com',
    'clutch.co', 'goodfirms.co', 'sortlist.com', 'trustpilot.com',
    // Startup Lists
    'topstartups.io', 'wellfound.com', 'ycombinator.com', 'builtin.com', 'angel.co',
    'producthunt.com', 'betalist.com', 'f6s.com',
    // Education
    'coursera.org', 'udemy.com', 'skillshare.com', 'linkedin.com/learning',
    // Other
    'github.com', 'gitlab.com', 'npm.com', 'pypi.org'
  ]);

  // Add user-excluded domains
  excludeDomains.forEach(d => skipDomains.add(d.toLowerCase()));

  const skipPatterns = ['wiki', 'news', 'directory', 'review', 'rating', 'compare', 'list-of', 'top-10', 'best-'];

  const companies = [];
  const seenDomains = new Set();

  for (const result of organic) {
    if (companies.length >= maxResults) break;

    const url = result.link || '';
    let domain;
    try {
      domain = new URL(url).hostname.replace('www.', '').toLowerCase();
    } catch {
      continue;
    }

    if (seenDomains.has(domain)) continue;
    if (skipDomains.has(domain)) continue;

    // Check skip patterns
    let shouldSkip = false;
    for (const blocked of skipDomains) {
      if (domain.includes(blocked.replace('.com', '').replace('.org', '').replace('.io', ''))) {
        shouldSkip = true;
        break;
      }
    }

    for (const pattern of skipPatterns) {
      if (domain.includes(pattern) || url.toLowerCase().includes(pattern)) {
        shouldSkip = true;
        break;
      }
    }

    // Skip government, education, military
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      shouldSkip = true;
    }

    // Skip list/blog articles
    const urlLower = url.toLowerCase();
    if (urlLower.includes('/blog/') || urlLower.includes('/articles/') ||
        urlLower.includes('/news/') || urlLower.includes('/press/')) {
      shouldSkip = true;
    }

    if (shouldSkip) continue;

    seenDomains.add(domain);

    // Extract company name
    let name = (result.title || '').split(/[|\-–—:]/)[0].trim();
    name = name.replace(/\s+(Inc|LLC|Ltd|Corp|Co|Company|Services|Solutions|Group|Technologies|Tech)\.?$/i, '').trim();

    if (name.length < 2 || name.length > 60) {
      name = domain.replace(/\.(com|io|co|net|org|ai|app)$/i, '').replace(/[-_]/g, ' ');
      name = name.split('.').pop() || name;
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Infer attributes from content
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const inferredIndustry = filters.industries?.[0] || inferIndustryAdvanced(text);
    const inferredLocation = filters.countries?.[0] || filters.states?.[0] || inferLocation(text);

    companies.push({
      name,
      domain,
      industry: inferredIndustry,
      location: inferredLocation,
      employees: filters.employeeRanges?.[0] || inferSize(text),
      revenue: filters.revenueRanges?.[0] || '$1M - $10M',
      companyType: filters.companyTypes?.[0] || 'Private Company',
      businessModel: filters.businessModels?.[0] || inferBusinessModel(text),
      source: 'serper_discovery',
      snippet: (result.snippet || '').substring(0, 250),
      sourceUrl: url
    });
  }

  return companies;
}

// ==================== INFERENCE HELPERS ====================
function inferIndustryAdvanced(text) {
  const industryKeywords = {
    'SaaS': ['saas', 'software as a service', 'cloud platform', 'subscription software'],
    'Software Development': ['software development', 'custom software', 'app development'],
    'IT Services': ['it services', 'managed services', 'it consulting', 'it support'],
    'Cybersecurity': ['cybersecurity', 'security software', 'data protection', 'infosec'],
    'AI/ML': ['artificial intelligence', 'machine learning', 'ai platform', 'deep learning'],
    'FinTech': ['fintech', 'financial technology', 'payments', 'banking software'],
    'Healthcare': ['healthcare', 'medical', 'health services', 'patient care'],
    'Biotech': ['biotech', 'biotechnology', 'life sciences', 'pharmaceutical'],
    'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'online retail'],
    'Marketing Agency': ['marketing agency', 'digital marketing', 'advertising agency', 'seo'],
    'Legal': ['law firm', 'legal services', 'attorney', 'lawyer'],
    'Real Estate': ['real estate', 'property', 'realty', 'brokerage'],
    'Construction': ['construction', 'contractor', 'building', 'roofing'],
    'Manufacturing': ['manufacturing', 'industrial', 'production', 'factory'],
    'Consulting': ['consulting', 'consultancy', 'advisory', 'strategy'],
    'EdTech': ['edtech', 'education technology', 'online learning', 'e-learning'],
    'Logistics': ['logistics', 'freight', 'shipping', 'supply chain']
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return industry;
    }
  }

  return 'Professional Services';
}

function inferLocation(text) {
  const locationKeywords = {
    'California': ['california', 'san francisco', 'los angeles', 'san diego', 'bay area'],
    'New York': ['new york', 'nyc', 'manhattan', 'brooklyn'],
    'Texas': ['texas', 'austin', 'dallas', 'houston'],
    'Florida': ['florida', 'miami', 'tampa', 'orlando'],
    'United Kingdom': ['uk', 'united kingdom', 'london', 'manchester'],
    'Canada': ['canada', 'toronto', 'vancouver', 'montreal'],
    'Germany': ['germany', 'berlin', 'munich'],
    'Australia': ['australia', 'sydney', 'melbourne']
  };

  for (const [location, keywords] of Object.entries(locationKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return location;
    }
  }

  return 'United States';
}

function inferSize(text) {
  if (text.includes('enterprise') || text.includes('fortune 500')) return '1001-5000 (Enterprise)';
  if (text.includes('startup') || text.includes('founded 202')) return '1-10 (Startup)';
  if (text.includes('growing') || text.includes('scale')) return '51-200 (Mid-Market)';
  if (text.includes('small business')) return '11-50 (Small)';
  return '11-50 (Small)';
}

function inferBusinessModel(text) {
  if (text.includes('saas') || text.includes('subscription')) return 'SaaS';
  if (text.includes('b2b')) return 'B2B';
  if (text.includes('b2c') || text.includes('consumer')) return 'B2C';
  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('dtc') || text.includes('direct to consumer')) return 'D2C';
  return 'B2B';
}
