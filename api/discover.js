// Vercel Serverless Function - Company Discovery via Serper
// This proxies Serper API calls to avoid CORS issues

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

    // Build search query
    let query;
    if (industries.length > 0 && locations.length > 0) {
      query = `${industries[0]} company ${locations[0]} "contact us"`;
    } else if (industries.length > 0) {
      query = `${industries[0]} company "contact us"`;
    } else if (locations.length > 0) {
      query = `local business ${locations[0]} "contact us"`;
    } else {
      query = 'small business company "contact us"';
    }

    console.log('Discovery query:', query);

    // Call Serper
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'us',
        hl: 'en',
        num: 30
      }),
    });

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      console.error('Serper error:', errorText);
      return res.status(500).json({ error: 'Serper API error', details: errorText });
    }

    const data = await serperResponse.json();
    const organic = data.organic || [];

    // Domains to skip
    const skipDomains = new Set([
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com',
      'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com',
      'angi.com', 'homeadvisor.com', 'thumbtack.com', 'houzz.com',
      'zillow.com', 'realtor.com', 'redfin.com',
      'indeed.com', 'glassdoor.com',
      'avvo.com', 'findlaw.com', 'healthgrades.com', 'zocdoc.com',
      'forbes.com', 'inc.com', 'wikipedia.org', 'medium.com',
      'amazon.com', 'google.com', 'apple.com', 'microsoft.com',
      'healthcare.gov', 'uhc.com', 'hcahealthcare.com'
    ]);

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

      // Skip duplicates and blocked domains
      if (seenDomains.has(domain)) continue;
      if (skipDomains.has(domain)) continue;

      // Skip if domain contains blocked patterns
      let skip = false;
      for (const blocked of skipDomains) {
        if (domain.includes(blocked.split('.')[0])) {
          skip = true;
          break;
        }
      }
      if (skip) continue;

      seenDomains.add(domain);

      // Extract company name from title
      let name = (result.title || '').split(/[|\-–—:]/)[0].trim();
      if (name.length < 2 || name.length > 60) {
        name = domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      companies.push({
        name: name,
        domain: domain,
        industry: industries[0] || 'Professional Services',
        location: locations[0] || 'United States',
        employees: filters.employeeRange || '11-50',
        revenue: filters.revenueRange || '$1M - $10M',
        source: 'serper_discovery',
        snippet: (result.snippet || '').substring(0, 200),
        sourceUrl: url
      });
    }

    console.log('Discovered', companies.length, 'companies');

    return res.status(200).json({
      companies: companies,
      totalFound: companies.length,
      query: query
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: error.message });
  }
}
