import { describe, it, expect } from "vitest";
import {
  localeFromAcceptLanguage,
  normalizeLocale,
  resolveLocale,
  t,
  translateNotification,
  translateError,
  isSupportedLocale,
} from "../../../i18n/index.js";

describe("i18n", () => {
  it("normalizes locale tags", () => {
    expect(normalizeLocale("pt-PT")).toBe("pt");
    expect(normalizeLocale("pov")).toBe("pov");
    expect(normalizeLocale("en")).toBe(null);
  });

  it("resolves Accept-Language with fallback to es", () => {
    expect(localeFromAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("es");
  });

  it("prefers user locale over Accept-Language", () => {
    expect(
      resolveLocale({ userLocale: "pov", acceptLanguage: "es-ES" }),
    ).toBe("pov");
  });

  it("falls back pov -> pt -> es for missing keys", () => {
    expect(t("errors.INTERNAL", "pov")).toContain("Erru");
    expect(t("nonexistent.key.path", "pov")).toBe("nonexistent.key.path");
  });

  it("translates notifications per locale", () => {
    const es = translateNotification("ORDER_DELIVERED", "es", { shortId: "abc12345" });
    const pt = translateNotification("ORDER_DELIVERED", "pt", { shortId: "abc12345" });
    expect(es.title).toBe("Pedido entregado");
    expect(pt.title).toBe("Encomenda entregue");
    expect(es.message).toContain("abc12345");
  });

  it("translates NOT_FOUND with resource label", () => {
    expect(
      translateError("NOT_FOUND", "pt", { resource: "Pedido" }),
    ).toContain("Encomenda");
  });

  it("validates supported locales", () => {
    expect(isSupportedLocale("es")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
  });
});
