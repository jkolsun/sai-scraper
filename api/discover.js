// Vercel Serverless Function - Advanced Company Discovery via Serper
// Comprehensive ICP filtering with 65+ filter options (Apollo/ZoomInfo level)
// Supports ANY industry/niche including trades, local services, and verticals

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { filters = {}, maxResults = 25 } = req.body;

    // Extract all filter categories
    const {
      // Firmographic
      industries = [],
      subIndustries = [],
      customIndustry = '', // NEW: Free-text industry/niche search
      employeeRanges = [],
      revenueRanges = [],
      companyTypes = [],
      businessModels = [],
      // Geographic
      countries = [],
      states = [],
      metroAreas = [],
      // Contact/Demographic
      jobTitles = [],
      seniorityLevels = [],
      departments = [],
      // Technographic
      technologies = [],
      techCategories = [],
      // Funding
      fundingStages = [],
      fundingRecency = null,
      // Hiring
      hiringDepartments = [],
      hiringIntensity = null,
      // Intent
      intentSignals = [],
      // Advanced
      keywords = [],
      excludeDomains = [],
      lookalikeDomains = []
    } = filters;

    // Build intelligent search queries
    const queries = buildAdvancedQueries({
      industries, subIndustries, customIndustry, employeeRanges, revenueRanges, companyTypes, businessModels,
      countries, states, metroAreas, jobTitles, seniorityLevels, departments,
      technologies, techCategories, fundingStages, fundingRecency,
      hiringDepartments, hiringIntensity, intentSignals, keywords, lookalikeDomains
    });

    console.log('Generated queries:', queries);

    // Run parallel searches (up to 5 for comprehensive coverage)
    const searchPromises = queries.slice(0, 5).map(query => searchSerper(SERPER_KEY, query));
    const searchResults = await Promise.all(searchPromises);

    // Combine results
    const allOrganic = searchResults.flatMap(r => r.organic || []);

    // Process with advanced filtering
    const companies = processAdvancedResults(allOrganic, {
      industries, subIndustries, customIndustry, employeeRanges, revenueRanges, companyTypes, businessModels,
      countries, states, metroAreas, technologies, fundingStages, excludeDomains
    }, maxResults);

    console.log('Discovered', companies.length, 'companies from', allOrganic.length, 'raw results');

    return res.status(200).json({
      companies,
      totalFound: companies.length,
      queries,
      filtersApplied: Object.entries(filters).filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true)).length
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ==================== COMPREHENSIVE INDUSTRY MAPPINGS ====================
const INDUSTRY_SEARCH_TERMS = {
  // Technology
  'SaaS': ['SaaS company', 'B2B software company', 'cloud software'],
  'Software Development': ['software development company', 'custom software', 'software agency'],
  'IT Services': ['IT services company', 'managed IT', 'IT consulting'],
  'Cybersecurity': ['cybersecurity company', 'security software', 'infosec'],
  'Cloud Computing': ['cloud computing company', 'cloud services', 'cloud infrastructure'],
  'AI/ML': ['AI company', 'machine learning startup', 'artificial intelligence'],
  // Finance
  'FinTech': ['fintech company', 'financial technology', 'payments startup'],
  'Banking': ['bank', 'banking services', 'financial institution'],
  'Insurance': ['insurance company', 'insurance agency', 'insurtech'],
  'Investment': ['investment firm', 'private equity', 'venture capital'],
  'Accounting': ['accounting firm', 'CPA firm', 'bookkeeping services'],
  // Healthcare
  'Healthcare': ['healthcare company', 'medical practice', 'health services'],
  'Biotech': ['biotech company', 'biotechnology', 'life sciences'],
  'Pharmaceuticals': ['pharmaceutical company', 'pharma', 'drug manufacturer'],
  'Medical Devices': ['medical device company', 'medical equipment', 'medtech'],
  'Telehealth': ['telehealth company', 'telemedicine', 'virtual healthcare'],
  // Commerce
  'E-commerce': ['ecommerce company', 'online store', 'DTC brand'],
  'Retail': ['retail company', 'retail chain', 'consumer retail'],
  'Wholesale': ['wholesale company', 'distributor', 'B2B wholesale'],
  'Consumer Goods': ['consumer goods company', 'CPG', 'consumer products'],
  // Services
  'Professional Services': ['professional services firm', 'consulting company', 'business services'],
  'Consulting': ['consulting firm', 'management consulting', 'strategy consulting'],
  'Marketing Agency': ['digital marketing agency', 'advertising agency', 'marketing firm'],
  'Legal': ['law firm', 'legal services', 'attorney practice'],
  'Recruiting': ['recruiting agency', 'staffing company', 'talent acquisition'],
  // Industrial
  'Manufacturing': ['manufacturing company', 'industrial manufacturer', 'production company'],
  'Construction': ['construction company', 'general contractor', 'building company'],
  'Logistics': ['logistics company', 'freight company', 'supply chain'],
  'Transportation': ['transportation company', 'trucking company', 'fleet services'],
  'Energy': ['energy company', 'renewable energy', 'utilities'],
  // Other
  'Real Estate': ['real estate company', 'property management', 'real estate brokerage'],
  'EdTech': ['edtech company', 'education technology', 'online learning'],
  'Media/Entertainment': ['media company', 'entertainment company', 'content production'],
  'Hospitality': ['hospitality company', 'hotel', 'restaurant group'],
  'Non-Profit': ['nonprofit organization', 'NGO', 'charity']
};

const SUB_INDUSTRY_TERMS = {
  'CRM': 'CRM software',
  'Marketing Automation': 'marketing automation platform',
  'HR Tech': 'HR technology company',
  'Sales Tech': 'sales enablement software',
  'Project Management': 'project management software',
  'Analytics': 'analytics platform',
  'Hospitals': 'hospital',
  'Clinics': 'medical clinic',
  'Dental': 'dental practice',
  'Mental Health': 'mental health services',
  'Payments': 'payments company',
  'Lending': 'lending platform',
  'Wealth Management': 'wealth management firm',
  'D2C Brands': 'direct to consumer brand',
  'Marketplaces': 'online marketplace',
  'Digital Marketing': 'digital marketing agency',
  'SEO/SEM': 'SEO agency',
  'Content Marketing': 'content marketing agency',
  'Personal Injury': 'personal injury lawyer',
  'Corporate Law': 'corporate law firm',
  'Immigration': 'immigration attorney',
  'Residential': 'residential real estate',
  'Commercial': 'commercial real estate',
  'Property Management': 'property management company'
};

const LOCATION_TERMS = {
  'United States': ['USA', 'US', 'United States', 'American'],
  'California': ['California', 'CA', 'Bay Area', 'Los Angeles', 'San Diego'],
  'New York': ['New York', 'NY', 'NYC', 'Manhattan'],
  'Texas': ['Texas', 'TX', 'Austin', 'Dallas', 'Houston'],
  'Florida': ['Florida', 'FL', 'Miami', 'Tampa'],
  'Illinois': ['Illinois', 'IL', 'Chicago'],
  'Massachusetts': ['Massachusetts', 'MA', 'Boston'],
  'Washington': ['Washington', 'WA', 'Seattle'],
  'Colorado': ['Colorado', 'CO', 'Denver'],
  'Georgia': ['Georgia', 'GA', 'Atlanta'],
  'Canada': ['Canada', 'Canadian', 'Toronto', 'Vancouver'],
  'United Kingdom': ['UK', 'United Kingdom', 'London', 'British'],
  'Germany': ['Germany', 'German', 'Berlin', 'Munich'],
  'France': ['France', 'French', 'Paris'],
  'Australia': ['Australia', 'Australian', 'Sydney', 'Melbourne'],
  'Netherlands': ['Netherlands', 'Dutch', 'Amsterdam'],
  'Ireland': ['Ireland', 'Irish', 'Dublin'],
  'Israel': ['Israel', 'Israeli', 'Tel Aviv'],
  'Singapore': ['Singapore'],
  'India': ['India', 'Indian', 'Bangalore', 'Mumbai']
};

const METRO_TERMS = {
  'San Francisco Bay Area': 'San Francisco Bay Area',
  'New York City': 'NYC',
  'Los Angeles': 'Los Angeles',
  'Chicago': 'Chicago',
  'Boston': 'Boston',
  'Seattle': 'Seattle',
  'Austin': 'Austin Texas',
  'Denver': 'Denver',
  'Atlanta': 'Atlanta',
  'Dallas-Fort Worth': 'Dallas',
  'Miami': 'Miami',
  'Washington DC': 'Washington DC'
};

const SIZE_TERMS = {
  '1-10 (Startup)': 'startup',
  '11-50 (Small)': 'small business',
  '51-200 (Mid-Market)': 'growing company',
  '201-500 (Growth)': 'mid-size company',
  '501-1000 (Scale-up)': 'scale-up company',
  '1001-5000 (Enterprise)': 'enterprise company',
  '5000+ (Large Enterprise)': 'large enterprise'
};

const FUNDING_TERMS = {
  'Pre-Seed': 'pre-seed startup',
  'Seed': 'seed funded startup',
  'Series A': 'Series A startup',
  'Series B': 'Series B company',
  'Series C': 'Series C company',
  'Series D+': 'late stage startup',
  'Private Equity': 'PE backed company',
  'IPO': 'recently IPO',
  'Bootstrapped': 'bootstrapped company'
};

const HIRING_DEPT_TERMS = {
  'Sales': 'hiring sales',
  'Marketing': 'hiring marketing',
  'Engineering': 'hiring engineers',
  'Product': 'hiring product manager',
  'Customer Success': 'hiring customer success',
  'Operations': 'hiring operations',
  'Finance': 'hiring finance',
  'HR': 'hiring HR',
  'Design': 'hiring designers',
  'Data Science': 'hiring data scientist',
  'DevOps': 'hiring DevOps',
  'Security': 'hiring security engineer'
};

const TECH_SEARCH_TERMS = {
  'Salesforce': 'uses Salesforce',
  'HubSpot': 'uses HubSpot',
  'Marketo': 'uses Marketo',
  'Intercom': 'uses Intercom',
  'Drift': 'uses Drift',
  'Zendesk': 'uses Zendesk',
  'Shopify': 'Shopify store',
  'AWS': 'uses AWS',
  'Google Cloud': 'Google Cloud customer',
  'Stripe': 'uses Stripe',
  'Segment': 'uses Segment'
};

const INTENT_SEARCH_TERMS = {
  'Recent Funding': 'recently raised funding',
  'Leadership Change': 'new CEO appointed',
  'New Tech Adoption': 'technology adoption',
  'Expansion News': 'company expansion',
  'Product Launch': 'new product launch',
  'M&A Activity': 'acquisition announced',
  'Job Posting Spike': 'rapidly hiring',
  'Traffic Growth': 'fast growing',
  'Ad Spend Increase': 'advertising campaign',
  'Competitor Mentions': 'competitor alternative'
};

// ==================== INTELLIGENT INDUSTRY EXPANSION ====================
// This system expands any industry/niche into comprehensive search terms
const INDUSTRY_SYNONYMS = {
  // Trades & Home Services
  'hvac': ['HVAC company', 'heating and cooling company', 'air conditioning contractor', 'HVAC contractor', 'heating contractor', 'AC repair company', 'furnace company', 'HVAC service', 'climate control company'],
  'plumbing': ['plumbing company', 'plumber', 'plumbing contractor', 'plumbing services', 'drain cleaning company', 'water heater company', 'pipe repair', 'plumbing repair'],
  'plumber': ['plumbing company', 'plumber', 'plumbing contractor', 'plumbing services', 'licensed plumber'],
  'electrical': ['electrical contractor', 'electrician company', 'electrical services', 'commercial electrician', 'residential electrician', 'electrical repair'],
  'electrician': ['electrician company', 'electrical contractor', 'licensed electrician', 'electrical services'],
  'roofing': ['roofing company', 'roofing contractor', 'roof repair company', 'commercial roofing', 'residential roofing', 'roofer'],
  'landscaping': ['landscaping company', 'landscape contractor', 'lawn care company', 'landscape design', 'grounds maintenance', 'landscaper'],
  'painting': ['painting company', 'painting contractor', 'commercial painter', 'residential painter', 'house painter'],
  'flooring': ['flooring company', 'flooring contractor', 'hardwood flooring', 'tile contractor', 'carpet installer'],
  'pest control': ['pest control company', 'exterminator', 'pest management', 'termite control', 'pest removal'],
  'cleaning': ['cleaning company', 'janitorial services', 'commercial cleaning', 'cleaning service', 'office cleaning'],
  'moving': ['moving company', 'movers', 'relocation company', 'moving services', 'professional movers'],
  'garage door': ['garage door company', 'garage door repair', 'garage door installer', 'overhead door company'],
  'fencing': ['fencing company', 'fence contractor', 'fence installer', 'fencing services'],
  'concrete': ['concrete company', 'concrete contractor', 'concrete services', 'concrete construction'],
  'paving': ['paving company', 'asphalt paving', 'paving contractor', 'driveway paving'],
  'pool': ['pool company', 'pool contractor', 'pool service', 'pool installation', 'pool maintenance'],
  'solar': ['solar company', 'solar installer', 'solar panel company', 'solar energy company', 'solar contractor'],
  'window': ['window company', 'window installation', 'window replacement', 'window contractor'],
  'siding': ['siding company', 'siding contractor', 'vinyl siding', 'siding installation'],
  'insulation': ['insulation company', 'insulation contractor', 'spray foam insulation', 'home insulation'],
  'remodeling': ['remodeling company', 'home remodeling', 'renovation contractor', 'kitchen remodeling', 'bathroom remodeling'],
  'general contractor': ['general contractor', 'construction company', 'building contractor', 'GC company'],
  'handyman': ['handyman service', 'handyman company', 'home repair service', 'property maintenance'],

  // Healthcare & Medical
  'dentist': ['dental practice', 'dentist office', 'dental clinic', 'family dentist', 'cosmetic dentist', 'dental group'],
  'dental': ['dental practice', 'dental clinic', 'dental office', 'dentistry', 'dental group'],
  'chiropractor': ['chiropractic clinic', 'chiropractor office', 'chiropractic practice', 'spine clinic'],
  'physical therapy': ['physical therapy clinic', 'PT practice', 'rehabilitation center', 'physical therapist'],
  'veterinary': ['veterinary clinic', 'vet office', 'animal hospital', 'veterinarian', 'pet clinic'],
  'vet': ['veterinary clinic', 'vet office', 'animal hospital', 'veterinarian'],
  'optometry': ['optometry practice', 'eye doctor', 'optometrist', 'vision center', 'eye care'],
  'dermatology': ['dermatology practice', 'dermatologist', 'skin clinic', 'dermatology clinic'],
  'orthopedic': ['orthopedic practice', 'orthopedic surgeon', 'orthopedic clinic', 'sports medicine'],
  'plastic surgery': ['plastic surgery practice', 'cosmetic surgery', 'plastic surgeon', 'aesthetic clinic'],
  'medspa': ['medical spa', 'medspa', 'med spa', 'aesthetic clinic', 'cosmetic clinic'],
  'urgent care': ['urgent care clinic', 'walk-in clinic', 'immediate care', 'urgent care center'],
  'home health': ['home health agency', 'home care company', 'home health care', 'in-home care'],
  'hospice': ['hospice care', 'hospice agency', 'palliative care', 'end of life care'],
  'pharmacy': ['pharmacy', 'drugstore', 'compounding pharmacy', 'retail pharmacy'],

  // Automotive
  'auto repair': ['auto repair shop', 'car repair', 'auto mechanic', 'automotive repair', 'auto service'],
  'auto dealer': ['car dealership', 'auto dealer', 'car dealer', 'automobile dealer', 'vehicle dealership'],
  'car dealership': ['car dealership', 'auto dealer', 'new car dealer', 'used car dealer'],
  'auto body': ['auto body shop', 'collision repair', 'body shop', 'car body repair'],
  'tire shop': ['tire shop', 'tire dealer', 'tire store', 'tire service'],
  'oil change': ['oil change shop', 'quick lube', 'oil change service', 'lube center'],
  'car wash': ['car wash', 'auto detailing', 'car detailing', 'auto spa'],
  'towing': ['towing company', 'tow truck', 'roadside assistance', 'towing service'],

  // Food & Beverage
  'restaurant': ['restaurant', 'dining establishment', 'eatery', 'food service', 'restaurant group'],
  'catering': ['catering company', 'catering service', 'event catering', 'corporate catering'],
  'bakery': ['bakery', 'bake shop', 'pastry shop', 'bread company'],
  'food truck': ['food truck', 'mobile food', 'food cart', 'street food'],
  'brewery': ['brewery', 'craft brewery', 'beer company', 'microbrewery'],
  'coffee shop': ['coffee shop', 'cafe', 'coffee roaster', 'espresso bar'],
  'bar': ['bar', 'pub', 'tavern', 'nightclub', 'lounge'],

  // Professional Services
  'accountant': ['accounting firm', 'CPA firm', 'accountant', 'accounting services', 'tax accountant'],
  'cpa': ['CPA firm', 'certified public accountant', 'accounting firm', 'tax services'],
  'bookkeeper': ['bookkeeping service', 'bookkeeper', 'bookkeeping company'],
  'attorney': ['law firm', 'attorney', 'lawyer', 'legal services', 'law office'],
  'lawyer': ['law firm', 'lawyer', 'attorney', 'legal practice', 'law office'],
  'architect': ['architecture firm', 'architect', 'architectural design', 'design firm'],
  'engineer': ['engineering firm', 'engineering company', 'engineering services'],
  'surveyor': ['surveying company', 'land surveyor', 'survey company'],
  'interior design': ['interior design firm', 'interior designer', 'design studio'],
  'photography': ['photography studio', 'photographer', 'photo studio', 'photography business'],
  'videography': ['video production company', 'videographer', 'video production'],
  'printing': ['printing company', 'print shop', 'commercial printing', 'printer'],
  'staffing': ['staffing agency', 'recruiting firm', 'employment agency', 'temp agency'],

  // Fitness & Wellness
  'gym': ['gym', 'fitness center', 'health club', 'fitness studio'],
  'personal trainer': ['personal training', 'fitness trainer', 'personal trainer', 'training studio'],
  'yoga': ['yoga studio', 'yoga center', 'yoga practice'],
  'pilates': ['pilates studio', 'pilates center'],
  'martial arts': ['martial arts studio', 'karate school', 'MMA gym', 'martial arts school'],
  'spa': ['spa', 'day spa', 'wellness spa', 'massage spa'],
  'massage': ['massage therapy', 'massage studio', 'massage therapist'],
  'salon': ['hair salon', 'beauty salon', 'salon', 'hair studio'],
  'barber': ['barber shop', 'barbershop', 'barber'],
  'nail salon': ['nail salon', 'nail spa', 'manicure'],

  // Education & Childcare
  'daycare': ['daycare center', 'child care', 'preschool', 'childcare center', 'early learning'],
  'preschool': ['preschool', 'pre-k', 'early childhood', 'nursery school'],
  'tutoring': ['tutoring center', 'tutoring service', 'learning center', 'tutor'],
  'driving school': ['driving school', 'driver education', 'driving lessons'],
  'music school': ['music school', 'music lessons', 'music academy'],
  'dance studio': ['dance studio', 'dance school', 'dance academy'],

  // Retail
  'furniture': ['furniture store', 'furniture company', 'furniture retailer'],
  'appliance': ['appliance store', 'appliance dealer', 'appliance company'],
  'jewelry': ['jewelry store', 'jeweler', 'jewelry shop'],
  'pet store': ['pet store', 'pet shop', 'pet supply'],
  'sporting goods': ['sporting goods store', 'sports equipment', 'athletic store'],
  'hardware store': ['hardware store', 'home improvement store', 'building supply'],

  // Events & Entertainment
  'wedding': ['wedding venue', 'wedding planner', 'event venue', 'wedding services'],
  'event planning': ['event planner', 'event planning company', 'event management'],
  'dj': ['DJ service', 'disc jockey', 'wedding DJ', 'event DJ'],
  'photographer': ['photography studio', 'photographer', 'wedding photographer'],

  // Agriculture & Outdoor
  'farm': ['farm', 'agricultural company', 'farming operation', 'ranch'],
  'nursery': ['plant nursery', 'garden center', 'nursery', 'greenhouse'],
  'tree service': ['tree service', 'arborist', 'tree removal', 'tree care'],
  'lawn care': ['lawn care company', 'lawn service', 'lawn maintenance', 'mowing service'],

  // Technology & Digital
  'web design': ['web design agency', 'web developer', 'website design', 'web development'],
  'seo': ['SEO agency', 'SEO company', 'search engine optimization', 'digital marketing'],
  'it support': ['IT support company', 'managed IT', 'IT services', 'tech support'],
  'app development': ['app development company', 'mobile app developer', 'app developer'],

  // Storage & Logistics
  'storage': ['self storage', 'storage facility', 'mini storage', 'storage company'],
  'warehouse': ['warehouse', 'warehousing', 'distribution center', 'fulfillment'],
  'freight': ['freight company', 'trucking company', 'freight broker', 'logistics'],
  'courier': ['courier service', 'delivery service', 'messenger service']
};

// Expand a custom industry term into multiple search variations
function expandIndustryTerm(term) {
  const normalized = term.toLowerCase().trim();

  // Check direct match in synonyms
  if (INDUSTRY_SYNONYMS[normalized]) {
    return INDUSTRY_SYNONYMS[normalized];
  }

  // Check partial matches
  for (const [key, values] of Object.entries(INDUSTRY_SYNONYMS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return values;
    }
  }

  // Smart term generation for unknown industries
  const baseTerms = [];
  const cleanTerm = term.trim();

  // Generate variations
  baseTerms.push(`${cleanTerm} company`);
  baseTerms.push(`${cleanTerm} contractor`);
  baseTerms.push(`${cleanTerm} services`);
  baseTerms.push(`${cleanTerm} business`);
  baseTerms.push(`best ${cleanTerm} companies`);
  baseTerms.push(`top ${cleanTerm} providers`);
  baseTerms.push(`${cleanTerm} near me`); // Good for local businesses
  baseTerms.push(`commercial ${cleanTerm}`);
  baseTerms.push(`${cleanTerm} professionals`);

  return baseTerms;
}

// ==================== BUILD ADVANCED QUERIES ====================
function buildAdvancedQueries(filters) {
  const queries = [];
  const {
    industries, subIndustries, customIndustry, employeeRanges, companyTypes, businessModels,
    countries, states, metroAreas, technologies, fundingStages,
    hiringDepartments, intentSignals, keywords, lookalikeDomains
  } = filters;

  // Helper to add location context to a query
  const addLocationVariants = (baseTerm) => {
    const variants = [];

    if (metroAreas.length > 0) {
      // Metro areas are most specific
      for (const metro of metroAreas.slice(0, 3)) {
        variants.push(`${baseTerm} ${METRO_TERMS[metro] || metro}`);
      }
    } else if (states.length > 0) {
      // State-level targeting
      for (const state of states.slice(0, 3)) {
        const stateTerms = LOCATION_TERMS[state] || [state];
        variants.push(`${baseTerm} ${stateTerms[0]}`);
      }
    } else if (countries.length > 0) {
      // Country-level targeting
      for (const country of countries.slice(0, 2)) {
        const locTerms = LOCATION_TERMS[country] || [country];
        variants.push(`${baseTerm} ${locTerms[0]}`);
      }
    } else {
      // No location - just the base term
      variants.push(baseTerm);
    }

    return variants;
  };

  // ==================== PRIORITY 1: CUSTOM INDUSTRY (Most Important) ====================
  if (customIndustry && customIndustry.trim()) {
    const customTerms = expandIndustryTerm(customIndustry);
    console.log(`Expanded "${customIndustry}" to:`, customTerms);

    // Add top expanded terms with location variants
    for (const term of customTerms.slice(0, 4)) {
      queries.push(...addLocationVariants(term));
    }

    // Also add some without location for broader coverage
    queries.push(customTerms[0]);
    if (customTerms[1]) queries.push(customTerms[1]);
  }

  // ==================== PRIORITY 2: PREDEFINED INDUSTRIES ====================
  if (industries.length > 0) {
    for (const industry of industries.slice(0, 2)) {
      const terms = INDUSTRY_SEARCH_TERMS[industry] || [industry.toLowerCase() + ' company'];
      const mainTerm = terms[0];

      queries.push(...addLocationVariants(mainTerm));

      // Add alternative term if available
      if (terms[1] && queries.length < 8) {
        queries.push(...addLocationVariants(terms[1]).slice(0, 1));
      }
    }
  }

  // ==================== PRIORITY 3: SUB-INDUSTRIES ====================
  if (subIndustries.length > 0) {
    for (const sub of subIndustries.slice(0, 2)) {
      const subTerm = SUB_INDUSTRY_TERMS[sub] || sub.toLowerCase();
      queries.push(...addLocationVariants(subTerm).slice(0, 2));
    }
  }

  // ==================== PRIORITY 4: SIZE + INDUSTRY ====================
  if (employeeRanges.length > 0) {
    const sizeTerm = SIZE_TERMS[employeeRanges[0]] || '';
    const industryTerm = customIndustry?.trim()
      || INDUSTRY_SEARCH_TERMS[industries[0]]?.[0]
      || industries[0]
      || '';

    if (sizeTerm && industryTerm) {
      queries.push(`${sizeTerm} ${industryTerm}`);
    }
  }

  // ==================== PRIORITY 5: BUSINESS MODEL ====================
  if (businessModels.length > 0) {
    for (const model of businessModels.slice(0, 2)) {
      const modelTerms = {
        'B2B': 'B2B company',
        'B2C': 'B2C company',
        'SaaS': 'SaaS startup',
        'D2C': 'direct to consumer brand',
        'Marketplace': 'online marketplace',
        'Subscription': 'subscription business'
      };

      if (modelTerms[model]) {
        const industryContext = customIndustry?.trim() || industries[0] || '';
        if (industryContext) {
          queries.push(`${modelTerms[model]} ${industryContext}`);
        } else {
          queries.push(modelTerms[model]);
        }
      }
    }
  }

  // ==================== PRIORITY 6: FUNDING ====================
  if (fundingStages.length > 0) {
    for (const stage of fundingStages.slice(0, 2)) {
      const fundingTerm = FUNDING_TERMS[stage] || stage;
      const industryContext = customIndustry?.trim()
        || INDUSTRY_SEARCH_TERMS[industries[0]]?.[0]
        || industries[0]
        || '';

      if (industryContext) {
        queries.push(`${fundingTerm} ${industryContext}`);
      } else {
        queries.push(fundingTerm);
      }
    }
  }

  // ==================== PRIORITY 7: HIRING SIGNALS ====================
  if (hiringDepartments.length > 0) {
    for (const dept of hiringDepartments.slice(0, 2)) {
      const hiringTerm = HIRING_DEPT_TERMS[dept] || `hiring ${dept.toLowerCase()}`;
      const industryContext = customIndustry?.trim()
        || INDUSTRY_SEARCH_TERMS[industries[0]]?.[0]
        || industries[0]
        || 'company';

      queries.push(`${industryContext} ${hiringTerm}`);
    }
  }

  // ==================== PRIORITY 8: TECHNOLOGY ====================
  if (technologies.length > 0) {
    for (const tech of technologies.slice(0, 2)) {
      const techTerm = TECH_SEARCH_TERMS[tech] || `uses ${tech}`;
      const industryContext = customIndustry?.trim()
        || INDUSTRY_SEARCH_TERMS[industries[0]]?.[0]
        || industries[0]
        || 'company';

      queries.push(`${industryContext} ${techTerm}`);
    }
  }

  // ==================== PRIORITY 9: INTENT SIGNALS ====================
  if (intentSignals.length > 0) {
    for (const signal of intentSignals.slice(0, 2)) {
      const intentTerm = INTENT_SEARCH_TERMS[signal] || signal.toLowerCase();
      const industryContext = customIndustry?.trim()
        || INDUSTRY_SEARCH_TERMS[industries[0]]?.[0]
        || industries[0]
        || 'company';

      queries.push(`${industryContext} ${intentTerm}`);
    }
  }

  // ==================== PRIORITY 10: KEYWORDS ====================
  if (keywords.length > 0) {
    for (const keyword of keywords.slice(0, 2)) {
      queries.push(`${keyword} company`);
      queries.push(`${keyword} business`);
    }
  }

  // ==================== PRIORITY 11: LOOKALIKE DOMAINS ====================
  if (lookalikeDomains.length > 0) {
    for (const domain of lookalikeDomains.slice(0, 2)) {
      const cleanDomain = domain.replace(/\.(com|io|co|ai|org|net)$/i, '');
      queries.push(`companies like ${cleanDomain}`);
      queries.push(`${cleanDomain} competitors`);
      queries.push(`${cleanDomain} alternatives`);
    }
  }

  // ==================== FALLBACK ====================
  if (queries.length === 0) {
    queries.push('fast growing B2B companies 2024');
    queries.push('top SMB companies USA');
  }

  // Dedupe, clean, and return top queries
  const uniqueQueries = [...new Set(queries.map(q => q.trim()).filter(q => q.length > 3))];
  console.log(`Generated ${uniqueQueries.length} unique queries:`, uniqueQueries.slice(0, 10));

  return uniqueQueries.slice(0, 10);
}

// ==================== SERPER API ====================
async function searchSerper(apiKey, query) {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
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
      console.error(`Serper error for "${query}":`, await response.text());
      return { organic: [] };
    }

    return await response.json();
  } catch (error) {
    console.error(`Search error for "${query}":`, error);
    return { organic: [] };
  }
}

// ==================== DOMAIN QUALITY VALIDATION ====================
function validateDomainQuality(domain) {
  // Returns { valid: boolean, score: number, reason?: string }
  // NOTE: Be permissive - we want more results, not fewer. Only block obvious spam.

  // 1. Basic format validation
  if (!domain || domain.length < 3 || domain.length > 100) {
    return { valid: false, score: 0, reason: 'invalid_length' };
  }

  // 2. Must have a TLD (any TLD with 2+ chars is valid)
  if (!/\.[a-z]{2,}$/i.test(domain)) {
    return { valid: false, score: 0, reason: 'no_tld' };
  }

  // 3. No IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    return { valid: false, score: 0, reason: 'ip_address' };
  }

  // 4. Only block OBVIOUS spam TLDs (very limited list)
  const spamTLDs = /\.(xyz|top|click|gq|ml|cf|ga|tk|pw|ws)$/i;
  if (spamTLDs.test(domain)) {
    return { valid: false, score: 10, reason: 'spam_tld' };
  }

  // 5. Check for obvious spam patterns only
  const spamPatterns = [
    /^[a-z]{20,}\./, // Very long random strings (20+ chars)
    /-{3,}/, // 3+ consecutive hyphens
    /^(test|demo|example|sample|fake|spam)\./, // Test domains at start
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(domain)) {
      return { valid: false, score: 10, reason: 'spam_pattern' };
    }
  }

  // 6. Check domain name part (without TLD)
  const domainName = domain.split('.')[0];
  if (domainName.length < 2) {
    return { valid: false, score: 0, reason: 'name_too_short' };
  }

  // 7. Calculate quality score (0-100) - be generous
  let score = 60; // Higher base score

  // Bonus for common business TLDs
  if (/\.(com|io|co|net|org)$/i.test(domain)) score += 15;
  else if (/\.(ai|app|dev|tech|biz|us|ca|uk)$/i.test(domain)) score += 10;

  // Small penalty for numbers (but don't block)
  const numberCount = (domain.match(/\d/g) || []).length;
  score -= numberCount * 2;

  // Small penalty for hyphens (but don't block)
  const hyphenCount = (domain.match(/-/g) || []).length;
  score -= hyphenCount * 3;

  // Bonus for reasonable length
  if (domainName.length >= 4 && domainName.length <= 20) score += 10;

  return { valid: true, score: Math.max(30, Math.min(100, score)) };
}

// ==================== COMPANY NAME QUALITY ====================
function validateCompanyName(name) {
  if (!name || name.length < 2) return { valid: false, cleanName: null };

  // Clean the name
  let cleanName = name
    .replace(/\s+(Inc|LLC|Ltd|Corp|Co|Company|Services|Solutions|Group|Technologies|Tech|International|Intl)\.?$/i, '')
    .replace(/[^\w\s&\-']/g, '') // Remove special chars except &, -, '
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize properly
  cleanName = cleanName.split(' ').map(word => {
    if (word.length <= 2 && word.toUpperCase() === word) return word; // Keep acronyms
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  // Validation checks
  const issues = [];

  // Too short or too long
  if (cleanName.length < 2) issues.push('too_short');
  if (cleanName.length > 50) issues.push('too_long');

  // All numbers or mostly numbers
  if (/^\d+$/.test(cleanName)) issues.push('all_numbers');
  if ((cleanName.match(/\d/g) || []).length > cleanName.length * 0.5) issues.push('mostly_numbers');

  // Generic/spam names
  const genericNames = [
    'home', 'page', 'welcome', 'index', 'about', 'contact', 'services',
    'company', 'business', 'website', 'site', 'blog', 'news', 'media',
    'online', 'web', 'digital', 'the', 'best', 'top', 'free'
  ];
  if (genericNames.includes(cleanName.toLowerCase())) issues.push('generic_name');

  // Single word that's too generic
  if (cleanName.split(' ').length === 1 && cleanName.length < 4) issues.push('too_generic');

  return {
    valid: issues.length === 0,
    cleanName: issues.length === 0 ? cleanName : null,
    originalName: name,
    issues
  };
}

// ==================== PROCESS RESULTS ====================
function processAdvancedResults(organic, filters, maxResults) {
  const { excludeDomains = [] } = filters;

  // Comprehensive skip list
  const skipDomains = new Set([
    // Social & Forums
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'tiktok.com',
    'reddit.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com', 'discord.com', 'x.com',
    'threads.net', 'mastodon.social', 'bluesky.app', 'pinterest.com', 'snapchat.com',
    // Directories & Listings
    'yelp.com', 'yellowpages.com', 'bbb.org', 'mapquest.com', 'manta.com', 'dnb.com',
    'angi.com', 'homeadvisor.com', 'thumbtack.com', 'houzz.com', 'porch.com', 'angieslist.com',
    'zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'apartments.com', 'homes.com',
    'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com', 'salary.com', 'careerbuilder.com',
    'avvo.com', 'findlaw.com', 'healthgrades.com', 'zocdoc.com', 'vitals.com', 'webmd.com',
    'tripadvisor.com', 'expedia.com', 'booking.com', 'kayak.com', 'hotels.com',
    // News & Media
    'forbes.com', 'inc.com', 'wikipedia.org', 'medium.com', 'bloomberg.com', 'wsj.com',
    'techcrunch.com', 'wired.com', 'cnn.com', 'nytimes.com', 'theverge.com', 'venturebeat.com',
    'businessinsider.com', 'entrepreneur.com', 'fastcompany.com', 'huffpost.com', 'buzzfeed.com',
    'mashable.com', 'engadget.com', 'arstechnica.com', 'zdnet.com', 'cnet.com', 'pcmag.com',
    // Big Tech
    'amazon.com', 'google.com', 'apple.com', 'microsoft.com', 'meta.com', 'netflix.com',
    'salesforce.com', 'oracle.com', 'ibm.com', 'adobe.com', 'sap.com', 'vmware.com',
    // E-commerce Platforms
    'shopify.com', 'wix.com', 'squarespace.com', 'wordpress.com', 'godaddy.com', 'weebly.com',
    'bigcommerce.com', 'magento.com', 'webflow.com', 'carrd.co', 'notion.so',
    // B2B Data/Review Sites
    'crunchbase.com', 'pitchbook.com', 'owler.com', 'zoominfo.com', 'apollo.io', 'clearbit.com',
    'g2.com', 'capterra.com', 'trustradius.com', 'getapp.com', 'softwareadvice.com', 'gartner.com',
    'clutch.co', 'goodfirms.co', 'sortlist.com', 'trustpilot.com', 'sitejabber.com',
    // Startup Lists
    'topstartups.io', 'wellfound.com', 'ycombinator.com', 'builtin.com', 'angel.co', 'seedtable.com',
    'producthunt.com', 'betalist.com', 'f6s.com', 'startupranking.com', 'startupblink.com',
    // Education & Learning
    'coursera.org', 'udemy.com', 'skillshare.com', 'linkedin.com/learning', 'pluralsight.com',
    'edx.org', 'khanacademy.org', 'codecademy.com', 'udacity.com', 'brilliant.org',
    // Developer/Code
    'github.com', 'gitlab.com', 'npm.com', 'pypi.org', 'bitbucket.org', 'codepen.io',
    'jsfiddle.net', 'replit.com', 'codesandbox.io', 'vercel.com', 'netlify.com', 'heroku.com',
    // Government & Institutional
    'usa.gov', 'gov.uk', 'canada.ca', 'europa.eu', 'un.org', 'who.int',
    // Reference & Tools
    'dictionary.com', 'thesaurus.com', 'translate.google.com', 'wolframalpha.com',
    'archive.org', 'scribd.com', 'slideshare.net', 'prezi.com', 'canva.com',
    // Legal Directories
    'martindale.com', 'lawyers.com', 'justia.com', 'nolo.com', 'lawinfo.com',
    // Local/Maps
    'google.com/maps', 'maps.apple.com', 'bing.com/maps', 'foursquare.com', 'citysearch.com'
  ]);

  // Add user-excluded domains
  excludeDomains.forEach(d => skipDomains.add(d.toLowerCase()));

  // Enhanced skip patterns
  const skipPatterns = [
    'wiki', 'news', 'directory', 'review', 'rating', 'compare', 'list-of', 'top-10', 'best-',
    'forum', 'community', 'blog', 'article', 'guide', 'tutorial', 'how-to', 'what-is',
    'template', 'example', 'sample', 'demo', 'test', 'free-', '-free',
    'download', 'torrent', 'crack', 'serial', 'keygen', 'hack',
    'coupon', 'discount', 'deal', 'promo', 'offer', 'sale',
    'jobs-at', 'careers-at', 'work-at', 'join-', 'hiring-'
  ];

  // URL patterns to skip
  const skipUrlPatterns = [
    '/blog/', '/articles/', '/news/', '/press/', '/media/',
    '/careers/', '/jobs/', '/about-us/', '/contact-us/',
    '/privacy', '/terms', '/legal/', '/sitemap',
    '/tag/', '/category/', '/author/', '/page/',
    '/wp-content/', '/wp-admin/', '/feed/',
    '/search?', '/results?', '?q=', '&q='
  ];

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

    // ========== DOMAIN VALIDATION ==========
    // 1. Skip seen domains
    if (seenDomains.has(domain)) continue;

    // 2. Skip blocked domains
    if (skipDomains.has(domain)) continue;

    // 3. Validate domain quality
    const domainQuality = validateDomainQuality(domain);
    if (!domainQuality.valid) continue; // Only skip truly invalid domains, not low-score ones

    // 4. Check skip patterns in domain
    let shouldSkip = false;
    for (const blocked of skipDomains) {
      const blockedBase = blocked.replace(/\.(com|org|io|net|co)$/i, '');
      if (domain.includes(blockedBase) && blockedBase.length > 4) {
        shouldSkip = true;
        break;
      }
    }

    // 5. Check skip patterns
    for (const pattern of skipPatterns) {
      if (domain.includes(pattern)) {
        shouldSkip = true;
        break;
      }
    }

    // 6. Skip government, education, military
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      shouldSkip = true;
    }

    // 7. Skip URL patterns
    const urlLower = url.toLowerCase();
    for (const urlPattern of skipUrlPatterns) {
      if (urlLower.includes(urlPattern)) {
        shouldSkip = true;
        break;
      }
    }

    if (shouldSkip) continue;

    // ========== COMPANY NAME VALIDATION ==========
    // Extract and validate company name
    let rawName = (result.title || '').split(/[|\-–—:•·]/)[0].trim();

    // Try to get cleaner name from URL if title is bad
    if (rawName.length < 3 || rawName.length > 60 || /^\d+$/.test(rawName)) {
      rawName = domain.replace(/\.(com|io|co|net|org|ai|app)$/i, '').replace(/[-_]/g, ' ');
      rawName = rawName.split('.').pop() || rawName;
    }

    const nameValidation = validateCompanyName(rawName);

    // Skip if name is invalid and we can't fix it
    if (!nameValidation.valid && !nameValidation.cleanName) {
      // Try one more time with domain-based name
      const domainName = domain.replace(/\.(com|io|co|net|org|ai|app)$/i, '').replace(/[-_]/g, ' ');
      const domainNameValidation = validateCompanyName(domainName);
      if (!domainNameValidation.valid) continue;
      rawName = domainNameValidation.cleanName || domainName;
    } else {
      rawName = nameValidation.cleanName || rawName;
    }

    // Final name cleanup
    let name = rawName
      .replace(/\s+(Inc|LLC|Ltd|Corp|Co|Company|Services|Solutions|Group|Technologies|Tech)\.?$/i, '')
      .trim();

    // Capitalize first letter of each word
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Final validation - skip if still too short/long
    if (name.length < 2 || name.length > 50) continue;

    seenDomains.add(domain);

    // ========== ATTRIBUTE INFERENCE ==========
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const inferredIndustry = filters.customIndustry?.trim() || filters.industries?.[0] || inferIndustryAdvanced(text);
    const inferredLocation = filters.countries?.[0] || filters.states?.[0] || inferLocation(text);

    companies.push({
      name,
      domain,
      industry: inferredIndustry,
      location: inferredLocation,
      employees: filters.employeeRanges?.[0] || inferSize(text),
      revenue: filters.revenueRanges?.[0] || '$1M - $10M',
      companyType: filters.companyTypes?.[0] || 'Private Company',
      businessModel: filters.businessModels?.[0] || inferBusinessModel(text),
      source: 'serper_discovery',
      snippet: (result.snippet || '').substring(0, 250),
      sourceUrl: url,
      domainQualityScore: domainQuality.score
    });
  }

  // Sort by domain quality score (higher is better)
  companies.sort((a, b) => (b.domainQualityScore || 0) - (a.domainQualityScore || 0));

  return companies;
}

// ==================== INFERENCE HELPERS ====================
function inferIndustryAdvanced(text) {
  const industryKeywords = {
    // Technology
    'SaaS': ['saas', 'software as a service', 'cloud platform', 'subscription software'],
    'Software Development': ['software development', 'custom software', 'app development'],
    'IT Services': ['it services', 'managed services', 'it consulting', 'it support'],
    'Cybersecurity': ['cybersecurity', 'security software', 'data protection', 'infosec'],
    'AI/ML': ['artificial intelligence', 'machine learning', 'ai platform', 'deep learning'],
    // Finance
    'FinTech': ['fintech', 'financial technology', 'payments', 'banking software'],
    'Accounting': ['accounting', 'cpa', 'bookkeeping', 'tax services', 'accountant'],
    // Healthcare
    'Healthcare': ['healthcare', 'medical', 'health services', 'patient care'],
    'Biotech': ['biotech', 'biotechnology', 'life sciences', 'pharmaceutical'],
    'Dental': ['dental', 'dentist', 'orthodont', 'oral health'],
    'Veterinary': ['veterinary', 'vet', 'animal hospital', 'pet clinic'],
    // Commerce
    'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'online retail'],
    // Services
    'Marketing Agency': ['marketing agency', 'digital marketing', 'advertising agency', 'seo'],
    'Legal': ['law firm', 'legal services', 'attorney', 'lawyer'],
    'Real Estate': ['real estate', 'property', 'realty', 'brokerage'],
    'Consulting': ['consulting', 'consultancy', 'advisory', 'strategy'],
    // Industrial
    'Construction': ['construction', 'contractor', 'building', 'roofing'],
    'Manufacturing': ['manufacturing', 'industrial', 'production', 'factory'],
    'Logistics': ['logistics', 'freight', 'shipping', 'supply chain'],
    // Trades & Home Services
    'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac repair'],
    'Plumbing': ['plumbing', 'plumber', 'drain', 'pipe', 'water heater'],
    'Electrical': ['electrical', 'electrician', 'wiring', 'electrical contractor'],
    'Roofing': ['roofing', 'roof repair', 'roofer', 'shingle'],
    'Landscaping': ['landscaping', 'lawn care', 'landscape', 'grounds'],
    'Painting': ['painting', 'painter', 'house painting'],
    'Pest Control': ['pest control', 'exterminator', 'termite', 'pest management'],
    'Cleaning Services': ['cleaning', 'janitorial', 'maid service', 'house cleaning'],
    'Moving Services': ['moving', 'movers', 'relocation'],
    'Auto Services': ['auto repair', 'mechanic', 'car dealership', 'auto body', 'tire'],
    // Fitness & Wellness
    'Fitness': ['gym', 'fitness', 'personal trainer', 'workout'],
    'Spa & Wellness': ['spa', 'massage', 'wellness', 'salon'],
    // Food & Beverage
    'Restaurant': ['restaurant', 'dining', 'eatery', 'food service'],
    'Catering': ['catering', 'event catering', 'food catering'],
    // Education
    'EdTech': ['edtech', 'education technology', 'online learning', 'e-learning'],
    'Childcare': ['daycare', 'childcare', 'preschool', 'early learning']
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return industry;
    }
  }

  return 'Professional Services';
}

function inferLocation(text) {
  const locationKeywords = {
    'California': ['california', 'san francisco', 'los angeles', 'san diego', 'bay area'],
    'New York': ['new york', 'nyc', 'manhattan', 'brooklyn'],
    'Texas': ['texas', 'austin', 'dallas', 'houston'],
    'Florida': ['florida', 'miami', 'tampa', 'orlando'],
    'United Kingdom': ['uk', 'united kingdom', 'london', 'manchester'],
    'Canada': ['canada', 'toronto', 'vancouver', 'montreal'],
    'Germany': ['germany', 'berlin', 'munich'],
    'Australia': ['australia', 'sydney', 'melbourne']
  };

  for (const [location, keywords] of Object.entries(locationKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return location;
    }
  }

  return 'United States';
}

function inferSize(text) {
  if (text.includes('enterprise') || text.includes('fortune 500')) return '1001-5000 (Enterprise)';
  if (text.includes('startup') || text.includes('founded 202')) return '1-10 (Startup)';
  if (text.includes('growing') || text.includes('scale')) return '51-200 (Mid-Market)';
  if (text.includes('small business')) return '11-50 (Small)';
  return '11-50 (Small)';
}

function inferBusinessModel(text) {
  if (text.includes('saas') || text.includes('subscription')) return 'SaaS';
  if (text.includes('b2b')) return 'B2B';
  if (text.includes('b2c') || text.includes('consumer')) return 'B2C';
  if (text.includes('marketplace')) return 'Marketplace';
  if (text.includes('dtc') || text.includes('direct to consumer')) return 'D2C';
  return 'B2B';
}
