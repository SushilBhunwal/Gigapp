import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function fix() {
  await prisma.serviceCategory.createMany({
    data: [
      { id: "cat-tutor", name: "Tutor", icon: "BookOpen" },
      { id: "cat-eldercare", name: "Elder Care", icon: "Heart" },
      { id: "cat-carpenter", name: "Carpenter", icon: "Hammer" }
    ],
    skipDuplicates: true
  });
  const all = await prisma.serviceCategory.findMany();
  console.log("All categories:", all.map(c => c.name));
}
fix().finally(() => prisma.$disconnect());
