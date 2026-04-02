import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_CONTENT_CHARS = 40_000;
const REQUEST_TIMEOUT_MS = 15_000;

export interface CrawlResult {
  readonly url: string;
  readonly text: string;
  readonly ok: boolean;
  readonly error?: string;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  try {
    const { data: html } = await axios.get<string>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'ScoutGrantFinder/1.0 (grant research tool for UK Scout groups)',
        Accept: 'text/html,application/xhtml+xml',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, footer, header, .cookie-banner, #cookie-banner').remove();

    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CONTENT_CHARS);

    return { url, text, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { url, text: '', ok: false, error: message };
  }
}
