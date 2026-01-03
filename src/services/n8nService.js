// n8n Integration Service
// This service connects your SAI Scraper UI to the n8n workflow

const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/sai-scraper-serper';
const SERPER_API_KEY = process.env.REACT_APP_SERPER_API_KEY || '';

// Discovery webhook - hardcoded to bypass Vercel env var issue
const N8N_DISCOVERY_WEBHOOK_URL = 'https://jkolsun.app.n8n.cloud/webhook/9eb378a8-997d-4d86-942c-3538ce14154d';

/**
 * Send domains to n8n for scraping
 * @param {string[]} domains - Array of domain names to scrape
 * @returns {Promise<Array>} - Array of scraping results from n8n
 */
export async function scrapeWithN8n(domains) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domains,
        options: {
          serperApiKey: SERPER_API_KEY
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('n8n raw response:', JSON.stringify(data, null, 2));

    // Helper to extract array from various n8n response formats
    const extractArray = (obj) => {
      if (!obj) return null;

      // Direct array
      if (Array.isArray(obj)) {
        // Check if items are wrapped in { json: {...} }
        if (obj.length > 0 && obj[0].json) {
          return obj.map(item => item.json);
        }
        return obj;
      }

      // Object with data property (n8n Aggregate node output)
      if (obj.data) {
        return extractArray(obj.data);
      }

      // Object with json property
      if (obj.json) {
        return extractArray(obj.json);
      }

      // Object with results property
      if (obj.results) {
        return extractArray(obj.results);
      }

      // Object with numeric keys like { "0": {...}, "1": {...} }
      if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
          const arr = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => obj[k]);
          // Check if items are wrapped in { json: {...} }
          if (arr.length > 0 && arr[0].json) {
            return arr.map(item => item.json);
          }
          return arr;
        }
      }

      return null;
    };

    const result = extractArray(data);

    if (result && Array.isArray(result) && result.length > 0) {
      console.log('Parsed n8n results:', result.length, 'items');
      return result;
    }

    // Fallback: wrap single object in array
    console.log('Fallback: wrapping response in array');
    return [data];
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    throw error;
  }
}

/**
 * Check if n8n webhook is available
 * @returns {Promise<boolean>}
 */
export async function checkN8nConnection() {
  try {
    // Try a simple health check - n8n webhooks respond to GET with method not allowed
    // but that still means the server is up
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'OPTIONS',
    });
    return response.ok || response.status === 405;
  } catch {
    return false;
  }
}

/**
 * Discover companies using ICP filters via Serper - Direct API call (no n8n)
 * @param {Object} filters - ICP filters (industries, locations, employeeRange, etc.)
 * @param {number} maxResults - Maximum number of companies to discover
 * @returns {Promise<Array>} - Array of discovered companies
 */
export async function discoverCompanies(filters, maxResults = 25) {
  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  const industries = filters.industries || [];
  const locations = filters.locations || [];

  // Build search query
  let query;
  if (industries.length > 0 && locations.length > 0) {
    query = `${industries[0]} company ${locations[0]} "contact us"`;
  } else if (industries.length > 0) {
    query = `${industries[0]} company "contact us" "free estimate"`;
  } else if (locations.length > 0) {
    query = `local business ${locations[0]} "contact us"`;
  } else {
    query = 'small business company "contact us"';
  }

  console.log('Discovery search query:', query);

  try {
    // Call Serper directly
    const response = await fetch('https://google.serper.dev/search', {
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

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    const organic = data.organic || [];

    console.log('Serper returned', organic.length, 'results');

    // Domains to skip
    const skipDomains = new Set([
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com',
      'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com',
      'angi.com', 'homeadvisor.com', 'thumbtack.com', 'houzz.com',
      'zillow.com', 'realtor.com', 'redfin.com',
      'indeed.com', 'glassdoor.com',
      'avvo.com', 'findlaw.com', 'healthgrades.com', 'zocdoc.com',
      'forbes.com', 'inc.com', 'wikipedia.org', 'medium.com',
      'amazon.com', 'google.com', 'apple.com'
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
      let name = (result.title || '').split(/[|\\-–—:]/)[0].trim();
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
    return companies;

  } catch (error) {
    console.error('Error discovering companies:', error);
    throw error;
  }
}

export default {
  scrapeWithN8n,
  checkN8nConnection,
  discoverCompanies,
};
