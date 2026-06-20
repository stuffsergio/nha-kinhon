import prisma from "../config/db.js";

export async function search(req, res) {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.json({ products: [], markets: [], categories: [] });
  }

  const query = q.trim();

  const [products, markets, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        available: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { category: true, market: true },
      take: 20,
    }),
    prisma.market.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.category.findMany({
      where: {
        active: true,
        name: { contains: query, mode: "insensitive" },
      },
      include: { _count: { select: { products: true } } },
      take: 10,
    }),
  ]);

  res.json({ products, markets, categories });
}
