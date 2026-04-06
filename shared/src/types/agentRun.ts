export type AgentRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export type AgentProgressPhase = 'searching' | 'validating';

export interface AgentProgress {
  readonly phase: AgentProgressPhase;
  /** Name of the source currently being fetched (searching phase only) */
  readonly currentSource: string | null;
  readonly sourcesSearched: number;
  readonly sourcesTotal: number;
  /** Running total of grants extracted across all sources so far */
  readonly grantsFound: number;
  /** Number of new grants queued for eligibility validation */
  readonly grantsTotal: number;
  readonly grantsValidated: number;
  readonly grantsVerified: number;
  readonly grantsRuledOut: number;
}

export interface ScrapeRunSummary {
  readonly id: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: AgentRunStatus;
  readonly grantsFoundCount: number;
  readonly grantsNewCount: number;
  readonly errorMessage: string | null;
  readonly progress: AgentProgress | null;
}

export interface ScrapeHistoryResponse {
  readonly runs: readonly ScrapeRunSummary[];
}

export type LastRunStatus = 'success' | 'failed' | 'skipped' | 'unknown';

export interface SourceStatus {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly scope: 'national' | 'local';
  readonly active: boolean;
  readonly lastRunStatus: LastRunStatus;
  readonly grantsExtracted: number | null;
}

export interface SourcesResponse {
  readonly sources: readonly SourceStatus[];
}

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
  readonly progress: AgentProgress | null;
  readonly createdAt: string;
}
