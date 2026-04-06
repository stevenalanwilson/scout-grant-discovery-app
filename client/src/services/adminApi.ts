import type {
  ScrapeHistoryResponse,
  SourcesResponse,
  RecentEligibilityResponse,
  EligibilityStatsResponse,
} from '@scout-grants/shared';
import { api } from './api';

export const adminApi = {
  getScrapeHistory(): Promise<ScrapeHistoryResponse> {
    return api.get<ScrapeHistoryResponse>('/admin/scraping/history');
  },

  getScrapeSourceStatus(): Promise<SourcesResponse> {
    return api.get<SourcesResponse>('/admin/scraping/sources');
  },

  getRecentEligibility(): Promise<RecentEligibilityResponse> {
    return api.get<RecentEligibilityResponse>('/admin/eligibility/recent');
  },

  getEligibilityStats(): Promise<EligibilityStatsResponse> {
    return api.get<EligibilityStatsResponse>('/admin/eligibility/stats');
  },
};
