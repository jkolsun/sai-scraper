// Vercel Serverless Function - Indeed Hiring Signal Scanner
// Robust multi-signal detection with job scoring (not keyword matching)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SERPER_KEY = 'cad6eefce44b2e9d112983ff0796cab6ae988d8b';

  try {
    const { domain, companyName, location } = req.body;

    if (!domain && !companyName) {
      return res.status(400).json({ error: 'domain or companyName required' });
    }

    // Clean and normalize company name
    let company = companyName || domain.replace(/\.(com|io|co|net|org|biz|us|info)$/i, '').replace(/[-_]/g, ' ');
    // Remove any special characters that might break the search
    company = company.replace(/[^\w\s&-]/g, '').trim();

    // Extract state from location if available (e.g., "Lexington, South Carolina" -> "SC")
    let stateAbbrev = '';
    if (location) {
      const stateMatch = location.match(/,\s*([A-Za-z\s]+)(?:,|$)/);
      if (stateMatch) {
        const stateName = stateMatch[1].trim();
        // Map common state names to abbreviations
        const stateMap = {
          'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
          'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
          'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
          'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
          'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
          'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
          'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
          'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
          'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
          'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
        };
        stateAbbrev = stateMap[stateName.toLowerCase()] || stateName.substring(0, 2).toUpperCase();
      }
    }

    console.log('Indeed scan - Company:', company, 'Location:', location, 'State:', stateAbbrev);

    // ==================== TEXT NORMALIZATION ====================
    function normalizeText(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        // Remove emojis
        .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        // Remove salary ranges
        .replace(/\$[\d,]+(\s*[-–]\s*\$?[\d,]+)?(\s*(per|\/)\s*(hour|hr|year|yr|annually|month|mo))?/gi, '')
        // Remove hiring urgency fluff
        .replace(/hiring\s*(immediately|now|urgently|asap)/gi, '')
        .replace(/immediate\s*(start|opening|hire)/gi, '')
        // Remove location tags in parentheses
        .replace(/\([^)]*\)/g, '')
        // Remove fluff words
        .replace(/\b(rockstar|hero|ninja|guru|wizard|superstar|champion)\b/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
    }

    // ==================== JOB FAMILY CLASSIFICATION ====================
    // Classify by MEANING, not exact keywords

    // Family A: PHONE / FRONT DESK (Tier-1) - Core function involves calls/scheduling/dispatch
    const familyA_patterns = [
      /\b(dispatcher|dispatch(?:ing)?)\b/,
      /\b(customer\s*service|csr)\b/,
      /\b(service\s*coordinator)\b/,
      /\b(scheduling\s*coordinator)\b/,
      /\b(call\s*center)\b/,
      /\b(front\s*desk)\b/,
      /\b(inbound\s*calls?)\b/,
      /\b(client\s*services?)\b/,
      /\b(appointment\s*coordinator)\b/,
      /\b(phone\s*operator)\b/,
      /\b(receptionist)\b/,
      /\b(intake\s*specialist)\b/,
      /\b(customer\s*care)\b/,
      /\b(service\s*dispatcher)\b/,
      /\banswer(?:ing)?\s*phones?\b/,
      /\bphones?\s*(?:and|&)\s*schedul/,
    ];

    // Family B: OFFICE / ADMIN (Tier-2) - May involve phones but ambiguous
    const familyB_patterns = [
      /\b(office\s*administrator)\b/,
      /\b(office\s*manager)\b/,
      /\b(administrative\s*assistant|admin\s*assistant)\b/,
      /\b(office\s*assistant)\b/,
      /\b(office\s*coordinator)\b/,
      /\b(executive\s*assistant)\b/,
      /\b(office\s*support)\b/,
    ];

    // Family C: OPERATIONS / MANAGEMENT (Supporting)
    const familyC_patterns = [
      /\b(operations?\s*manager)\b/,
      /\b(general\s*manager)\b/,
      /\b(service\s*manager)\b/,
      /\b(branch\s*manager)\b/,
    ];

    // Family D: FIELD LABOR (Reject)
    const familyD_patterns = [
      /\b(hvac\s*technician|hvac\s*tech)\b/,
      /\b(service\s*tech(?:nician)?)\b/,
      /\b(installer)\b/,
      /\b(apprentice)\b/,
      /\b(helper)\b/,
      /\b(plumber|electrician)\b/,
      /\b(maintenance\s*tech)\b/,
      /\b(field\s*service)\b/,
      /\b(lead\s*installer)\b/,
      /\b(journeyman)\b/,
    ];

    // Family E: SALES / MARKETING (Reject)
    const familyE_patterns = [
      /\b(sales\s*rep(?:resentative)?)\b/,
      /\b(comfort\s*advisor)\b/,
      /\b(marketing\s*manager)\b/,
      /\b(seo|social\s*media)\b/,
      /\b(account\s*executive)\b/,
      /\b(business\s*development)\b/,
    ];

    // Description scoring patterns (+2 for phone/dispatch mentions in description)
    const descriptionBoostPatterns = [
      /answer(?:ing)?\s*(?:the\s*)?phones?/,
      /inbound\s*calls?/,
      /schedul(?:e|ing)\s*(?:service|appointments?|technicians?)/,
      /dispatch(?:ing)?\s*(?:technicians?|service|calls?)/,
      /high\s*call\s*volume/,
      /busy\s*phones?/,
      /multi[\s-]?line\s*phone/,
    ];

    // Context scoring patterns (+1 for urgency/pace indicators)
    const contextBoostPatterns = [
      /fast[\s-]?paced/,
      /high[\s-]?volume/,
      /busy\s*(?:office|environment)/,
      /urgent/,
      /immediate(?:ly)?/,
      /growing\s*(?:company|team)/,
    ];

    function classifyJob(title, snippet) {
      const normalizedTitle = normalizeText(title);
      const normalizedSnippet = normalizeText(snippet);
      const fullText = `${normalizedTitle} ${normalizedSnippet}`;

      let score = 0;
      let family = 'unknown';
      let reasons = [];

      // Check Family D (Field Labor) - Reject
      if (familyD_patterns.some(p => p.test(fullText))) {
        return { family: 'field_labor', score: 0, signal: 'reject', reasons: ['Field/technical role'] };
      }

      // Check Family E (Sales/Marketing) - Reject
      if (familyE_patterns.some(p => p.test(fullText))) {
        return { family: 'sales_marketing', score: 0, signal: 'reject', reasons: ['Sales/marketing role'] };
      }

      // Check Family A (Phone/Front Desk) - Tier 1, +3 base
      if (familyA_patterns.some(p => p.test(fullText))) {
        family = 'phone_frontdesk';
        score += 3;
        reasons.push('Phone/front desk role');
      }
      // Check Family B (Office/Admin) - Tier 2, +1 base
      else if (familyB_patterns.some(p => p.test(fullText))) {
        family = 'office_admin';
        score += 1;
        reasons.push('Office/admin role');
      }
      // Check Family C (Operations) - Supporting, +1 base
      else if (familyC_patterns.some(p => p.test(fullText))) {
        family = 'operations';
        score += 1;
        reasons.push('Operations/management role');
      }

      // Description boost: +2 if mentions phone/dispatch duties
      if (descriptionBoostPatterns.some(p => p.test(fullText))) {
        score += 2;
        reasons.push('Description mentions phone/dispatch duties');
      }

      // Context boost: +1 for urgency/pace indicators
      if (contextBoostPatterns.some(p => p.test(fullText))) {
        score += 1;
        reasons.push('High-pace/urgent environment');
      }

      // Determine signal strength
      let signal = 'none';
      if (score >= 4) {
        signal = 'strong';
      } else if (score >= 2) {
        signal = 'weak';
      }

      return { family, score, signal, reasons };
    }

    // ==================== SEARCH: JOB LISTINGS ====================
    // Search for company job postings
    // Note: Serper blocks quotes and site: from Vercel IPs, so use simple query
    // Include state abbreviation if available for more targeted results
    const jobSearchQuery = stateAbbrev
      ? company + ' ' + stateAbbrev + ' jobs indeed'
      : company + ' jobs indeed';

    console.log('Indeed scan - Job search query:', jobSearchQuery);

    const jobSearchPromise = fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: jobSearchQuery,
        gl: 'us',
        hl: 'en',
        num: 30
      }),
    });

    // ==================== SEARCH: COMPANY INFO ====================
    const companySearchQuery = domain
      ? `site:${domain}`
      : `"${company}" company`;

    const companySearchPromise = fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: companySearchQuery,
        gl: 'us',
        hl: 'en',
        num: 10
      }),
    });

    // Run searches in parallel
    const [jobResponse, companyResponse] = await Promise.all([
      jobSearchPromise,
      companySearchPromise
    ]);

    // ==================== PROCESS JOB LISTINGS ====================
    let allJobs = [];
    let strongSignalJobs = [];
    let weakSignalJobs = [];
    let rejectedJobs = [];
    let totalJobScore = 0;

    let rawOrganic = [];
    let jobResponseStatus = jobResponse.status;
    let jobResponseError = '';

    if (jobResponse.ok) {
      const jobData = await jobResponse.json();
      rawOrganic = jobData.organic || [];

      console.log('Indeed scan - Raw results count:', rawOrganic.length);
      console.log('Indeed scan - First 3 titles:', rawOrganic.slice(0, 3).map(r => r.title));
    } else {
      jobResponseError = await jobResponse.text();
      console.log('Indeed scan - Job response error:', jobResponseStatus, jobResponseError);
    }

    if (rawOrganic.length > 0) {
      // Filter for ACTUAL job listings only
      // Must be: /viewjob, /rc/, or contain jk= (job key parameter)
      // Exclude: /cmp/ (company profiles), /salaries, /reviews, /faq
      const indeedResults = rawOrganic.filter(r => {
        if (!r.link) return false;
        const url = r.link.toLowerCase();
        if (!url.includes('indeed.com')) return false;

        // Must be an actual job listing URL
        const isJobUrl = url.includes('/viewjob') || url.includes('/rc/') || url.includes('jk=');
        if (!isJobUrl) return false;

        // Double-check: exclude any profile pages that might slip through
        if (url.includes('/cmp/')) return false;
        if (url.includes('/salaries')) return false;
        if (url.includes('/reviews')) return false;
        if (url.includes('/faq')) return false;

        return true;
      });

      console.log('Indeed scan - Filtered results count:', indeedResults.length);

      // Count phone/front desk roles for multi-role bonus
      let phoneRoleCount = 0;

      for (const result of indeedResults) {
        const title = result.title || '';
        const snippet = result.snippet || '';
        const url = result.link || '';

        // Extract clean job title
        // Indeed titles often formatted as: "Company Name - Job Title | Indeed.com"
        // or "Job Title - Company Name | Indeed.com"
        // We need to identify which part is the actual job role
        let jobTitle = title;

        // First, remove " | Indeed.com" or similar suffixes
        jobTitle = jobTitle.replace(/\s*\|\s*Indeed\.com.*$/i, '').trim();

        // Split by dash/hyphen to get parts
        const parts = jobTitle.split(/\s*[-–—]\s*/).map(p => p.trim()).filter(p => p);

        // Job role keywords to identify which part is the job title
        const jobRoleKeywords = /\b(receptionist|dispatcher|coordinator|assistant|manager|representative|csr|customer\s*service|front\s*desk|office|admin|call\s*center|scheduler|intake|operator|technician|tech|installer|plumber|electrician|helper|apprentice|sales|marketing)\b/i;

        // Find the part that contains job role keywords
        let bestPart = parts[0]; // default to first part
        for (const part of parts) {
          if (jobRoleKeywords.test(part)) {
            bestPart = part;
            break;
          }
        }

        jobTitle = bestPart;

        // Remove "at Company" or "in Location" suffixes
        jobTitle = jobTitle.replace(/\s+at\s+.*$/i, '').replace(/\s+in\s+.*$/i, '').trim();

        // Fix capitalization: convert ALL CAPS to Title Case
        if (jobTitle === jobTitle.toUpperCase() && jobTitle.length > 2) {
          jobTitle = jobTitle.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }

        // Fix spacing issues (multiple spaces, no space after slash)
        jobTitle = jobTitle.replace(/\s+/g, ' ').replace(/\/\s*/g, ' / ').trim();

        const classification = classifyJob(jobTitle, snippet);

        const job = {
          title: jobTitle,
          url: url,
          snippet: snippet.substring(0, 200),
          family: classification.family,
          score: classification.score,
          signal: classification.signal,
          reasons: classification.reasons
        };

        if (classification.signal === 'reject') {
          rejectedJobs.push(job);
          continue;
        }

        allJobs.push(job);
        totalJobScore += classification.score;

        if (classification.family === 'phone_frontdesk') {
          phoneRoleCount++;
        }

        if (classification.signal === 'strong') {
          strongSignalJobs.push(job);
        } else if (classification.signal === 'weak') {
          weakSignalJobs.push(job);
        }
      }

      // Multi-role bonus: +1 to each job if multiple phone roles open
      if (phoneRoleCount >= 2) {
        for (const job of allJobs) {
          if (job.family === 'phone_frontdesk' || job.family === 'office_admin') {
            job.score += 1;
            job.reasons.push('Multiple phone/office roles open');
            // Re-evaluate signal strength
            if (job.score >= 4 && job.signal !== 'strong') {
              job.signal = 'strong';
              // Move from weak to strong if needed
              const weakIdx = weakSignalJobs.findIndex(j => j.url === job.url);
              if (weakIdx !== -1) {
                weakSignalJobs.splice(weakIdx, 1);
                strongSignalJobs.push(job);
              }
            }
          }
        }
      }
    }

    // ==================== PROCESS COMPANY SIGNALS ====================
    let employeeSignal = false;
    let employeeCount = null;
    let afterHoursSignal = false;
    let afterHoursIndicators = [];
    let multiLocationSignal = false;

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      const organic = companyData.organic || [];
      const knowledgeGraph = companyData.knowledgeGraph || {};

      let allText = organic.map(r => `${r.title || ''} ${r.snippet || ''}`).join(' ');
      allText += ` ${knowledgeGraph.description || ''}`;
      const normalizedCompanyText = normalizeText(allText);

      // Employee count detection
      const employeePatterns = [
        /(\d+)\+?\s*employees?/i,
        /team\s*of\s*(\d+)/i,
        /(\d+)\s*team\s*members?/i,
        /staff\s*of\s*(\d+)/i,
        /(\d+)\s*professionals?/i
      ];

      for (const pattern of employeePatterns) {
        const match = allText.match(pattern);
        if (match) {
          employeeCount = parseInt(match[1], 10);
          if (employeeCount >= 11) {
            employeeSignal = true;
          }
          break;
        }
      }

      if (knowledgeGraph.employees) {
        const kgEmployees = parseInt(knowledgeGraph.employees.replace(/[^\d]/g, ''), 10);
        if (!isNaN(kgEmployees)) {
          employeeCount = kgEmployees;
          employeeSignal = kgEmployees >= 11;
        }
      }

      // After-hours service detection
      const afterHoursPatterns = [
        { pattern: /24\s*\/?\s*7/i, indicator: '24/7 service' },
        { pattern: /emergency\s*(service|repair|call|response)/i, indicator: 'Emergency service' },
        { pattern: /after[\s-]*hours?/i, indicator: 'After-hours availability' },
        { pattern: /24\s*hour/i, indicator: '24-hour service' },
        { pattern: /available\s*(nights?|weekends?|evenings?)/i, indicator: 'Night/weekend availability' },
        { pattern: /open\s*(late|24|nights?)/i, indicator: 'Extended hours' },
        { pattern: /always\s*available/i, indicator: 'Always available' },
        { pattern: /around[\s-]the[\s-]clock/i, indicator: 'Around-the-clock' },
        { pattern: /same[\s-]day\s*(service|response)/i, indicator: 'Same-day service' }
      ];

      for (const { pattern, indicator } of afterHoursPatterns) {
        if (pattern.test(normalizedCompanyText)) {
          afterHoursSignal = true;
          afterHoursIndicators.push(indicator);
        }
      }

      // Multi-location detection
      const multiLocationPatterns = [
        /(\d+)\s*locations?/i,
        /serving\s*[\w\s,]+(?:and|&)\s*[\w\s]+/i,
        /multiple\s*(?:locations?|offices?|branches?)/i,
      ];

      for (const pattern of multiLocationPatterns) {
        if (pattern.test(normalizedCompanyText)) {
          multiLocationSignal = true;
          break;
        }
      }
    }

    // ==================== FINAL SIGNAL DETERMINATION ====================
    // Prioritize QUALITY over QUANTITY
    // Only 2 signal types qualify:
    // 1. Indeed Job Search - companies with job postings (dispatcher, receptionist, etc.)
    // 2. After Hours Service - companies offering 24/7, emergency, same-day service
    // Employee count is NO LONGER a qualifying signal

    const hasStrongJobSignal = strongSignalJobs.length > 0;
    const hasWeakJobSignal = weakSignalJobs.length > 0;
    const hasJobSignal = hasStrongJobSignal || hasWeakJobSignal;

    let finalSignal = 'none';
    let finalStrength = 'none';
    let signals = [];
    let signalReasons = [];

    // Strong job signal = STRONG
    if (hasStrongJobSignal) {
      finalSignal = 'found';
      finalStrength = 'strong';
      signals.push('strong_job_signal');
      signalReasons.push(`Strong job signal: ${strongSignalJobs.map(j => j.title).slice(0, 2).join(', ')}`);
    }
    // Weak job signal = WEAK
    else if (hasWeakJobSignal) {
      finalSignal = 'found';
      finalStrength = 'weak';
      signals.push('weak_job_signal');
      signalReasons.push(`Weak job signal: ${weakSignalJobs.map(j => j.title).slice(0, 2).join(', ')}`);
    }
    // No job signal but has after-hours service = WEAK (after-hours filter)
    else if (afterHoursSignal) {
      finalSignal = 'found';
      finalStrength = 'weak';
      signals.push('after_hours');
      signalReasons.push(`After-hours service: ${afterHoursIndicators.slice(0, 2).join(', ')}`);
    }

    // Add after_hours signal if present (even with job signals)
    if (afterHoursSignal && hasJobSignal) {
      signals.push('after_hours');
      signalReasons.push(`Also offers after-hours: ${afterHoursIndicators.slice(0, 2).join(', ')}`);
    }

    // If strong job + after-hours, note the stack
    if (hasStrongJobSignal && afterHoursSignal) {
      finalStrength = 'very_strong';
      signalReasons.push('Multiple signal types detected (high confidence)');
    }

    return res.status(200).json({
      signalFound: finalSignal === 'found',
      signalStrength: finalStrength,
      signals,
      signalReasons,
      domain,
      companyName: company,

      // Job breakdown with scores
      jobs: {
        total: allJobs.length,
        totalScore: totalJobScore,
        strong: strongSignalJobs,
        weak: weakSignalJobs,
        rejected: rejectedJobs.length,
        all: allJobs.slice(0, 15)
      },

      // Company signals
      companySignals: {
        employeeCount,
        employeeSignal,
        afterHoursSignal,
        afterHoursIndicators,
        multiLocationSignal
      },

      // Debug info
      debug: {
        jobSearchQuery,
        jobResponseStatus,
        jobResponseError,
        rawResultsCount: rawOrganic.length,
        rawFirstTitles: rawOrganic.slice(0, 3).map(r => r.title),
        strongCount: strongSignalJobs.length,
        weakCount: weakSignalJobs.length,
        rejectedCount: rejectedJobs.length,
        totalJobsFound: allJobs.length,
        avgJobScore: allJobs.length > 0 ? (totalJobScore / allJobs.length).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Indeed scan error:', error);
    return res.status(500).json({ error: error.message });
  }
}
