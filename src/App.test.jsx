import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Header, optimizedImageUrl, ProductCard } from "./App";
import { ShopProvider } from "./shop-context";

const sampleProduct = {
  id: 7,
  name: "Everyday headphones",
  slug: "everyday-headphones",
  brand: { name: "Northstar" },
  category: { name: "Electronics" },
  price: "2499.00",
  original_price: "2999.00",
  discount_percent: 16,
  rating: "4.50",
  review_count: 12,
  stock: 3,
  image_url: "",
};

function renderCard() {
  return render(
    <MemoryRouter>
      <ShopProvider>
        <ProductCard product={sampleProduct} />
      </ShopProvider>
    </MemoryRouter>,
  );
}

describe("ProductCard", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("navigation and image delivery", () => {
    afterEach(() => {
      cleanup();
      localStorage.clear();
    });

    it("opens a keyboard-friendly category dropdown with every category", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByText("Shop by category"));
      expect(screen.getByRole("link", { name: /Electronics/ })).toBeTruthy();
      expect(screen.getByRole("link", { name: /Grocery & Essentials/ })).toBeTruthy();
      expect(document.querySelectorAll(".category-dropdown-menu a")).toHaveLength(8);
    });

    it("requests appropriately sized, compressed Unsplash images", () => {
      const url = new URL(optimizedImageUrl("https://images.unsplash.com/photo-demo?w=900&q=85", 480, 65));
      expect(url.searchParams.get("w")).toBe("480");
      expect(url.searchParams.get("q")).toBe("65");
      expect(url.searchParams.get("auto")).toBe("format");
    });
  });

  it("shows product identity, discount, and stock-aware cart action", () => {
    renderCard();
    expect(screen.getByText("Everyday headphones")).toBeTruthy();
    expect(screen.getByText("16% off")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeTruthy();
  });

  it("adds a product to the anonymous cart", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("shopsphere_cart"));
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product.id).toBe(sampleProduct.id);
      expect(cart.total).toBe(2499);
    });
  });

  it("toggles the product in the anonymous wishlist", async () => {
    renderCard();
    const wishlistButton = screen.getByRole("button", { name: "Add to wishlist" });
    fireEvent.click(wishlistButton);
    await waitFor(() => expect(JSON.parse(localStorage.getItem("shopsphere_wishlist"))).toHaveLength(1));
  });
});
