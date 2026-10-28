import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

    it("opens the All drawer with every department and real product links", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByRole("button", { name: "All" }));
      const drawer = screen.getByRole("dialog", { name: "All shopping categories" });
      expect(within(drawer).getByRole("link", { name: /Shop all Electronics/ })).toBeTruthy();
      expect(within(drawer).getByRole("link", { name: /Smartphone/ })).toBeTruthy();
      expect(document.querySelectorAll(".all-menu-departments button")).toHaveLength(8);
    });

    it("opens a matching subcategory list when a department is selected", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      fireEvent.click(screen.getByRole("button", { name: "All" }));
      const drawer = screen.getByRole("dialog", { name: "All shopping categories" });
      fireEvent.click(screen.getByRole("button", { name: /Fashion/ }));
      expect(within(drawer).getByRole("link", { name: /Shop all Fashion/ })).toBeTruthy();
      expect(within(drawer).getByRole("link", { name: /Sneakers/ })).toBeTruthy();
      expect(within(drawer).queryByRole("link", { name: /Smartphone/ })).toBeNull();
    });

    it("opens the department dropdown on hover and closes the All drawer with Escape", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      const electronicsMenu = document.querySelector(".secondary-category");
      fireEvent.mouseEnter(electronicsMenu);
      expect(electronicsMenu.open).toBe(true);
      expect(screen.getByRole("link", { name: /Shop all Electronics/ })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "All" }));
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "All shopping categories" })).toBeNull();
    });

    it("provides populated product and deal submenus for every department", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      const departments = document.querySelectorAll(".secondary-category");
      expect(departments).toHaveLength(8);
      departments.forEach((department) => {
        fireEvent.mouseEnter(department);
        const menu = within(department).getByRole("link", { name: /Shop all/ }).parentElement.parentElement;
        expect(within(menu).getByText("Popular picks")).toBeTruthy();
        expect(within(menu).getByRole("link", { name: /Bestsellers/ })).toBeTruthy();
        expect(within(menu).queryAllByRole("link").length).toBeGreaterThan(6);
      });
    });

    it("opens a department when clicked, including after hover has already activated it", () => {
      render(
        <MemoryRouter>
          <ShopProvider>
            <Header />
          </ShopProvider>
        </MemoryRouter>,
      );
      const department = document.querySelector(".secondary-category");
      const summary = within(department).getByText("Electronics");
      fireEvent.mouseEnter(department);
      fireEvent.click(summary);
      expect(department.open).toBe(true);
      expect(within(department).getByRole("link", { name: /Shop all Electronics/ })).toBeTruthy();
      fireEvent.keyDown(within(department).getByRole("link", { name: /Shop all Electronics/ }), { key: "Escape" });
      expect(department.open).toBe(false);
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
