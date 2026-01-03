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
 * Discover companies using ICP filters via Serper - Uses Vercel serverless function
 * @param {Object} filters - ICP filters (industries, locations, employeeRange, etc.)
 * @param {number} maxResults - Maximum number of companies to discover
 * @returns {Promise<Array>} - Array of discovered companies
 */
export async function discoverCompanies(filters, maxResults = 25) {
  try {
    console.log('Discovering companies with filters:', filters);

    const response = await fetch('/api/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters,
        maxResults
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Discovery response:', data);

    return data.companies || [];

  } catch (error) {
    console.error('Error discovering companies:', error);
    throw error;
  }
}

/**
 * Enrich a single company with multi-signal data
 * @param {string} domain - Company domain
 * @param {string} companyName - Company name
 * @param {string} industry - Company industry
 * @returns {Promise<Object>} - Enriched company data
 */
export async function enrichCompany(domain, companyName, industry) {
  try {
    console.log('Enriching company:', domain);

    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        companyName,
        industry
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Enrichment response:', data);

    return data;

  } catch (error) {
    console.error('Error enriching company:', error);
    throw error;
  }
}

/**
 * Enrich multiple companies in parallel
 * @param {Array} companies - Array of companies with domain, name, industry
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} - Array of enriched company data
 */
export async function enrichCompanies(companies, onProgress) {
  const results = [];
  const batchSize = 3; // Process 3 at a time to avoid rate limits

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(company =>
        enrichCompany(company.domain, company.name, company.industry)
          .catch(err => ({
            success: false,
            domain: company.domain,
            error: err.message
          }))
      )
    );

    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, companies.length),
        total: companies.length,
        percent: Math.round((Math.min(i + batchSize, companies.length) / companies.length) * 100)
      });
    }
  }

  return results;
}

/**
 * Get individual enrichment data (LinkedIn, Jobs, Tech, Ads, Website)
 * @param {string} type - Enrichment type: 'linkedin', 'jobs', 'techstack', 'ads', 'website'
 * @param {Object} params - Parameters for the enrichment
 * @returns {Promise<Object>} - Enrichment data
 */
export async function getEnrichment(type, params) {
  try {
    const response = await fetch(`/api/enrich-${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error(`Error getting ${type} enrichment:`, error);
    throw error;
  }
}

export default {
  scrapeWithN8n,
  checkN8nConnection,
  discoverCompanies,
  enrichCompany,
  enrichCompanies,
  getEnrichment,
};
