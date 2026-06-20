import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./src/config/env.js";
import { AppError } from "./src/utils/errors.js";
import authRoutes from "./src/routes/auth.routes.js";
import marketsRoutes from "./src/routes/markets.routes.js";
import categoriesRoutes from "./src/routes/categories.routes.js";
import productsRoutes from "./src/routes/products.routes.js";
import searchRoutes from "./src/routes/search.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import favoritesRoutes from "./src/routes/favorites.routes.js";
import contactsRoutes from "./src/routes/contacts.routes.js";
import paymentMethodsRoutes from "./src/routes/paymentMethods.routes.js";
import notificationsRoutes from "./src/routes/notifications.routes.js";
import supportersRoutes from "./src/routes/supporters.routes.js";
import stripeRoutes from "./src/routes/stripe.routes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/markets", marketsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/payment-methods", paymentMethodsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/supporters", supportersRoutes);
app.use("/api/stripe", stripeRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  console.error(`[${status}] ${message}`);
  res.status(status).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
});
