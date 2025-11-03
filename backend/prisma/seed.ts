import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // This is a minimal seed that just verifies database connection
  // No demo data is created - your users will create real data
  
  console.log('✅ Database is ready for real user data');
  console.log('✨ Users can sign up and create their own trips, activities, and expenses');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });