// Vercel Serverless Function - Indeed Hiring Signal Scanner
// Scans Indeed for company job postings to detect hiring signals (receptionist, dispatcher, recent hiring)

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

    // Clean company name from domain if not provided
    const company = companyName || domain.replace(/\.(com|io|co|net|org|biz|us|info)$/i, '').replace(/[-_]/g, ' ');

    // Target keywords for signal detection
    const targetKeywords = {
      receptionist: /\b(receptionist|front\s*desk|office\s*receptionist)\b/i,
      dispatcher: /\b(dispatcher|dispatch|dispatching)\b/i,
      officeManager: /\b(office\s*manager|office\s*administrator|administrative\s*assistant)\b/i
    };

    // Search Indeed specifically for this company's jobs
    const searchQuery = `site:indeed.com "${company}" jobs`;

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
        num: 30 // Get more results to better detect hiring activity
      }),
    });

    if (!serperResponse.ok) {
      console.error('Serper API error:', serperResponse.status);
      return res.status(500).json({ error: 'Search API error' });
    }

    const data = await serperResponse.json();
    const organic = data.organic || [];

    // Filter for Indeed results only
    const indeedResults = organic.filter(r =>
      r.link && r.link.toLowerCase().includes('indeed.com')
    );

    // Analyze job postings
    const jobs = [];
    const signalDetails = {
      hasReceptionist: false,
      hasDispatcher: false,
      hasOfficeManager: false,
      hasRecentHiring: false,
      matchingJobs: []
    };

    for (const result of indeedResults) {
      const title = result.title || '';
      const snippet = result.snippet || '';
      const url = result.link || '';
      const text = `${title} ${snippet}`.toLowerCase();

      // Check if this is a job posting (not just a company page)
      const isJobPosting = text.includes('job') || text.includes('hiring') ||
                          text.includes('position') || text.includes('apply') ||
                          text.includes('salary') || text.includes('employment');

      if (!isJobPosting) continue;

      // Extract job title
      let jobTitle = title.split(/[|\-–—]/)[0].trim();
      jobTitle = jobTitle.replace(/\s+at\s+.*$/i, '').replace(/\s+in\s+.*$/i, '').trim();

      const job = {
        title: jobTitle,
        url: url,
        snippet: snippet.substring(0, 200)
      };

      jobs.push(job);

      // Check for target signals
      const fullText = `${title} ${snippet}`;

      if (targetKeywords.receptionist.test(fullText)) {
        signalDetails.hasReceptionist = true;
        signalDetails.matchingJobs.push({ ...job, signalType: 'receptionist' });
      }

      if (targetKeywords.dispatcher.test(fullText)) {
        signalDetails.hasDispatcher = true;
        signalDetails.matchingJobs.push({ ...job, signalType: 'dispatcher' });
      }

      if (targetKeywords.officeManager.test(fullText)) {
        signalDetails.hasOfficeManager = true;
        signalDetails.matchingJobs.push({ ...job, signalType: 'office_manager' });
      }
    }

    // Recent hiring = 3+ job postings on Indeed
    signalDetails.hasRecentHiring = jobs.length >= 3;

    // Determine primary signal type
    let signalFound = false;
    let signalType = null;
    let signalTypes = [];

    if (signalDetails.hasReceptionist) {
      signalFound = true;
      signalTypes.push('receptionist');
    }
    if (signalDetails.hasDispatcher) {
      signalFound = true;
      signalTypes.push('dispatcher');
    }
    if (signalDetails.hasOfficeManager) {
      signalFound = true;
      signalTypes.push('office_manager');
    }
    if (signalDetails.hasRecentHiring && !signalFound) {
      // Only mark recent_hiring as signal if no specific role found
      signalFound = true;
      signalTypes.push('recent_hiring');
    }

    // Set primary signal type (prioritize specific roles over general hiring)
    if (signalTypes.length > 0) {
      signalType = signalTypes[0]; // Primary signal
    }

    return res.status(200).json({
      signalFound,
      signalType,
      signalTypes, // All detected signals
      totalJobCount: jobs.length,
      domain,
      companyName: company,
      details: signalDetails,
      jobsFound: jobs.slice(0, 10) // Return top 10 jobs
    });

  } catch (error) {
    console.error('Indeed scan error:', error);
    return res.status(500).json({ error: error.message });
  }
}
