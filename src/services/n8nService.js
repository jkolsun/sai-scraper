// SAI Scraper API Service
// Handles company discovery and multi-signal enrichment

/**
 * Discover companies using ICP filters via Serper/Google
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
 * Enrich multiple companies in batches
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
  discoverCompanies,
  enrichCompany,
  enrichCompanies,
  getEnrichment,
};
