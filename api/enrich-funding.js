// Vercel Serverless Function - Funding & News Enrichment
// Finds recent funding, news mentions, and company signals

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, companyName } = req.body;

    if (!domain && !companyName) {
      return res.status(400).json({ error: 'domain or companyName required' });
    }

    const searchName = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '');
    const SERPER_KEY = process.env.SERPER_API_KEY;

    const results = {
      funding: null,
      recentNews: [],
      hiring: null,
      awards: []
    };

    if (SERPER_KEY) {
      // Run searches in parallel
      const searches = await Promise.all([
        // Funding search
        searchSerper(SERPER_KEY, `"${searchName}" funding OR raised OR series OR seed OR investment 2024 OR 2025`),
        // News search
        searchSerper(SERPER_KEY, `"${searchName}" company news announcement 2024 OR 2025`),
        // Hiring search
        searchSerper(SERPER_KEY, `"${searchName}" hiring OR "we're hiring" OR "join our team" OR careers`),
        // Awards/recognition search
        searchSerper(SERPER_KEY, `"${searchName}" award OR recognized OR "best" OR "top" 2024 OR 2025`)
      ]);

      const [fundingResults, newsResults, hiringResults, awardsResults] = searches;

      // Process funding
      if (fundingResults.organic?.length > 0) {
        for (const result of fundingResults.organic.slice(0, 3)) {
          const text = `${result.title} ${result.snippet}`.toLowerCase();

          // Look for funding amounts
          const amountMatch = text.match(/\$(\d+(?:\.\d+)?)\s*(million|m|billion|b|k)/i);
          const roundMatch = text.match(/(seed|series\s*[a-e]|pre-seed|angel|bridge)/i);

          if (amountMatch || roundMatch) {
            results.funding = {
              found: true,
              amount: amountMatch ? `$${amountMatch[1]}${amountMatch[2].toUpperCase()}` : null,
              round: roundMatch ? roundMatch[1] : null,
              source: result.link,
              title: result.title,
              snippet: result.snippet,
              date: extractDate(result.snippet)
            };
            break;
          }
        }
      }

      // Process news
      if (newsResults.organic?.length > 0) {
        results.recentNews = newsResults.organic.slice(0, 5).map(r => ({
          title: r.title,
          snippet: r.snippet,
          url: r.link,
          date: extractDate(r.snippet)
        }));
      }

      // Process hiring signals
      if (hiringResults.organic?.length > 0) {
        const hiringSignals = [];
        for (const result of hiringResults.organic.slice(0, 3)) {
          const text = `${result.title} ${result.snippet}`.toLowerCase();

          // Look for job titles/departments
          if (text.includes('engineer') || text.includes('developer')) hiringSignals.push('Engineering');
          if (text.includes('sales') || text.includes('account executive')) hiringSignals.push('Sales');
          if (text.includes('marketing')) hiringSignals.push('Marketing');
          if (text.includes('product') || text.includes('pm')) hiringSignals.push('Product');
          if (text.includes('customer success') || text.includes('support')) hiringSignals.push('Customer Success');
          if (text.includes('design') || text.includes('ux')) hiringSignals.push('Design');
        }

        if (hiringSignals.length > 0) {
          results.hiring = {
            isHiring: true,
            departments: [...new Set(hiringSignals)],
            source: hiringResults.organic[0].link
          };
        }
      }

      // Process awards
      if (awardsResults.organic?.length > 0) {
        for (const result of awardsResults.organic.slice(0, 3)) {
          const text = `${result.title} ${result.snippet}`.toLowerCase();

          if (text.includes('award') || text.includes('recognized') || text.includes('winner') ||
              text.includes('best') || text.includes('top')) {
            results.awards.push({
              title: result.title,
              url: result.link,
              snippet: result.snippet
            });
          }
        }
      }
    }

    // Generate signals
    const signals = [];
    if (results.funding?.found) {
      signals.push(`Recent funding: ${results.funding.round || 'Unknown round'}${results.funding.amount ? ` - ${results.funding.amount}` : ''}`);
    }
    if (results.hiring?.isHiring) {
      signals.push(`Actively hiring: ${results.hiring.departments.join(', ')}`);
    }
    if (results.recentNews.length > 0) {
      signals.push('Recent news coverage - active in market');
    }
    if (results.awards.length > 0) {
      signals.push('Award-winning company - industry recognition');
    }

    // Calculate growth score
    let growthScore = 0;
    if (results.funding?.found) growthScore += 40;
    if (results.hiring?.isHiring) growthScore += 30;
    if (results.recentNews.length > 2) growthScore += 20;
    if (results.awards.length > 0) growthScore += 10;

    return res.status(200).json({
      found: signals.length > 0,
      domain,
      companyName: searchName,
      data: {
        funding: results.funding,
        hiring: results.hiring,
        recentNews: results.recentNews,
        awards: results.awards,
        signals,
        growthScore
      }
    });

  } catch (error) {
    console.error('Funding enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function searchSerper(apiKey, query) {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!response.ok) return { organic: [] };
    return await response.json();
  } catch {
    return { organic: [] };
  }
}

function extractDate(text) {
  if (!text) return null;

  // Look for various date patterns
  const patterns = [
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d+)\s+(day|week|month|hour)s?\s+ago/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}
