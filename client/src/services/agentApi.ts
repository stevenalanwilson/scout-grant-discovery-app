import type { AgentRun } from '@scout-grants/shared';
import { api } from './api';

export interface AgentStatus {
  lastRun: AgentRun | null;
  nextRunAt: string | null;
}

export const agentApi = {
  getStatus(): Promise<AgentStatus> {
    return api.get<AgentStatus>('/agent/status');
  },

  triggerRun(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/agent/run', {});
  },
};
