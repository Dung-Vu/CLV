import { runIngestionOnce } from './src/modules/ingestion/ingestion.service';
import { prisma } from './src/lib/db';

async function main() {
  console.log('Testing ingestion run...');
  const results = await runIngestionOnce();
  console.log('Ingestion complete:', JSON.stringify(results, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
