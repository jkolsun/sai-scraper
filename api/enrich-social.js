// Vercel Serverless Function - Social Media Enrichment
// Finds and enriches social profiles for a company

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
    const results = {
      instagram: null,
      tiktok: null,
      twitter: null,
      youtube: null,
      facebook: null,
      linkedin: null
    };

    // Use Serper to find social profiles
    const SERPER_KEY = process.env.SERPER_API_KEY;

    if (SERPER_KEY) {
      // Search for social profiles in parallel
      const socialSearches = [
        { platform: 'instagram', query: `site:instagram.com "${searchName}"` },
        { platform: 'tiktok', query: `site:tiktok.com "@" "${searchName}"` },
        { platform: 'twitter', query: `site:twitter.com OR site:x.com "${searchName}"` },
        { platform: 'youtube', query: `site:youtube.com/@ "${searchName}"` },
        { platform: 'facebook', query: `site:facebook.com "${searchName}"` },
        { platform: 'linkedin', query: `site:linkedin.com/company "${searchName}"` }
      ];

      const searchPromises = socialSearches.map(async ({ platform, query }) => {
        try {
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': SERPER_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: query, num: 5 }),
          });

          if (!response.ok) return { platform, data: null };

          const data = await response.json();
          const organic = data.organic || [];

          // Find the best matching result
          for (const result of organic) {
            const url = result.link || '';
            const title = (result.title || '').toLowerCase();
            const searchLower = searchName.toLowerCase();

            // Validate it's actually a profile/company page
            if (platform === 'instagram' && url.includes('instagram.com/')) {
              const handle = extractInstagramHandle(url);
              if (handle && !isGenericPage(handle)) {
                return {
                  platform,
                  data: {
                    url,
                    handle: `@${handle}`,
                    title: result.title,
                    snippet: result.snippet
                  }
                };
              }
            }

            if (platform === 'tiktok' && url.includes('tiktok.com/@')) {
              const handle = extractTikTokHandle(url);
              if (handle) {
                return {
                  platform,
                  data: {
                    url,
                    handle: `@${handle}`,
                    title: result.title,
                    snippet: result.snippet
                  }
                };
              }
            }

            if (platform === 'twitter' && (url.includes('twitter.com/') || url.includes('x.com/'))) {
              const handle = extractTwitterHandle(url);
              if (handle && !isGenericTwitterPage(handle)) {
                return {
                  platform,
                  data: {
                    url: url.replace('x.com/', 'twitter.com/'),
                    handle: `@${handle}`,
                    title: result.title,
                    snippet: result.snippet
                  }
                };
              }
            }

            if (platform === 'youtube' && url.includes('youtube.com/')) {
              if (url.includes('/@') || url.includes('/channel/') || url.includes('/c/')) {
                return {
                  platform,
                  data: {
                    url,
                    handle: extractYouTubeChannel(url),
                    title: result.title,
                    snippet: result.snippet
                  }
                };
              }
            }

            if (platform === 'facebook' && url.includes('facebook.com/')) {
              const page = extractFacebookPage(url);
              if (page && !isGenericFacebookPage(page)) {
                return {
                  platform,
                  data: {
                    url,
                    handle: page,
                    title: result.title,
                    snippet: result.snippet
                  }
                };
              }
            }

            if (platform === 'linkedin' && url.includes('linkedin.com/company/')) {
              return {
                platform,
                data: {
                  url,
                  handle: extractLinkedInCompany(url),
                  title: result.title,
                  snippet: result.snippet
                }
              };
            }
          }

          return { platform, data: null };
        } catch (err) {
          console.error(`Error searching ${platform}:`, err);
          return { platform, data: null };
        }
      });

      const searchResults = await Promise.all(searchPromises);

      for (const { platform, data } of searchResults) {
        results[platform] = data;
      }
    }

    // Calculate social presence score
    const platforms = Object.values(results).filter(Boolean);
    const socialScore = Math.min(100, platforms.length * 20);

    // Generate signals based on social presence
    const signals = [];
    if (results.instagram) signals.push('Active on Instagram - visual brand presence');
    if (results.tiktok) signals.push('TikTok presence - targets younger demographics');
    if (results.twitter) signals.push('Twitter/X active - engaged in conversations');
    if (results.youtube) signals.push('YouTube channel - invests in video content');
    if (results.linkedin) signals.push('LinkedIn company page - B2B focused');
    if (platforms.length >= 4) signals.push('Strong omnichannel presence');
    if (platforms.length === 0) signals.push('Limited social presence - opportunity for outreach');

    return res.status(200).json({
      found: platforms.length > 0,
      domain,
      companyName: searchName,
      data: {
        profiles: results,
        platformCount: platforms.length,
        socialScore,
        signals
      }
    });

  } catch (error) {
    console.error('Social enrichment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper functions
function extractInstagramHandle(url) {
  const match = url.match(/instagram\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractTikTokHandle(url) {
  const match = url.match(/tiktok\.com\/@([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractTwitterHandle(url) {
  const match = url.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractYouTubeChannel(url) {
  const match = url.match(/youtube\.com\/(?:@|channel\/|c\/)([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractFacebookPage(url) {
  const match = url.match(/facebook\.com\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractLinkedInCompany(url) {
  const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function isGenericPage(handle) {
  const generic = ['explore', 'reels', 'stories', 'p', 'tv', 'about', 'help', 'privacy', 'terms'];
  return generic.includes(handle.toLowerCase());
}

function isGenericTwitterPage(handle) {
  const generic = ['search', 'explore', 'home', 'i', 'settings', 'help', 'privacy', 'tos'];
  return generic.includes(handle.toLowerCase());
}

function isGenericFacebookPage(page) {
  const generic = ['pages', 'groups', 'events', 'marketplace', 'watch', 'gaming', 'help', 'privacy', 'policies'];
  return generic.includes(page.toLowerCase());
}
