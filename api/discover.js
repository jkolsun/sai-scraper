// Vercel Serverless Function - Advanced Company Discovery via Serper
// Builds intelligent search queries from ICP filters

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { filters = {}, maxResults = 25 } = req.body;

    const industries = filters.industries || [];
    const locations = filters.locations || [];
    const employeeRange = filters.employeeRange || null;
    const revenueRange = filters.revenueRange || null;
    const hiringRoles = filters.hiringRoles || [];
    const techStack = filters.techStack || [];

    // Build multiple targeted search queries based on filters
    const queries = buildSearchQueries({ industries, locations, employeeRange, revenueRange, hiringRoles, techStack });

    console.log('Generated queries:', queries);

    // Run searches in parallel (up to 3 queries to stay within rate limits)
    const searchPromises = queries.slice(0, 3).map(query =>
      searchSerper(SERPER_KEY, query)
    );

    const searchResults = await Promise.all(searchPromises);

    // Combine and dedupe results
    const allOrganic = searchResults.flatMap(r => r.organic || []);

    // Process and filter results
    const companies = processResults(allOrganic, filters, maxResults);

    console.log('Discovered', companies.length, 'companies from', allOrganic.length, 'raw results');

    return res.status(200).json({
      companies: companies,
      totalFound: companies.length,
      queries: queries
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Build smart search queries based on filters
function buildSearchQueries({ industries, locations, employeeRange, revenueRange, hiringRoles, techStack }) {
  const queries = [];

  // Map industry to search-friendly terms
  const industryTerms = {
    'SaaS': ['SaaS company', 'software as a service', 'B2B software company'],
    'E-commerce': ['ecommerce store', 'online retailer', 'DTC brand'],
    'Healthcare': ['healthcare company', 'medical practice', 'health services'],
    'FinTech': ['fintech startup', 'financial technology company', 'payments company'],
    'EdTech': ['edtech company', 'online learning platform', 'education technology'],
    'Real Estate': ['real estate agency', 'property management company', 'real estate brokerage'],
    'Manufacturing': ['manufacturing company', 'industrial manufacturer'],
    'Retail': ['retail company', 'retail chain', 'retail store'],
    'Professional Services': ['professional services firm', 'consulting firm', 'business services'],
    'Marketing Agency': ['digital marketing agency', 'advertising agency', 'SEO agency'],
    'Logistics': ['logistics company', 'freight company', 'shipping company'],
    'Construction': ['construction company', 'general contractor', 'building contractor'],
    'Legal': ['law firm', 'legal services', 'attorney'],
    'Insurance': ['insurance agency', 'insurance broker', 'insurance company']
  };

  // Map employee size to search terms
  const sizeTerms = {
    '1-10': 'small business',
    '11-50': 'growing company',
    '51-200': 'mid-size company',
    '201-500': 'established company',
    '501-1000': 'large company',
    '1000+': 'enterprise'
  };

  // Map locations to regions
  const locationTerms = {
    'United States': ['USA', 'US', 'United States'],
    'Canada': ['Canada', 'Canadian'],
    'United Kingdom': ['UK', 'United Kingdom', 'British'],
    'Germany': ['Germany', 'German'],
    'France': ['France', 'French'],
    'Australia': ['Australia', 'Australian'],
    'Netherlands': ['Netherlands', 'Dutch'],
    'Spain': ['Spain', 'Spanish'],
    'Italy': ['Italy', 'Italian'],
    'Brazil': ['Brazil', 'Brazilian'],
    'Mexico': ['Mexico', 'Mexican'],
    'India': ['India', 'Indian'],
    'Singapore': ['Singapore'],
    'Japan': ['Japan', 'Japanese'],
    'South Korea': ['South Korea', 'Korean']
  };

  // Hiring role terms
  const hiringTerms = {
    'Sales / Account Executive': 'hiring sales',
    'Business Development': 'hiring business development',
    'Marketing': 'hiring marketing',
    'Customer Success': 'hiring customer success',
    'SDR / BDR': 'hiring SDR',
    'Engineering': 'hiring engineers',
    'Product': 'hiring product manager',
    'Operations': 'hiring operations'
  };

  // Strategy 1: Industry + Location queries - search for actual companies
  if (industries.length > 0) {
    for (const industry of industries.slice(0, 2)) {
      const terms = industryTerms[industry] || [industry.toLowerCase()];
      // Use multiple term variations to find actual company sites
      const searchTerms = [terms[0], terms[1] || terms[0]];

      if (locations.length > 0) {
        for (const location of locations.slice(0, 2)) {
          const locTerms = locationTerms[location] || [location];
          // Add specific search modifiers to find company homepages
          queries.push(`${searchTerms[0]} ${locTerms[0]}`);
        }
      } else {
        queries.push(`${searchTerms[0]}`);
        queries.push(`${searchTerms[1]}`);
      }
    }
  }

  // Strategy 2: Industry + Size queries
  if (industries.length > 0 && employeeRange) {
    const sizeModifier = sizeTerms[employeeRange] || '';
    const industry = industries[0];
    const terms = industryTerms[industry] || [industry.toLowerCase()];
    if (sizeModifier) {
      queries.push(`${sizeModifier} ${terms[0]}`);
    }
  }

  // Strategy 3: Hiring-based queries (great for finding active companies)
  if (hiringRoles.length > 0 && industries.length > 0) {
    const role = hiringRoles[0];
    const hiringTerm = hiringTerms[role] || `hiring ${role.toLowerCase()}`;
    const industry = industries[0];
    const terms = industryTerms[industry] || [industry.toLowerCase()];
    queries.push(`${terms[0]} ${hiringTerm}`);
  }

  // Strategy 4: Tech stack queries (find companies using specific tools)
  if (techStack.length > 0 && industries.length > 0) {
    const tech = techStack[0];
    const industry = industries[0];
    const terms = industryTerms[industry] || [industry.toLowerCase()];
    queries.push(`${terms[0]} uses ${tech}`);
  }

  // Strategy 5: If only location specified, search for businesses there
  if (industries.length === 0 && locations.length > 0) {
    for (const location of locations.slice(0, 2)) {
      const locTerms = locationTerms[location] || [location];
      queries.push(`top companies ${locTerms[0]}`);
      queries.push(`growing businesses ${locTerms[0]}`);
    }
  }

  // Fallback query if nothing specific
  if (queries.length === 0) {
    queries.push('fast growing B2B companies');
  }

  // Dedupe queries
  return [...new Set(queries)];
}

// Call Serper API
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
      console.error(`Serper error for query "${query}":`, await response.text());
      return { organic: [] };
    }

    return await response.json();
  } catch (error) {
    console.error(`Search error for query "${query}":`, error);
    return { organic: [] };
  }
}

// Process and filter results
function processResults(organic, filters, maxResults) {
  // Domains to skip (directories, social media, forums, etc.)
  const skipDomains = new Set([
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com',
    'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com', 'manta.com', 'dnb.com',
    'angi.com', 'homeadvisor.com', 'thumbtack.com', 'houzz.com', 'porch.com',
    'zillow.com', 'realtor.com', 'redfin.com', 'trulia.com',
    'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com',
    'avvo.com', 'findlaw.com', 'healthgrades.com', 'zocdoc.com', 'vitals.com',
    'forbes.com', 'inc.com', 'wikipedia.org', 'medium.com', 'bloomberg.com', 'wsj.com',
    'amazon.com', 'google.com', 'apple.com', 'microsoft.com', 'shopify.com',
    'reddit.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com',
    'coursera.org', 'udemy.com', 'skillshare.com',
    'crunchbase.com', 'pitchbook.com', 'owler.com', 'zoominfo.com',
    'g2.com', 'capterra.com', 'trustradius.com', 'getapp.com',
    'clutch.co', 'goodfirms.co', 'sortlist.com',
    'topstartups.io', 'wellfound.com', 'ycombinator.com', 'techcrunch.com',
    'publicsaascompanies.com', 'omnius.so', 'ascendixtech.com', 'mikesonders.com',
    'advancedclient.io', 'semrush.com', 'technologyadvice.com', 'digitalsilk.com',
    'builtin.com', 'angel.co', 'producthunt.com', 'betalist.com',
    'gov', 'edu', 'org'
  ]);

  // Skip patterns in domains
  const skipPatterns = ['wiki', 'news', 'directory', 'review', 'rating', 'compare'];

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

    // Skip if we've seen this domain
    if (seenDomains.has(domain)) continue;

    // Skip blocked domains
    if (skipDomains.has(domain)) continue;

    // Skip domains matching blocked patterns
    const domainLower = domain.toLowerCase();
    let shouldSkip = false;

    for (const blocked of skipDomains) {
      if (domainLower.includes(blocked.replace('.com', '').replace('.org', ''))) {
        shouldSkip = true;
        break;
      }
    }

    for (const pattern of skipPatterns) {
      if (domainLower.includes(pattern)) {
        shouldSkip = true;
        break;
      }
    }

    // Skip government and education sites
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      shouldSkip = true;
    }

    if (shouldSkip) continue;

    seenDomains.add(domain);

    // Extract company name from title
    let name = (result.title || '').split(/[|\-–—:]/)[0].trim();

    // Clean up common suffixes
    name = name.replace(/\s+(Inc|LLC|Ltd|Corp|Co|Company|Services|Solutions|Group)\.?$/i, '').trim();

    if (name.length < 2 || name.length > 60) {
      // Fall back to domain name
      name = domain.replace(/\.(com|io|co|net|org|ai)$/i, '').replace(/[-_]/g, ' ');
      name = name.split('.').pop() || name;
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    // Try to infer industry from snippet/title
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    let inferredIndustry = filters.industries?.[0] || inferIndustry(text);

    companies.push({
      name: name,
      domain: domain,
      industry: inferredIndustry,
      location: filters.locations?.[0] || 'United States',
      employees: filters.employeeRange || '11-50',
      revenue: filters.revenueRange || '$1M - $10M',
      source: 'serper_discovery',
      snippet: (result.snippet || '').substring(0, 200),
      sourceUrl: url
    });
  }

  return companies;
}

// Infer industry from text
function inferIndustry(text) {
  const industryKeywords = {
    'SaaS': ['saas', 'software', 'platform', 'cloud', 'app'],
    'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'shop', 'retail'],
    'Healthcare': ['health', 'medical', 'clinic', 'doctor', 'dental', 'hospital'],
    'FinTech': ['fintech', 'financial', 'payments', 'banking', 'lending'],
    'EdTech': ['education', 'learning', 'course', 'training', 'school'],
    'Real Estate': ['real estate', 'property', 'realty', 'homes', 'mortgage'],
    'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production'],
    'Marketing Agency': ['marketing', 'agency', 'advertising', 'seo', 'digital'],
    'Legal': ['law', 'legal', 'attorney', 'lawyer'],
    'Insurance': ['insurance', 'coverage', 'policy'],
    'Construction': ['construction', 'contractor', 'building', 'roofing', 'plumbing', 'hvac'],
    'Professional Services': ['consulting', 'services', 'solutions']
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return industry;
      }
    }
  }

  return 'Professional Services';
}
