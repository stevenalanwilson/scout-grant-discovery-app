import cron from 'node-cron';
import { groupRepository } from '../repositories/groupRepository';
import { agentRunRepository } from '../repositories/agentRunRepository';
import { runForGroup } from './agentService';

async function checkAndRunPendingGroups(): Promise<void> {
  const group = await groupRepository.findFirst();
  if (!group) return;

  const lastRun = await agentRunRepository.findLatestByGroupId(group.id);
  const now = new Date();

  const needsRun =
    !lastRun ||
    (lastRun.nextRunAt !== null && lastRun.nextRunAt <= now) ||
    lastRun.status === 'FAILED';

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

  // Also check on startup in case the server restarted mid-schedule
  void checkAndRunPendingGroups();

  console.log('[scheduler] Started — checks daily at 03:00 UTC');
}
