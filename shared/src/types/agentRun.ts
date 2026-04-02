export type AgentRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export interface AgentRun {
  readonly id: string;
  readonly groupId: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: AgentRunStatus;
  readonly grantsFoundCount: number;
  readonly grantsNewCount: number;
  readonly errorMessage: string | null;
  readonly nextRunAt: string | null;
  readonly createdAt: string;
}
