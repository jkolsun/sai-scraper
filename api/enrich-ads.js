// Vercel Serverless Function - Google Ads Detection
// Checks if a company is running paid ads

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { domain, companyName, industry } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain required' });
    }

    // Search for the company's branded terms to see if they run ads
    const brandName = companyName || domain.replace(/\.(com|io|co|net|org)$/i, '').replace(/[-_]/g, ' ');

    // Also search for industry keywords they might bid on
    const industryTerms = {
      'SaaS': ['software', 'platform', 'solution'],
      'Marketing Agency': ['marketing agency', 'seo services', 'digital marketing'],
      'Healthcare': ['healthcare', 'medical', 'clinic'],
      'Legal': ['lawyer', 'attorney', 'law firm'],
      'Real Estate': ['real estate', 'realtor', 'homes for sale'],
      'Insurance': ['insurance', 'coverage', 'quotes'],
      'E-commerce': ['buy', 'shop', 'store'],
      'FinTech': ['financial', 'payments', 'loans'],
      'Construction': ['contractor', 'construction', 'builder'],
      'Professional Services': ['services', 'consulting', 'solutions']
    };

    const searchTerms = industryTerms[industry] || ['services'];

    // Search for the brand name
    const brandSearch = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: brandName,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    const brandData = await brandSearch.json();

    // Check for paid ads in results
    const paidAds = brandData.ads || [];
    const hasOwnBrandAds = paidAds.some(ad =>
      ad.link && ad.link.toLowerCase().includes(domain.toLowerCase())
    );

    // Search for industry terms to see if they're bidding on keywords
    const industrySearch = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${searchTerms[0]} ${brandName}`,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    const industryData = await industrySearch.json();
    const industryAds = industryData.ads || [];
    const hasIndustryAds = industryAds.some(ad =>
      ad.link && ad.link.toLowerCase().includes(domain.toLowerCase())
    );

    // Analyze ad activity
    const allAdsForDomain = [...paidAds, ...industryAds].filter(ad =>
      ad.link && ad.link.toLowerCase().includes(domain.toLowerCase())
    );

    // Determine ad intensity
    let adIntensity = 'none';
    if (allAdsForDomain.length >= 3) adIntensity = 'high';
    else if (allAdsForDomain.length >= 1) adIntensity = 'medium';
    else if (hasOwnBrandAds) adIntensity = 'low';

    // Generate signals
    const signals = [];
    if (hasOwnBrandAds) {
      signals.push('Running brand protection ads - protecting their brand name');
    }
    if (hasIndustryAds) {
      signals.push('Bidding on industry keywords - actively acquiring customers');
    }
    if (allAdsForDomain.length >= 3) {
      signals.push('Heavy ad spend detected - significant marketing budget');
    }
    if (allAdsForDomain.length === 0) {
      signals.push('No Google Ads detected - may rely on organic/referral traffic');
    }

    // Extract ad copy for analysis
    const adCopy = allAdsForDomain.map(ad => ({
      title: ad.title,
      description: ad.description,
      url: ad.link
    }));

    return res.status(200).json({
      found: allAdsForDomain.length > 0,
      domain,
      data: {
        isRunningAds: allAdsForDomain.length > 0,
        hasOwnBrandAds,
        hasIndustryAds,
        adIntensity,
        totalAdsFound: allAdsForDomain.length,
        signals,
        adCopy: adCopy.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Ads enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}
