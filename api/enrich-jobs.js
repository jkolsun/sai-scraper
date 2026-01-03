// Vercel Serverless Function - Job Postings Enrichment
// Searches Indeed, LinkedIn Jobs, and other job boards for company hiring activity

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

    const company = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Search for job postings
    const searchQuery = `"${company}" jobs hiring`;

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
        num: 20
      }),
    });

    if (!serperResponse.ok) {
      return res.status(500).json({ error: 'Serper API error' });
    }

    const data = await serperResponse.json();
    const organic = data.organic || [];

    // Job board domains to look for
    const jobBoards = ['indeed.com', 'linkedin.com/jobs', 'glassdoor.com', 'ziprecruiter.com',
                       'monster.com', 'careers.', 'jobs.', 'workday.com', 'greenhouse.io',
                       'lever.co', 'ashbyhq.com', 'bamboohr.com'];

    const jobs = [];
    const rolesHiring = new Set();

    // Role patterns to detect
    const rolePatterns = {
      'Sales / Account Executive': /\b(sales|account executive|ae|closer)\b/i,
      'Business Development': /\b(business development|bdr|bd rep)\b/i,
      'SDR / BDR': /\b(sdr|bdr|sales development|outbound)\b/i,
      'Marketing': /\b(marketing|growth|demand gen|content)\b/i,
      'Customer Success': /\b(customer success|csm|client success|account manager)\b/i,
      'Engineering': /\b(engineer|developer|software|frontend|backend|fullstack)\b/i,
      'Product': /\b(product manager|product owner|pm)\b/i,
      'Operations': /\b(operations|ops|chief of staff|office manager)\b/i,
      'Design': /\b(designer|ux|ui|creative)\b/i,
      'Finance': /\b(finance|accounting|controller|cfo)\b/i,
      'HR': /\b(hr|human resources|recruiter|talent|people ops)\b/i
    };

    for (const result of organic) {
      const url = result.link || '';
      const title = result.title || '';
      const snippet = result.snippet || '';
      const text = `${title} ${snippet}`.toLowerCase();

      // Check if it's from a job board or careers page
      const isJobPosting = jobBoards.some(board => url.toLowerCase().includes(board));

      if (isJobPosting) {
        // Extract job title
        let jobTitle = title.split(/[|\-–—]/)[0].trim();
        jobTitle = jobTitle.replace(/\s+at\s+.*$/i, '').trim();

        // Detect role category
        for (const [role, pattern] of Object.entries(rolePatterns)) {
          if (pattern.test(text)) {
            rolesHiring.add(role);
          }
        }

        jobs.push({
          title: jobTitle,
          url: url,
          source: extractJobSource(url),
          snippet: snippet.substring(0, 150)
        });
      }
    }

    // Determine hiring intensity
    let hiringIntensity = 'none';
    if (jobs.length >= 10) hiringIntensity = 'high';
    else if (jobs.length >= 5) hiringIntensity = 'medium';
    else if (jobs.length >= 1) hiringIntensity = 'low';

    // Hiring signals
    const signals = [];
    if (rolesHiring.has('Sales / Account Executive') || rolesHiring.has('SDR / BDR')) {
      signals.push('Expanding sales team - likely scaling revenue');
    }
    if (rolesHiring.has('Engineering')) {
      signals.push('Building engineering - likely developing new products');
    }
    if (rolesHiring.has('Marketing')) {
      signals.push('Growing marketing - likely investing in growth');
    }
    if (rolesHiring.has('Customer Success')) {
      signals.push('Hiring CS - likely has growing customer base');
    }
    if (jobs.length >= 10) {
      signals.push('High hiring volume - company in growth phase');
    }

    return res.status(200).json({
      found: jobs.length > 0,
      domain,
      companyName: company,
      data: {
        totalJobs: jobs.length,
        hiringIntensity,
        rolesHiring: Array.from(rolesHiring),
        signals,
        recentJobs: jobs.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Jobs enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function extractJobSource(url) {
  if (url.includes('indeed.com')) return 'Indeed';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('glassdoor.com')) return 'Glassdoor';
  if (url.includes('ziprecruiter.com')) return 'ZipRecruiter';
  if (url.includes('greenhouse.io')) return 'Greenhouse';
  if (url.includes('lever.co')) return 'Lever';
  if (url.includes('workday.com')) return 'Workday';
  if (url.includes('ashbyhq.com')) return 'Ashby';
  if (url.includes('careers.') || url.includes('jobs.')) return 'Company Careers';
  return 'Other';
}
