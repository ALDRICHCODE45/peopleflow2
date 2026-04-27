/**
 * Fix script: Clean stale isInTerna/isFinalist flags on DESCARTADO candidates
 *
 * Production bug: markAsContratado() was setting status="DESCARTADO" on non-hired
 * candidates but NOT clearing their isInTerna/isFinalist flags. This caused the
 * placement congrats email to be sent to discarded candidates instead of the hired one.
 *
 * This script cleans up all existing corrupted records in the database.
 *
 * Usage:
 *   bun run scripts/fix-stale-candidate-flags.ts
 */

import prisma from "../src/core/lib/prisma";

async function main() {
  console.log("🔄 Scanning for DESCARTADO candidates with stale flags...\n");

  // Count affected records
  const affected = await prisma.vacancyCandidate.count({
    where: {
      status: "DESCARTADO",
      OR: [{ isInTerna: true }, { isFinalist: true }],
    },
  });

  if (affected === 0) {
    console.log("✅ No corrupted records found. Database is clean.");
    return;
  }

  console.log(`⚠️  Found ${affected} DESCARTADO candidates with stale flags\n`);

  // Show breakdown by tenant for audit trail
  const affectedRecords = await prisma.vacancyCandidate.findMany({
    where: {
      status: "DESCARTADO",
      OR: [{ isInTerna: true }, { isFinalist: true }],
    },
    select: { tenantId: true, isInTerna: true, isFinalist: true },
  });

  const tenantBreakdown = new Map<
    string,
    { staleInTerna: number; staleFinalist: number }
  >();

  for (const record of affectedRecords) {
    const entry = tenantBreakdown.get(record.tenantId) ?? {
      staleInTerna: 0,
      staleFinalist: 0,
    };
    if (record.isInTerna) entry.staleInTerna++;
    if (record.isFinalist) entry.staleFinalist++;
    tenantBreakdown.set(record.tenantId, entry);
  }

  for (const [tenantId, counts] of tenantBreakdown) {
    console.log(
      `   Tenant ${tenantId}: ${counts.staleInTerna} stale isInTerna, ${counts.staleFinalist} stale isFinalist`
    );
  }

  // Apply the fix
  console.log("\n🔧 Cleaning stale flags...");

  const result = await prisma.vacancyCandidate.updateMany({
    where: {
      status: "DESCARTADO",
      OR: [{ isInTerna: true }, { isFinalist: true }],
    },
    data: { isInTerna: false, isFinalist: false },
  });

  console.log(`\n✅ Fix complete! Updated ${result.count} records.`);

  // Verify
  const remaining = await prisma.vacancyCandidate.count({
    where: {
      status: "DESCARTADO",
      OR: [{ isInTerna: true }, { isFinalist: true }],
    },
  });

  if (remaining === 0) {
    console.log("✅ Verification passed: zero stale flags remaining.");
  } else {
    console.log(
      `❌ Verification failed: ${remaining} records still have stale flags!`
    );
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
