/**
 * Backfill script: Client normalizedNombre
 * 
 * Populates the normalizedNombre field for all existing clients using the shared
 * CompanyNameNormalizationService to guarantee identical normalization logic.
 * 
 * Run BEFORE adding the @@unique constraint in the schema.
 * 
 * Usage:
 *   bun run scripts/backfill-client-normalized-nombre.ts
 */

import prisma from "../src/core/lib/prisma";
import { CompanyNameNormalizationService } from "../src/core/shared/services/CompanyNameNormalizationService";

async function main() {
  console.log("🔄 Starting backfill of Client.normalizedNombre...");

  // Fetch all clients with empty normalizedNombre
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { normalizedNombre: "" },
        { normalizedNombre: null as unknown as string }, // Handle potential null values
      ],
    },
    select: {
      id: true,
      nombre: true,
      tenantId: true,
    },
  });

  console.log(`📊 Found ${clients.length} clients to backfill`);

  if (clients.length === 0) {
    console.log("✅ All clients already have normalizedNombre set");
    return;
  }

  let updated = 0;
  let errors = 0;

  for (const client of clients) {
    try {
      const normalizedNombre = CompanyNameNormalizationService.normalize(client.nombre);
      
      await prisma.client.update({
        where: { id: client.id },
        data: { normalizedNombre },
      });

      updated++;
      
      if (updated % 100 === 0) {
        console.log(`   Progress: ${updated}/${clients.length} clients updated`);
      }
    } catch (error) {
      console.error(`❌ Error updating client ${client.id} (${client.nombre}):`, error);
      errors++;
    }
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);

  // Check for duplicates that would violate the unique constraint
  console.log("\n🔍 Checking for potential duplicates...");
  
  const duplicates = await prisma.$queryRaw<{ tenantId: string; normalizedNombre: string; count: bigint }[]>`
    SELECT "tenantId", "normalizedNombre", COUNT(*) as count
    FROM client
    WHERE "normalizedNombre" != ''
    GROUP BY "tenantId", "normalizedNombre"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate normalized name groups:`);
    for (const dup of duplicates) {
      console.log(`   - Tenant ${dup.tenantId}, normalized: "${dup.normalizedNombre}" (${dup.count} clients)`);
      
      // Show the actual client names
      const conflictingClients = await prisma.client.findMany({
        where: {
          tenantId: dup.tenantId,
          normalizedNombre: dup.normalizedNombre,
        },
        select: {
          id: true,
          nombre: true,
        },
      });
      
      for (const client of conflictingClients) {
        console.log(`     → ${client.nombre} (ID: ${client.id})`);
      }
    }
    console.log("\n⚠️  You MUST manually resolve these duplicates before adding the @@unique constraint!");
  } else {
    console.log("✅ No duplicates found. Safe to add @@unique constraint.");
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
