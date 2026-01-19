// Vercel Serverless Function - Indeed Hiring Signal Scanner
// Multi-signal detection: Job listings + Employee count + After-hours exposure

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

    // ==================== ROLE CLASSIFICATION TIERS ====================
    // Tier-1: High-value ops/phone roles (KEEP - strong signal)
    const tier1Patterns = [
      /\b(dispatcher|dispatch)\b/i,
      /\b(receptionist)\b/i,
      /\b(service\s*coordinator)\b/i,
      /\b(customer\s*service|csr)\b/i,
      /\b(call\s*center)\b/i,
      /\b(office\s*administrator)\b/i,
      /\b(front\s*desk)\b/i,
      /\b(client\s*services?)\b/i,
      /\b(operations?\s*coordinator)\b/i,
      /\b(phone\s*operator)\b/i,
      /\b(intake\s*specialist)\b/i,
      /\b(scheduling\s*coordinator)\b/i,
      /\b(office\s*manager)\b/i,
      // Creative titles HVAC companies use
      /\b(office\s*rockstar)\b/i,
      /\b(front\s*desk\s*hero)\b/i,
      /\b(customer\s*care)\b/i,
      /\b(service\s*dispatcher)\b/i
    ];

    // Tier-2: Keep only if no Tier-1 found (weaker signal)
    const tier2Patterns = [
      /\b(office\s*assistant)\b/i,
      /\b(administrative\s*assistant|admin\s*assistant)\b/i,
      /\b(scheduling)\b/i,
      /\b(coordinator)\b/i,
      /\b(office\s*support)\b/i
    ];

    // Auto-reject: Field/technical roles (not ops-related)
    const rejectPatterns = [
      /\b(hvac\s*technician|tech)\b/i,
      /\b(installer)\b/i,
      /\b(apprentice)\b/i,
      /\b(sales\s*rep|salesperson)\b/i,
      /\b(marketing)\b/i,
      /\b(plumber|electrician)\b/i,
      /\b(helper)\b/i,
      /\b(lead\s*installer)\b/i,
      /\b(service\s*tech)\b/i,
      /\b(maintenance)\b/i,
      /\b(driver)\b/i
    ];

    // ==================== SIGNAL 1: JOB LISTINGS ====================
    // Search Indeed for ALL jobs at this company (not by role)
    const jobSearchQuery = `site:indeed.com "${company}"`;

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

    // ==================== SIGNAL 2 & 3: COMPANY INFO ====================
    // Search for company website to detect employee count and after-hours
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
    let tier1Jobs = [];
    let tier2Jobs = [];
    let rejectedJobs = [];

    if (jobResponse.ok) {
      const jobData = await jobResponse.json();
      const organic = jobData.organic || [];

      // Filter for Indeed results
      const indeedResults = organic.filter(r =>
        r.link && r.link.toLowerCase().includes('indeed.com')
      );

      for (const result of indeedResults) {
        const title = result.title || '';
        const snippet = result.snippet || '';
        const url = result.link || '';
        const fullText = `${title} ${snippet}`;

        // Extract job title
        let jobTitle = title.split(/[|\-–—]/)[0].trim();
        jobTitle = jobTitle.replace(/\s+at\s+.*$/i, '').replace(/\s+in\s+.*$/i, '').trim();

        const job = {
          title: jobTitle,
          url: url,
          snippet: snippet.substring(0, 200),
          tier: null
        };

        // Check if it's a rejected role first
        const isRejected = rejectPatterns.some(p => p.test(fullText));
        if (isRejected) {
          job.tier = 'rejected';
          rejectedJobs.push(job);
          continue;
        }

        // Check Tier-1
        const isTier1 = tier1Patterns.some(p => p.test(fullText));
        if (isTier1) {
          job.tier = 'tier1';
          tier1Jobs.push(job);
          allJobs.push(job);
          continue;
        }

        // Check Tier-2
        const isTier2 = tier2Patterns.some(p => p.test(fullText));
        if (isTier2) {
          job.tier = 'tier2';
          tier2Jobs.push(job);
          allJobs.push(job);
          continue;
        }

        // Uncategorized job (still keep for "recent hiring" signal)
        job.tier = 'other';
        allJobs.push(job);
      }
    }

    // ==================== PROCESS COMPANY SIGNALS ====================
    let employeeSignal = false;
    let employeeCount = null;
    let afterHoursSignal = false;
    let afterHoursIndicators = [];

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      const organic = companyData.organic || [];
      const knowledgeGraph = companyData.knowledgeGraph || {};

      // Combine all text for analysis
      let allText = organic.map(r => `${r.title || ''} ${r.snippet || ''}`).join(' ');
      allText += ` ${knowledgeGraph.description || ''}`;

      // SIGNAL 2: Employee count detection
      // Look for employee count patterns
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
          if (employeeCount >= 6) {
            employeeSignal = true;
          }
          break;
        }
      }

      // Check LinkedIn/knowledge graph for employee count
      if (knowledgeGraph.employees) {
        const kgEmployees = parseInt(knowledgeGraph.employees.replace(/[^\d]/g, ''), 10);
        if (!isNaN(kgEmployees)) {
          employeeCount = kgEmployees;
          employeeSignal = kgEmployees >= 6;
        }
      }

      // SIGNAL 3: After-hours service exposure
      const afterHoursPatterns = [
        { pattern: /24\s*\/?\s*7/i, indicator: '24/7 service' },
        { pattern: /emergency\s*(service|repair|call)/i, indicator: 'Emergency service' },
        { pattern: /after[\s-]*hours?/i, indicator: 'After-hours availability' },
        { pattern: /24\s*hour/i, indicator: '24-hour service' },
        { pattern: /available\s*(nights?|weekends?|evenings?)/i, indicator: 'Night/weekend availability' },
        { pattern: /open\s*(late|24|nights?)/i, indicator: 'Extended hours' },
        { pattern: /always\s*available/i, indicator: 'Always available' },
        { pattern: /around[\s-]the[\s-]clock/i, indicator: 'Around-the-clock' },
        { pattern: /never\s*closed/i, indicator: 'Never closed' },
        { pattern: /same[\s-]day\s*(service|response)/i, indicator: 'Same-day service' }
      ];

      for (const { pattern, indicator } of afterHoursPatterns) {
        if (pattern.test(allText)) {
          afterHoursSignal = true;
          afterHoursIndicators.push(indicator);
        }
      }
    }

    // ==================== SIGNAL STACKING ====================
    // Company qualifies if ANY ONE of these is true:
    // 1. Has Tier-1 job listing
    // 2. Employee count >= 11 (likely phone delegation)
    // 3. After-hours service language

    const hasJobSignal = tier1Jobs.length > 0;
    const hasStrongEmployeeSignal = employeeCount !== null && employeeCount >= 11;
    const hasWeakEmployeeSignal = employeeCount !== null && employeeCount >= 6;
    const hasAfterHoursSignal = afterHoursSignal;
    const hasRecentHiring = allJobs.length >= 3; // Any 3+ jobs = hiring activity

    // Determine if signal found (ANY ONE qualifies)
    const signalFound = hasJobSignal || hasStrongEmployeeSignal || hasAfterHoursSignal || (hasRecentHiring && tier2Jobs.length > 0);

    // Build signal breakdown
    const signals = [];
    const signalReasons = [];

    if (hasJobSignal) {
      signals.push('tier1_job');
      signalReasons.push(`Hiring ${tier1Jobs.map(j => j.title).slice(0, 2).join(', ')}`);
    }

    if (hasStrongEmployeeSignal) {
      signals.push('employee_count');
      signalReasons.push(`${employeeCount}+ employees (likely phone delegation)`);
    } else if (hasWeakEmployeeSignal && !hasJobSignal) {
      signals.push('employee_threshold');
      signalReasons.push(`${employeeCount} employees (possible phone complexity)`);
    }

    if (hasAfterHoursSignal) {
      signals.push('after_hours');
      signalReasons.push(`After-hours exposure: ${afterHoursIndicators.slice(0, 2).join(', ')}`);
    }

    if (hasRecentHiring && tier2Jobs.length > 0 && !hasJobSignal) {
      signals.push('tier2_job');
      signalReasons.push(`Active hiring with admin roles`);
    }

    if (hasRecentHiring && signals.length === 0) {
      signals.push('recent_hiring');
      signalReasons.push(`${allJobs.length} active job postings`);
    }

    // Determine signal strength
    let signalStrength = 'none';
    if (hasJobSignal) {
      signalStrength = 'strong';
    } else if (hasStrongEmployeeSignal || hasAfterHoursSignal) {
      signalStrength = 'medium';
    } else if (hasWeakEmployeeSignal || hasRecentHiring) {
      signalStrength = 'weak';
    }

    return res.status(200).json({
      signalFound,
      signalStrength,
      signals,
      signalReasons,
      domain,
      companyName: company,

      // Job breakdown
      jobs: {
        total: allJobs.length,
        tier1: tier1Jobs,
        tier2: tier2Jobs,
        rejected: rejectedJobs.length,
        all: allJobs.slice(0, 10)
      },

      // Company signals
      companySignals: {
        employeeCount,
        employeeSignal,
        afterHoursSignal,
        afterHoursIndicators
      },

      // Debug info
      debug: {
        tier1Count: tier1Jobs.length,
        tier2Count: tier2Jobs.length,
        rejectedCount: rejectedJobs.length,
        totalJobsFound: allJobs.length
      }
    });

  } catch (error) {
    console.error('Indeed scan error:', error);
    return res.status(500).json({ error: error.message });
  }
}
