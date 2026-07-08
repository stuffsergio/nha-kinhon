import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const prefixes = ["77", "76", "75", "78", "70", "33"];

function randomPhone() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("");
  return `${prefix}${digits}`;
}

async function main() {
  const contacts = await prisma.contact.findMany({ where: { phone: null } });
  console.log(`Found ${contacts.length} contacts without phone`);

  for (const c of contacts) {
    await prisma.contact.update({
      where: { id: c.id },
      data: { phone: randomPhone() },
    });
    console.log(`  ${c.name} → ${c.name}`);
  }

  console.log("Done");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
