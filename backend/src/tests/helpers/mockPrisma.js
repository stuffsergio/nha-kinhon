function createMockDelegate() {
  const store = {};

  const delegate = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirstOrThrow: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };

  return delegate;
}

export function createMockPrisma() {
  return {
    user: createMockDelegate(),
    market: createMockDelegate(),
    product: createMockDelegate(),
    category: createMockDelegate(),
    order: createMockDelegate(),
    orderItem: createMockDelegate(),
    cart: createMockDelegate(),
    cartItem: createMockDelegate(),
    favorite: createMockDelegate(),
    contactMessage: createMockDelegate(),
    notification: createMockDelegate(),
    supporter: createMockDelegate(),
    paymentMethod: createMockDelegate(),
    deliveryProfile: createMockDelegate(),
    $transaction: vi.fn((fn) => fn(prisma)),
    $disconnect: vi.fn(),
  };
}

export function mockReset(prisma) {
  for (const key of Object.keys(prisma)) {
    const delegate = prisma[key];
    if (delegate && typeof delegate === "object" && !Array.isArray(delegate)) {
      for (const method of Object.keys(delegate)) {
        if (typeof delegate[method] === "function") {
          delegate[method].mockReset();
        }
      }
    }
  }
}
