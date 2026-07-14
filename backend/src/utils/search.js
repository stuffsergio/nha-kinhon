export function buildProductTextWhere(query) {
  return {
    available: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ],
  };
}

export function buildMarketTextWhere(query) {
  return {
    active: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { location: { contains: query, mode: "insensitive" } },
    ],
  };
}

export function buildCategoryTextWhere(query) {
  return {
    active: true,
    name: { contains: query, mode: "insensitive" },
  };
}

export const categoryProductCountSelect = {
  _count: {
    select: {
      products: { where: { available: true } },
    },
  },
};

const SORT_MAP = {
  name_asc: { name: "asc" },
  name_desc: { name: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

export function parseProductSort(sort) {
  return SORT_MAP[sort] || { name: "asc" };
}

export function parseLimit(value, fallback, max = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export function parsePage(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}
