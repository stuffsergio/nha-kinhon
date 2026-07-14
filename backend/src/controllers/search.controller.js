import prisma from "../config/db.js";
import {
  buildProductTextWhere,
  buildMarketTextWhere,
  buildCategoryTextWhere,
  categoryProductCountSelect,
  parseLimit,
  parsePage,
} from "../utils/search.js";

const LEGACY_PRODUCT_LIMIT = 20;
const LEGACY_MARKET_LIMIT = 10;
const LEGACY_CATEGORY_LIMIT = 10;

const SUGGEST_PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  unit: true,
  image: true,
};

const SUGGEST_CATEGORY_SELECT = {
  id: true,
  name: true,
  icon: true,
};

const SUGGEST_MARKET_SELECT = {
  id: true,
  name: true,
  location: true,
  type: true,
};

export async function search(req, res) {
  const { q, page, limit } = req.query;
  if (!q || !q.trim()) {
    return res.json({ products: [], markets: [], categories: [] });
  }

  const query = q.trim();
  const usePagination = page !== undefined || limit !== undefined;
  const pageNum = parsePage(page);
  const limitNum = parseLimit(limit, 20);

  const productWhere = buildProductTextWhere(query);
  const productQuery = {
    where: productWhere,
    include: { category: true, market: true },
  };

  if (usePagination) {
    productQuery.skip = (pageNum - 1) * limitNum;
    productQuery.take = limitNum;
  } else {
    productQuery.take = LEGACY_PRODUCT_LIMIT;
  }

  const [products, markets, categories, total] = await Promise.all([
    prisma.product.findMany(productQuery),
    prisma.market.findMany({
      where: buildMarketTextWhere(query),
      take: LEGACY_MARKET_LIMIT,
    }),
    prisma.category.findMany({
      where: buildCategoryTextWhere(query),
      include: categoryProductCountSelect,
      take: LEGACY_CATEGORY_LIMIT,
    }),
    usePagination ? prisma.product.count({ where: productWhere }) : Promise.resolve(undefined),
  ]);

  const response = { products, markets, categories };
  if (usePagination) {
    response.total = total;
    response.page = pageNum;
    response.limit = limitNum;
  }

  res.json(response);
}

export async function suggest(req, res) {
  const { q, limit } = req.query;
  if (!q || !q.trim()) {
    return res.json({ products: [], markets: [], categories: [] });
  }

  const query = q.trim();
  const limitNum = parseLimit(limit, 8, 20);
  const categoryLimit = Math.min(3, limitNum);
  const marketLimit = Math.min(2, limitNum);
  const productLimit = Math.max(limitNum - categoryLimit - marketLimit, 1);

  const [products, categories, markets] = await Promise.all([
    prisma.product.findMany({
      where: buildProductTextWhere(query),
      select: SUGGEST_PRODUCT_SELECT,
      orderBy: { name: "asc" },
      take: productLimit,
    }),
    prisma.category.findMany({
      where: buildCategoryTextWhere(query),
      select: SUGGEST_CATEGORY_SELECT,
      orderBy: { name: "asc" },
      take: categoryLimit,
    }),
    prisma.market.findMany({
      where: buildMarketTextWhere(query),
      select: SUGGEST_MARKET_SELECT,
      orderBy: { name: "asc" },
      take: marketLimit,
    }),
  ]);

  res.json({ products, categories, markets });
}
