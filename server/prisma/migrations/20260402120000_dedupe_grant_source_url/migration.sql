-- Step 1: Remove duplicate Grant rows, keeping the most recently created per (groupId, sourceUrl).
-- Cascades will remove any associated EligibilityResult and ShortlistItem rows for deleted duplicates.
DELETE FROM "Grant"
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY "groupId", "sourceUrl"
        ORDER BY "createdAt" DESC, id DESC
      ) AS rn
    FROM "Grant"
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add unique constraint on (groupId, sourceUrl).
CREATE UNIQUE INDEX "Grant_groupId_sourceUrl_key" ON "Grant"("groupId", "sourceUrl");
