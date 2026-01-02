// n8n Integration Service
// This service connects your SAI Scraper UI to the n8n workflow

const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/sai-google-ads';

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
      body: JSON.stringify({ domains }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // The n8n workflow returns aggregated results
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return data;
    }

    // If it's wrapped in a data property
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    // Single result wrapped in array
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

export default {
  scrapeWithN8n,
  checkN8nConnection,
};
