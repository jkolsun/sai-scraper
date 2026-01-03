// Vercel Serverless Function - Master Enrichment API
// Calls all enrichment APIs in parallel and aggregates results

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, companyName, industry } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain required' });
    }

    console.log(`Enriching ${domain}...`);

    // Get base URL for API calls
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Call all enrichment APIs in parallel
    const enrichmentPromises = [
      fetchEnrichment(`${baseUrl}/api/enrich-linkedin`, { domain, companyName }),
      fetchEnrichment(`${baseUrl}/api/enrich-jobs`, { domain, companyName }),
      fetchEnrichment(`${baseUrl}/api/enrich-techstack`, { domain }),
      fetchEnrichment(`${baseUrl}/api/enrich-ads`, { domain, companyName, industry }),
      fetchEnrichment(`${baseUrl}/api/enrich-website`, { domain })
    ];

    const [linkedin, jobs, techstack, ads, website] = await Promise.all(enrichmentPromises);

    // Aggregate all signals
    const allSignals = [];

    // LinkedIn signals
    if (linkedin.data?.employeeCount) {
      allSignals.push({
        type: 'company_size',
        source: 'linkedin',
        message: `${linkedin.data.employeeCount} employees on LinkedIn`
      });
    }

    // Job signals
    if (jobs.data?.signals) {
      jobs.data.signals.forEach(signal => {
        allSignals.push({
          type: 'hiring',
          source: 'jobs',
          message: signal
        });
      });
    }
    if (jobs.data?.rolesHiring?.length > 0) {
      allSignals.push({
        type: 'hiring_roles',
        source: 'jobs',
        message: `Hiring for: ${jobs.data.rolesHiring.join(', ')}`
      });
    }

    // Tech stack signals
    if (techstack.data?.signals) {
      techstack.data.signals.forEach(signal => {
        allSignals.push({
          type: 'tech_stack',
          source: 'techstack',
          message: signal
        });
      });
    }

    // Ads signals
    if (ads.data?.signals) {
      ads.data.signals.forEach(signal => {
        allSignals.push({
          type: 'advertising',
          source: 'ads',
          message: signal
        });
      });
    }

    // Website signals
    if (website.data?.signals) {
      website.data.signals.forEach(signal => {
        allSignals.push({
          type: 'website',
          source: 'website',
          message: signal
        });
      });
    }

    // Calculate overall lead score (0-100)
    let score = 50; // Base score

    // Hiring signals boost score
    if (jobs.data?.hiringIntensity === 'high') score += 20;
    else if (jobs.data?.hiringIntensity === 'medium') score += 10;
    else if (jobs.data?.hiringIntensity === 'low') score += 5;

    // Ads indicate budget
    if (ads.data?.isRunningAds) score += 15;

    // Tech stack indicates sophistication
    if (techstack.data?.totalDetected >= 5) score += 10;
    else if (techstack.data?.totalDetected >= 3) score += 5;

    // Contact availability
    if (website.data?.contact?.emails?.length > 0) score += 5;
    if (website.data?.contact?.hasScheduling) score += 5;

    // After hours risk (good for certain use cases)
    if (website.data?.riskScores?.afterHoursRisk) score += 10;

    // Response risk (opportunity)
    if (website.data?.riskScores?.responseRiskScore >= 50) score += 10;

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine buying intent signals
    const buyingSignals = [];

    if (ads.data?.isRunningAds) {
      buyingSignals.push({
        id: 'googlePaidTraffic',
        label: 'Google Paid Traffic Active',
        detected: true
      });
    }

    if (website.data?.riskScores?.afterHoursRisk) {
      buyingSignals.push({
        id: 'afterHoursCoverage',
        label: 'After Hours Coverage Gap',
        detected: true
      });
    }

    if (website.data?.riskScores?.responseRiskScore >= 50) {
      buyingSignals.push({
        id: 'inboundResponseRisk',
        label: 'Inbound Response Risk',
        detected: true
      });
    }

    if (jobs.data?.hiringIntensity !== 'none') {
      buyingSignals.push({
        id: 'activelyHiring',
        label: 'Actively Hiring',
        detected: true
      });
    }

    if (techstack.data?.categories?.crm?.length > 0) {
      buyingSignals.push({
        id: 'hasCRM',
        label: 'Uses CRM Software',
        detected: true
      });
    }

    // Generate "Why Now" reason
    const whyNowReasons = [];
    if (jobs.data?.hiringIntensity === 'high') {
      whyNowReasons.push('Rapidly expanding team');
    }
    if (ads.data?.adIntensity === 'high') {
      whyNowReasons.push('Heavy ad spend indicates growth investment');
    }
    if (website.data?.riskScores?.afterHoursRisk) {
      whyNowReasons.push('No after-hours coverage - missing leads');
    }
    if (jobs.data?.rolesHiring?.includes('Sales / Account Executive')) {
      whyNowReasons.push('Building sales team - scaling revenue');
    }

    const whyNow = whyNowReasons.length > 0
      ? whyNowReasons.join('. ') + '.'
      : 'Company shows standard growth indicators.';

    return res.status(200).json({
      success: true,
      domain,
      companyName: linkedin.data?.name || companyName || domain,
      score,
      signals: allSignals,
      buyingSignals,
      whyNow,
      enrichment: {
        linkedin: linkedin.found ? linkedin.data : null,
        jobs: jobs.found ? jobs.data : null,
        techstack: techstack.found ? techstack.data : null,
        ads: ads.found ? ads.data : null,
        website: website.found ? website.data : null
      },
      metadata: {
        enrichedAt: new Date().toISOString(),
        sourcesChecked: 5,
        sourcesFound: [linkedin, jobs, techstack, ads, website].filter(s => s.found).length
      }
    });

  } catch (error) {
    console.error('Master enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function fetchEnrichment(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return { found: false, error: error.message };
  }
}
