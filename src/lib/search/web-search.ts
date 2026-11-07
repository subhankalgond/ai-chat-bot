import { SearchCitation } from '@/types';

export interface SearchResult {
  query: string;
  results: SearchCitation[];
  formattedContext: string;
}

export async function performWebSearch(query: string): Promise<SearchResult> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const serperApiKey = process.env.SERPER_API_KEY;

  try {
    // 1. Try Tavily if configured
    if (tavilyApiKey) {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query,
          search_depth: 'basic',
          include_answer: true,
          max_results: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const results: SearchCitation[] = (data.results || []).map((r: any, idx: number) => ({
          id: `src-${idx + 1}`,
          title: r.title || 'Web Result',
          url: r.url || '',
          snippet: r.content || r.snippet || '',
          source: new URL(r.url || 'https://google.com').hostname.replace('www.', ''),
        }));

        const formattedContext = results
          .map((r, i) => `[${i + 1}] "${r.title}" (${r.source})\nURL: ${r.url}\nSummary: ${r.snippet}\n`)
          .join('\n');

        return { query, results, formattedContext };
      }
    }

    // 2. Try Serper if configured
    if (serperApiKey) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        const results: SearchCitation[] = (data.organic || []).slice(0, 5).map((r: any, idx: number) => ({
          id: `src-${idx + 1}`,
          title: r.title || 'Web Result',
          url: r.link || '',
          snippet: r.snippet || '',
          source: new URL(r.link || 'https://google.com').hostname.replace('www.', ''),
        }));

        const formattedContext = results
          .map((r, i) => `[${i + 1}] "${r.title}" (${r.source})\nURL: ${r.url}\nSummary: ${r.snippet}\n`)
          .join('\n');

        return { query, results, formattedContext };
      }
    }

    // 3. Fallback to DuckDuckGo Instant Answer / HTML search for free real-time results
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(ddgUrl);
    if (response.ok) {
      const data = await response.json();
      const results: SearchCitation[] = [];

      if (data.AbstractText) {
        results.push({
          id: 'src-1',
          title: data.Heading || query,
          url: data.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(query),
          snippet: data.AbstractText,
          source: data.AbstractSource || 'DuckDuckGo',
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 4).forEach((topic: any, idx: number) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              id: `src-${results.length + 1}`,
              title: topic.Text.split(' - ')[0] || `Result ${idx + 1}`,
              url: topic.FirstURL,
              snippet: topic.Text,
              source: new URL(topic.FirstURL).hostname.replace('www.', ''),
            });
          }
        });
      }

      if (results.length > 0) {
        const formattedContext = results
          .map((r, i) => `[${i + 1}] "${r.title}" (${r.source})\nURL: ${r.url}\nSummary: ${r.snippet}\n`)
          .join('\n');

        return { query, results, formattedContext };
      }
    }

    // If no search API returned data, provide structured query marker
    return {
      query,
      results: [],
      formattedContext: `Web search for "${query}" completed. No external citations returned.`,
    };
  } catch (err: any) {
    console.error('Web search error:', err);
    return {
      query,
      results: [],
      formattedContext: `Web search temporarily unavailable: ${err.message}`,
    };
  }
}

