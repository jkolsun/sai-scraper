// Vercel Serverless Function - LinkedIn Company Enrichment
// Uses Serper to search LinkedIn for company data

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { domain, companyName } = req.body;

    if (!domain && !companyName) {
      return res.status(400).json({ error: 'domain or companyName required' });
    }

    const searchQuery = companyName
      ? `site:linkedin.com/company "${companyName}"`
      : `site:linkedin.com/company "${domain.replace('.com', '').replace('.io', '')}"`;

    // Search LinkedIn via Serper
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'us',
        hl: 'en',
        num: 5
      }),
    });

    if (!serperResponse.ok) {
      return res.status(500).json({ error: 'Serper API error' });
    }

    const data = await serperResponse.json();
    const organic = data.organic || [];

    // Find LinkedIn company page
    const linkedinResult = organic.find(r =>
      r.link && r.link.includes('linkedin.com/company/')
    );

    if (!linkedinResult) {
      return res.status(200).json({
        found: false,
        domain,
        linkedinUrl: null,
        data: null
      });
    }

    // Extract data from LinkedIn snippet
    const snippet = linkedinResult.snippet || '';
    const title = linkedinResult.title || '';

    // Parse employee count from snippet (e.g., "1,234 followers" or "501-1000 employees")
    const employeeMatch = snippet.match(/(\d[\d,]*)\s*(?:employees|followers)/i) ||
                          snippet.match(/(\d+[-–]\d+)\s*employees/i);

    // Parse industry from snippet
    const industryPatterns = [
      /(?:industry|sector):\s*([^|•\n]+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+company/i
    ];
    let industry = null;
    for (const pattern of industryPatterns) {
      const match = snippet.match(pattern);
      if (match) {
        industry = match[1].trim();
        break;
      }
    }

    // Parse location
    const locationMatch = snippet.match(/(?:located in|headquarters in|based in)\s*([^|•\n,]+)/i) ||
                          snippet.match(/([A-Z][a-z]+(?:,\s*[A-Z]{2})?)\s*(?:area|region)?/);

    // Parse founding year
    const foundedMatch = snippet.match(/(?:founded|established|since)\s*(?:in\s*)?(\d{4})/i);

    // Extract company description
    const description = snippet.length > 50 ? snippet.substring(0, 200) : null;

    return res.status(200).json({
      found: true,
      domain,
      linkedinUrl: linkedinResult.link,
      data: {
        name: title.replace(/\s*[|\-–].*$/, '').replace(/LinkedIn$/, '').trim(),
        employeeCount: employeeMatch ? employeeMatch[1].replace(/,/g, '') : null,
        industry: industry,
        location: locationMatch ? locationMatch[1].trim() : null,
        founded: foundedMatch ? foundedMatch[1] : null,
        description: description,
        linkedinSnippet: snippet
      }
    });

  } catch (error) {
    console.error('LinkedIn enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
