import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
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
import deliveryAuthRoutes from "./src/routes/delivery.auth.routes.js";
import deliveryRoutes from "./src/routes/delivery.routes.js";
import adminDeliveryRoutes from "./src/routes/admin.delivery.routes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
app.use("/api/delivery/auth", deliveryAuthRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminDeliveryRoutes);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "../dist");

  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
    console.log(`Sirviendo frontend desde ${distPath}`);
  }
}

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  console.error(`[${status}] ${message}`);
  res.status(status).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
});
