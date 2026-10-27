import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const ShopContext = createContext(null);
const readLocal = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
};

export function ShopProvider({ children }) {
  const [user, setUser] = useState(() => readLocal("shopsphere_user", null));
  const [cart, setCart] = useState(() => readLocal("shopsphere_cart", { items: [], subtotal: 0, shipping: 0, total: 0 }));
  const [wishlist, setWishlist] = useState(() => readLocal("shopsphere_wishlist", []));
  const [toast, setToast] = useState("");

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const refreshCart = useCallback(async () => {
    const { data } = await api.get("/cart/");
    setCart(data);
    localStorage.setItem("shopsphere_cart", JSON.stringify(data));
    return data;
  }, []);

  const refreshWishlist = useCallback(async () => {
    const { data } = await api.get("/wishlist/");
    setWishlist(data);
    localStorage.setItem("shopsphere_wishlist", JSON.stringify(data));
    return data;
  }, []);

  useEffect(() => {
    if (user) {
      refreshCart().catch(() => notify("Could not sync your cart. Please refresh to try again."));
      refreshWishlist().catch(() => notify("Could not sync your wishlist. Please refresh to try again."));
    }
  }, [user, refreshCart, refreshWishlist, notify]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (product.stock < quantity) throw new Error("This quantity is not available.");
    if (localStorage.getItem("shopsphere_access")) {
      await api.post("/cart/items/", { product_id: product.id, quantity });
      await refreshCart();
    } else {
      setCart((current) => {
        const items = [...current.items];
        const existing = items.find((item) => item.product.id === product.id);
        if (existing) {
          if (existing.quantity + quantity > product.stock) throw new Error("There are not enough units in stock.");
          existing.quantity += quantity;
          existing.line_total = Number(product.price) * existing.quantity;
        } else items.push({ id: `local-${product.id}`, product, quantity, line_total: Number(product.price) * quantity });
        const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
        const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;
        const next = { items, subtotal, shipping, total: subtotal + shipping };
        localStorage.setItem("shopsphere_cart", JSON.stringify(next));
        return next;
      });
    }
    notify("Added to your cart");
  }, [notify, refreshCart]);

  const setQuantity = useCallback(async (item, quantity) => {
    if (localStorage.getItem("shopsphere_access")) {
      await api.patch(`/cart/items/${item.id}/`, { quantity });
      await refreshCart();
    } else {
      setCart((current) => {
        const items = current.items.map((row) => row.id === item.id ? { ...row, quantity, line_total: Number(row.product.price) * quantity } : row);
        const subtotal = items.reduce((sum, row) => sum + Number(row.product.price) * row.quantity, 0);
        const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;
        const next = { items, subtotal, shipping, total: subtotal + shipping };
        localStorage.setItem("shopsphere_cart", JSON.stringify(next));
        return next;
      });
    }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (item) => {
    if (localStorage.getItem("shopsphere_access")) {
      await api.delete(`/cart/items/${item.id}/`);
      await refreshCart();
    } else {
      setCart((current) => {
        const items = current.items.filter((row) => row.id !== item.id);
        const subtotal = items.reduce((sum, row) => sum + Number(row.product.price) * row.quantity, 0);
        const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 49;
        const next = { items, subtotal, shipping, total: subtotal + shipping };
        localStorage.setItem("shopsphere_cart", JSON.stringify(next));
        return next;
      });
    }
  }, [refreshCart]);

  const toggleWishlist = useCallback(async (product) => {
    if (localStorage.getItem("shopsphere_access")) {
      const current = wishlist.find((item) => item.product.id === product.id);
      if (current) await api.delete(`/wishlist/items/${current.id}/`);
      else await api.post("/wishlist/items/", { product_id: product.id });
      await refreshWishlist();
    } else {
      setWishlist((current) => {
        const exists = current.some((item) => item.product?.id === product.id || item.id === product.id);
        const next = exists
          ? current.filter((item) => (item.product?.id || item.id) !== product.id)
          : [...current, { id: product.id, product }];
        localStorage.setItem("shopsphere_wishlist", JSON.stringify(next));
        return next;
      });
    }
  }, [wishlist, refreshWishlist]);

  const login = useCallback(async (username, password) => {
    const localCart = readLocal("shopsphere_cart", { items: [] });
    const localWishlist = readLocal("shopsphere_wishlist", []);
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("shopsphere_access", data.access);
    localStorage.setItem("shopsphere_refresh", data.refresh);
    const profile = await api.get("/auth/profile/");
    setUser(profile.data);
    localStorage.setItem("shopsphere_user", JSON.stringify(profile.data));
    let failedSyncs = 0;
    for (const item of localCart.items) {
      try { await api.post("/cart/items/", { product_id: item.product.id, quantity: item.quantity }); }
      catch { failedSyncs += 1; }
    }
    for (const item of localWishlist) {
      const product = item.product || item;
      if (product.id) {
        try { await api.post("/wishlist/items/", { product_id: product.id }); }
        catch { failedSyncs += 1; }
      }
    }
    localStorage.removeItem("shopsphere_cart");
    localStorage.removeItem("shopsphere_wishlist");
    if (failedSyncs) notify(`${failedSyncs} saved item(s) could not be synced. Please check your wishlist and cart.`);
  }, [notify]);

  const register = useCallback(async (payload) => {
    await api.post("/auth/register/", payload);
    await login(payload.username, payload.password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("shopsphere_access");
    localStorage.removeItem("shopsphere_refresh");
    localStorage.removeItem("shopsphere_user");
    setUser(null);
    notify("You have been signed out");
  }, [notify]);

  const value = useMemo(() => ({
    user, cart, wishlist, toast, notify, addToCart, setQuantity, removeFromCart,
    toggleWishlist, login, register, logout, refreshCart, refreshWishlist,
    setUser,
  }), [user, cart, wishlist, toast, notify, addToCart, setQuantity, removeFromCart, toggleWishlist, login, register, logout, refreshCart, refreshWishlist]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
