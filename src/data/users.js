export const users = [
  {
    id: 1,
    name: "Admin",
    email: "admin@gmail.com",
    password: "1234",
    balance: 80,
    favorites: [5, 8, 12, 17, 22],
    orders: [
      {
        id: 101,
        date: "2024-01-15",
        status: "entregado",
        total: 12500,
        items: [
          { productId: 1, quantity: 2, price: 2500 },
          { productId: 5, quantity: 1, price: 3500 },
          { productId: 7, quantity: 3, price: 1000 }
        ],
        recipient: { name: "Luz", email: "luz@gmail.com" }
      },
      {
        id: 102,
        date: "2024-02-20",
        status: "en_proceso",
        total: 9500,
        items: [
          { productId: 9, quantity: 2, price: 2000 },
          { productId: 10, quantity: 5, price: 500 },
          { productId: 11, quantity: 1, price: 2500 }
        ],
        recipient: { name: "Lucas", email: "lucas@gmail.com" }
      }
    ],
    contacts: [
      { id: 1, name: "Luz", email: "luz@gmail.com" },
      { id: 2, name: "Lucas", email: "lucas@gmail.com" },
      { id: 3, name: "Sofía", email: "sofia@gmail.com" },
      { id: 4, name: "Sergio", email: "sergio@gmail.com" }
    ],
    paymentMethods: [
      { id: 1, type: "visa", last4: "1234", expiry: "12/25" },
      { id: 2, type: "mastercard", last4: "5678", expiry: "08/26" }
    ]
  }
];
