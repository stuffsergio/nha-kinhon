import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const categorySlugToName = {
  granos: "Granos", verduras: "Verduras", carnes: "Carnes",
  pescados: "Pescados", lacteos: "Lácteos", panaderia: "Panadería",
  frutas: "Frutas", tuberculos: "Tubérculos", aceites: "Aceites",
  bebidas: "Bebidas", condimentos: "Condimentos", snacks: "Snacks",
  postres: "Postres", frutos_secos: "Frutos Secos",
  desayuno: "Desayuno", endulzantes: "Endulzantes",
};

async function seed() {
  console.log("🌱 Iniciando seed...");

  // Clean existing data
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.supporter.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.market.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Markets
  const marketsData = JSON.parse(
    readFileSync(join(__dirname, "..", "seed", "markets.json"), "utf-8")
  );
  const markets = await Promise.all(
    marketsData.map((m) =>
      prisma.market.create({
        data: {
          name: m.name,
          type: m.type,
          location: m.location,
          address: m.address || null,
          phone: m.phone || null,
          hours: m.hours,
          coordinates: m.coordinates,
          lat: m.lat || null,
          lng: m.lng || null,
        },
      })
    )
  );
  console.log(`  ✅ ${markets.length} mercados`);

  // Categories
  const categoriesData = JSON.parse(
    readFileSync(join(__dirname, "..", "seed", "categories.json"), "utf-8")
  );
  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.create({
        data: { name: c.name, icon: c.icon },
      })
    )
  );
  console.log(`  ✅ ${categories.length} categorías`);

  // Products
  const productsData = JSON.parse(
    readFileSync(join(__dirname, "..", "seed", "products.json"), "utf-8")
  );
  const products = await Promise.all(
    productsData.map((p) => {
      const categoryName = categorySlugToName[p.categorySlug];
      const category = categories.find((c) => c.name === categoryName);
      return prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          unit: p.unit,
          categoryId: category.id,
          marketId: markets[p.marketIndex].id,
        },
      });
    })
  );
  console.log(`  ✅ ${products.length} productos`);

  // Users
  const usersData = JSON.parse(
    readFileSync(join(__dirname, "..", "seed", "users.json"), "utf-8")
  );
  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        balance: u.balance || 0,
      },
    });

    // Create favorites for demo user
    if (u.favorites) {
      for (const productIndex of u.favorites) {
        const product = products[productIndex - 1];
        if (product) {
          await prisma.favorite.create({
            data: { userId: user.id, productId: product.id },
          });
        }
      }
    }

    // Create contacts and payment methods for demo user
    if (u.role === "USER") {
      const contacts = [
        { name: "Luz", email: "luz@gmail.com" },
        { name: "Lucas", email: "lucas@gmail.com" },
        { name: "Sofía", email: "sofia@gmail.com" },
      ];
      for (const c of contacts) {
        await prisma.contact.create({
          data: { ...c, userId: user.id },
        });
      }

      await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          type: "VISA",
          last4: "1234",
          expiry: "12/25",
          isDefault: true,
        },
      });
    }

    console.log(`  ✅ Usuario: ${u.email} (${u.role})`);
  }

  console.log("🎉 Seed completado!");
}

seed()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
