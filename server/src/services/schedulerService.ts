import cron from 'node-cron';
import { groupRepository } from '../repositories/groupRepository';
import { agentRunRepository } from '../repositories/agentRunRepository';
import { runForGroup, nextRunAt } from './agentService';

async function checkAndRunPendingGroups(): Promise<void> {
  const group = await groupRepository.findFirst();
  if (!group) return;

  const lastRun = await agentRunRepository.findLatestByGroupId(group.id);
  const now = new Date();

  // Only start a run when there is no prior run, or when the scheduled retry
  // time has arrived. FAILED runs are retried via their nextRunAt, so we do not
  // need a special-case check on status — that would trigger an immediate re-run
  // on every server restart when a stale run was just marked as FAILED.
  const needsRun = !lastRun || (lastRun.nextRunAt !== null && lastRun.nextRunAt <= now);

  if (!needsRun) return;

  // Don't start a second run if one is already in progress
  if (lastRun?.status === 'RUNNING') return;

  console.log(`[scheduler] Starting scheduled run for group ${group.id}`);
  runForGroup(group.id).catch((err) => {
    console.error('[scheduler] Scheduled run failed:', err);
  });
}

export function startScheduler(): void {
  // Run at 03:00 UTC every day
  cron.schedule(
    '0 3 * * *',
    () => {
      void checkAndRunPendingGroups();
    },
    { timezone: 'UTC' },
  );

  // On startup: mark any runs still stuck in RUNNING as FAILED — they belong to a
  // previous process that was killed mid-run. Set nextRunAt so the scheduler picks
  // them up at the next scheduled window rather than immediately on this restart.
  agentRunRepository
    .failAllStaleRunning('Server restarted', nextRunAt())
    .then(({ count }) => {
      if (count > 0) {
        console.warn(`[scheduler] Marked ${count} stale RUNNING run(s) as FAILED on startup`);
      }
    })
    .then(() => checkAndRunPendingGroups())
    .catch((err) => {
      console.error('[scheduler] Startup check failed:', err);
    });

  console.log('[scheduler] Started — checks daily at 03:00 UTC');
}
