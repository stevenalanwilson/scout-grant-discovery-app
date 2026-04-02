export type SearchStrategy = 'crawl' | 'api' | 'rss';
export type SourceScope = 'national' | 'local';

export interface GrantSource {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly scope: SourceScope;
  readonly region?: string;
  readonly categories: readonly string[];
  readonly search_strategy: SearchStrategy;
  readonly active: boolean;
  readonly note?: string;
}

export interface GrantSourcesFile {
  readonly version: string;
  readonly last_updated: string;
  readonly sources: readonly GrantSource[];
}
