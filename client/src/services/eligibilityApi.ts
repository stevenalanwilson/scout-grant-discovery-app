import type { EligibilityResult } from '@scout-grants/shared';
import { api, ApiError } from './api';
import type { SupplementaryQuestion } from '@scout-grants/shared';

export interface AssessEligibilityResponse {
  eligibilityResult: EligibilityResult | null;
  supplementaryQuestions: SupplementaryQuestion[];
}

export const eligibilityApi = {
  async get(grantId: string): Promise<EligibilityResult | null> {
    try {
      return await api.get<EligibilityResult>(`/grants/${grantId}/eligibility`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  assess(
    grantId: string,
    supplementaryAnswers?: Record<string, string>,
  ): Promise<AssessEligibilityResponse> {
    return api.post<AssessEligibilityResponse>(`/grants/${grantId}/eligibility`, {
      supplementaryAnswers,
    });
  },
};
