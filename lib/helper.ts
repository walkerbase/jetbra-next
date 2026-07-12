import { Product } from "@/stores/license-store";

export function getProductCodes(product: Product): string[] {
  return product.code
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function randomTenStr(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));

  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function toBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64");
  }

  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}

export function fromBase64(base64: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }

  return new TextDecoder().decode(
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
  );
}
