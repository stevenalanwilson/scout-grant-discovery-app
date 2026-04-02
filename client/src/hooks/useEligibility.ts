import { useState, useEffect } from 'react';
import type { EligibilityResult, SupplementaryQuestion } from '@scout-grants/shared';
import { eligibilityApi } from '../services/eligibilityApi';

type EligibilityState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'result'; result: EligibilityResult }
  | { phase: 'questions'; questions: SupplementaryQuestion[] }
  | { phase: 'error'; message: string };

interface UseEligibilityResult {
  state: EligibilityState;
  checkEligibility: (answers?: Record<string, string>) => Promise<void>;
}

export function useEligibility(grantId: string): UseEligibilityResult {
  const [state, setState] = useState<EligibilityState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    eligibilityApi
      .get(grantId)
      .then((result) => {
        if (cancelled) return;
        setState(result ? { phase: 'result', result } : { phase: 'idle' });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'idle' });
      });

    return () => {
      cancelled = true;
    };
  }, [grantId]);

  async function checkEligibility(answers?: Record<string, string>): Promise<void> {
    setState({ phase: 'loading' });
    try {
      const response = await eligibilityApi.assess(grantId, answers);
      if (response.eligibilityResult) {
        setState({ phase: 'result', result: response.eligibilityResult });
      } else if (response.supplementaryQuestions.length > 0) {
        setState({ phase: 'questions', questions: response.supplementaryQuestions });
      } else {
        setState({ phase: 'error', message: 'Unexpected response from eligibility check.' });
      }
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Eligibility check failed.',
      });
    }
  }

  return { state, checkEligibility };
}
