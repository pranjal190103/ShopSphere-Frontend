import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow, ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Heart, House, MapPin, Menu, PackageCheck, Search,
  ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Star, Truck,
  UserRound, X,
} from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { apiError, money } from "./api";
import { useShop } from "./shop-context";

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#edf1f5"/><circle cx="320" cy="205" r="52" fill="#d5dde7"/><path d="M170 370l105-112 72 77 48-48 75 83z" fill="#c0ccd9"/><text x="50%" y="90%" text-anchor="middle" fill="#6b7787" font-family="Arial" font-size="18">ShopSphere</text></svg>')}`;

const categories = [
  ["Electronics", "Electronics", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80"],
  ["Fashion", "Fashion", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80"],
  ["Home & Kitchen", "Home & Kitchen", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80"],
  ["Beauty & Personal Care", "Beauty & Personal Care", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80"],
  ["Sports & Fitness", "Sports & Fitness", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80"],
  ["Books", "Books", "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=700&q=80"],
  ["Toys & Games", "Toys & Games", "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=700&q=80"],
  ["Grocery & Essentials", "Grocery & Essentials", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80"],
];

export const optimizedImageUrl = (source, width, quality = 68) => {
  if (!source || !source.includes("images.unsplash.com")) return source || FALLBACK_IMAGE;
  try {
    const url = new URL(source);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    return url.toString();
  } catch {
    return source;
  }
};

function ProductImage({ product, className = "", eager = false }) {
  const source = product.image_url || FALLBACK_IMAGE;
  const srcSet = source.includes("images.unsplash.com")
    ? [320, 480, 800].map((width) => `${optimizedImageUrl(source, width)} ${width}w`).join(", ")
    : undefined;
  return <img
    className={className}
    src={optimizedImageUrl(source, eager ? 1000 : 480, eager ? 75 : 65)}
    srcSet={srcSet}
    sizes={eager ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 50vw, 25vw"}
    alt={product.name}
    loading={eager ? "eager" : "lazy"}
    fetchPriority={eager ? "high" : "auto"}
    decoding="async"
    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGE; event.currentTarget.removeAttribute("srcset"); }}
  />;
}

export function Header() {
  const { cart, user, wishlist } = useShop();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const submit = (event) => {
    event.preventDefault();
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };
  return <>
    <div className="utilitybar"><div className="container utility-inner"><span>Thoughtful finds, delivered to your door.</span><span className="utility-right"><Truck size={14} /> Free delivery on orders over ₹999 <span className="utility-divider">|</span> India</span></div></div>
    <header className="site-header">
      <div className="container header-main">
        <button className="mobile-menu icon-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        <Link to="/" className="brand-mark" aria-label="ShopSphere home"><span className="brand-orb"><ShoppingBag size={21} /></span><span>shop<span>sphere</span><small>FIND YOUR EVERYDAY</small></span></Link>
        <div className="delivery-chip"><MapPin size={17} /><span><small>Delivering to</small><b>Your location</b></span></div>
        <form className="search-form" onSubmit={submit}><label className="sr-only" htmlFor="global-search">Search products</label><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands and more" /><button aria-label="Search"><Search size={20} /></button></form>
        <div className="header-actions">
          <details className="header-account-dropdown">
            <summary className="header-link account-link"><UserRound size={20} /><span><small>{user ? `Hello, ${user.first_name || user.username}` : "Welcome"}</small><b>{user ? "Your account" : "Sign in"}</b></span><ChevronDown size={13} /></summary>
            <div className="header-dropdown-menu account-dropdown-menu">
              {user ? <>
                <span className="dropdown-heading">Your ShopSphere</span>
                <Link to="/account" onClick={(event) => event.currentTarget.closest("details").open = false}>My account</Link>
                <Link to="/account" onClick={(event) => event.currentTarget.closest("details").open = false}>Orders</Link>
                <Link to="/wishlist" onClick={(event) => event.currentTarget.closest("details").open = false}>Wishlist ({wishlist.length})</Link>
                <Link to="/account?tab=addresses" onClick={(event) => event.currentTarget.closest("details").open = false}>Saved addresses</Link>
              </> : <>
                <span className="dropdown-heading">Welcome to ShopSphere</span>
                <Link to="/login" onClick={(event) => event.currentTarget.closest("details").open = false}>Sign in</Link>
                <Link to="/register" onClick={(event) => event.currentTarget.closest("details").open = false}>Create an account</Link>
                <Link to="/account" onClick={(event) => event.currentTarget.closest("details").open = false}>Track an order</Link>
              </>}
            </div>
          </details>
          <Link className="header-link orders-link" to="/account"><PackageCheck size={20} /><span><small>Track & manage</small><b>Orders</b></span></Link>
          <Link className="cart-link" to="/cart" aria-label={`Cart with ${itemCount} items`}><ShoppingCart size={23} /><span className="cart-count">{itemCount}</span><b>Cart</b></Link>
        </div>
      </div>
      <nav className={`category-nav ${open ? "nav-open" : ""}`} aria-label="Main navigation"><div className="container nav-inner">
        <Link to="/products" onClick={() => setOpen(false)}><SlidersHorizontal size={16} /> All products</Link>
        <details className="category-dropdown">
          <summary aria-label="Browse product categories"><span>Shop by category</span><ChevronDown size={14} /></summary>
          <div className="header-dropdown-menu category-dropdown-menu">
            {categories.map(([name, value]) => <Link key={name} to={`/products?category=${encodeURIComponent(value)}`} onClick={(event) => { setOpen(false); event.currentTarget.closest("details").open = false; }}>{name}<ChevronRight size={14} /></Link>)}
          </div>
        </details>
        <Link className="nav-deal" to="/products?deals=true" onClick={() => setOpen(false)}><Sparkles size={15} /> Today's finds</Link>
      </div></nav>
    </header>
  </>;
}

function Footer() {
  return <footer className="footer"><div className="container"><div className="footer-main">
    <div className="footer-brand"><Link to="/" className="brand-mark footer-logo"><span className="brand-orb"><ShoppingBag size={20} /></span><span>shop<span>sphere</span><small>FIND YOUR EVERYDAY</small></span></Link><p>Good things for every day. Discover thoughtful picks from the brands and makers you love.</p></div>
    <div><h4>Discover</h4><Link to="/products">Shop all</Link><Link to="/products?deals=true">Today's finds</Link><Link to="/products?category=Electronics">Electronics</Link><Link to="/products?category=Home%20%26%20Kitchen">Home & Kitchen</Link></div>
    <div><h4>We're here to help</h4><Link to="/info/shipping">Shipping information</Link><Link to="/info/returns">Returns & refunds</Link><Link to="/info/contact">Contact support</Link><Link to="/account">Your orders</Link></div>
    <div><h4>ShopSphere</h4><Link to="/info/about">About us</Link><Link to="/info/privacy">Privacy policy</Link><Link to="/info/terms">Terms of use</Link><span className="footer-note">Made for everyday discovery.</span></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} ShopSphere. A demo shopping experience.</span><span>Secure browsing <ShieldCheck size={15} /></span></div></div></footer>;
}

function Rating({ value = 0, count }) {
  return <span className="rating"><span aria-label={`${Number(value).toFixed(1)} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} fill={n <= Math.round(Number(value)) ? "currentColor" : "none"} />)}</span><small>{Number(value).toFixed(1)}{count !== undefined ? ` (${count})` : ""}</small></span>;
}

export function ProductCard({ product, compact = false }) {
  const { addToCart, wishlist, toggleWishlist, notify } = useShop();
  const liked = wishlist.some((item) => (item.product?.id || item.id) === product.id);
  const go = () => {
    const recent = JSON.parse(localStorage.getItem("shopsphere_recent") || "[]");
    localStorage.setItem("shopsphere_recent", JSON.stringify([product.id, ...recent.filter((id) => id !== product.id)].slice(0, 8)));
  };
  const add = async (event) => {
    event.preventDefault();
    try { await addToCart(product); } catch (error) { notify(error.message || apiError(error)); }
  };
  return <article className={`product-card ${compact ? "product-card-compact" : ""}`}><div className="product-card-image"><Link to={`/products/${product.slug}`} onClick={go}><ProductImage product={product} /></Link>
    {product.discount_percent > 0 && <span className="discount-tag">{product.discount_percent}% off</span>}
    <button className={`wish-button ${liked ? "is-liked" : ""}`} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} onClick={async () => { try { await toggleWishlist(product); } catch (error) { notify(apiError(error)); } }}><Heart size={17} fill={liked ? "currentColor" : "none"} /></button>
  </div><div className="product-card-content"><Link to={`/products/${product.slug}`} className="product-brand" onClick={go}>{product.brand?.name || "ShopSphere edit"}</Link><Link to={`/products/${product.slug}`} className="product-name" onClick={go}>{product.name}</Link><Rating value={product.rating} count={product.review_count} /><div className="product-price"><b>{money(product.price)}</b>{product.original_price && <del>{money(product.original_price)}</del>}</div>
    <button className="button button-outline button-small add-card-button" onClick={add} disabled={product.stock < 1}>{product.stock ? "Add to cart" : "Out of stock"}</button>
  </div></article>;
}

function ProductGrid({ products, compact = false }) {
  if (!products?.length) return <div className="empty-state"><ShoppingBag size={30} /><h3>Nothing to show just yet</h3><p>Try another category or explore all of our finds.</p><Link className="button button-dark" to="/products">Explore products</Link></div>;
  return <div className={`product-grid ${compact ? "product-grid-compact" : ""}`}>{products.map((product) => <ProductCard key={product.id} product={product} compact={compact} />)}</div>;
}

function SectionTitle({ eyebrow, title, action = "/products", actionText = "Shop all" }) {
  return <div className="section-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div><Link to={action}>{actionText} <ArrowRight size={16} /></Link></div>;
}

function useProducts(path = "/products/") {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(path);
      setProducts(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [path]);
  return { products, loading, error, reload: load };
}

function HomePage() {
  const { products, loading, error } = useProducts("/products/featured/");
  const { products: deals, loading: dealsLoading, error: dealsError, reload: reloadDeals } = useProducts("/products/deals/");
  const { notify } = useShop();
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("shopsphere_recent") || "[]");
    if (ids.length) api.get("/products/", { params: { ids: ids.join(",") } }).then(({ data }) => setRecent(data.results || [])).catch((error) => notify(apiError(error)));
  }, []);
  return <main>
    <section className="hero"><div className="container hero-inner"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> A little more lovely, every day</span><h1>Find your next<br /><em>everyday favourite.</em></h1><p>Thoughtful finds for home, work and everything in between. Discover more of what you love.</p><div className="hero-actions"><Link to="/products" className="button button-light">Explore the collection <ArrowRight size={17} /></Link><Link to="/products?deals=true" className="hero-secondary">See today's finds <ChevronRight size={15} /></Link></div><div className="hero-trust"><span><Check size={14} /> Curated for you</span><span><Check size={14} /> Easy returns</span><span><Check size={14} /> Secure checkout</span></div></div><div className="hero-visual"><div className="hero-photo"></div><div className="hero-note"><span className="hero-note-icon"><Sparkles size={16} /></span><span><b>Good things, found.</b><small>Your next favourite is waiting.</small></span></div><div className="hero-sticker">THE EVERYDAY<br /><b>EDIT</b></div></div></div></section>
    <section className="container category-section"><SectionTitle eyebrow="A world of good things" title="Shop by category" /><div className="category-grid">{categories.map(([name, slug, image], index) => <Link to={`/products?category=${encodeURIComponent(slug)}`} className="category-card" key={name}><img src={optimizedImageUrl(image, 480, 60)} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} /><span className="category-index">0{index + 1}</span><b>{name}</b><span className="category-arrow"><ArrowRight size={15} /></span></Link>)}</div></section>
    <section className="soft-section"><div className="container"><SectionTitle eyebrow="A little something special" title="Today's finds" action="/products?deals=true" actionText="View all deals" />
      {dealsError && <ErrorBanner message={dealsError} retry={reloadDeals} />}
      {dealsLoading ? <ProductSkeleton /> : <ProductGrid products={deals.slice(0, 4)} compact />}
    </div></section>
    <section className="container featured-section"><SectionTitle eyebrow="Picked for your everyday" title="Popular right now" action="/products?sort=popularity" />
      {error ? <ErrorBanner message={error} retry={() => window.location.reload()} /> : loading ? <ProductSkeleton /> : <ProductGrid products={products.slice(0, 4)} compact />}
    </section>
    <section className="container promo-grid"><Link className="promo-card promo-home" to="/products?category=Home%20%26%20Kitchen"><img className="promo-image" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=60" alt="" loading="lazy" decoding="async" /><span>Make room for good living</span><b>Little home<br />upgrades.</b><span className="promo-link">Find your home edit <ArrowRight size={15} /></span></Link><Link className="promo-card promo-style" to="/products?category=Fashion"><img className="promo-image" src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=60" alt="" loading="lazy" decoding="async" /><span>Made to move with you</span><b>Everyday<br />style, reimagined.</b><span className="promo-link">Explore the edit <ArrowRight size={15} /></span></Link><Link className="promo-card promo-tech" to="/products?category=Electronics"><img className="promo-image" src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=60" alt="" loading="lazy" decoding="async" /><span>Smart picks, bright ideas</span><b>Tech that just<br />makes sense.</b><span className="promo-link">See the collection <ArrowRight size={15} /></span></Link></section>
    {recent.length > 0 && <section className="container recent-section"><SectionTitle eyebrow="Back for another look?" title="Recently viewed" /><ProductGrid products={recent.slice(0, 4)} compact /></section>}
    <section className="newsletter"><div className="container newsletter-inner"><div><span className="eyebrow">The good-find letter</span><h2>A little inspiration, in your inbox.</h2><p>New finds, thoughtful picks and a few nice surprises. No noise.</p></div><form onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); notify("Email sign-ups are not enabled in this demo."); }}><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input type="email" id="newsletter-email" required placeholder="Your email address" /><button className="button button-dark">Count me in <ArrowRight size={16} /></button></form></div></section>
  </main>;
}

function ProductSkeleton() {
  return <div className="product-grid product-grid-compact">{[1, 2, 3, 4].map((key) => <div className="skeleton-card" key={key}><div className="skeleton-block" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>;
}

function ErrorBanner({ message, retry }) {
  return <div className="error-banner" role="alert"><div><b>We couldn't load this just now.</b><p>{message}</p></div><button className="button button-outline button-small" onClick={retry}>Try again</button></div>;
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoriesData, setCategoriesData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metadataError, setMetadataError] = useState("");
  const [page, setPage] = useState({ count: 0, next: null, previous: null, current: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("ordering") || searchParams.get("sort") || "";
  useEffect(() => {
    Promise.all([api.get("/categories/"), api.get("/brands/")])
      .then(([categoryResponse, brandResponse]) => {
        setCategoriesData(categoryResponse.data);
        setBrands(brandResponse.data);
      })
      .catch((requestError) => setMetadataError(apiError(requestError)));
  }, []);
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    if (params.get("sort")) {
      const map = { price_low_to_high: "price", price_high_to_low: "-price", rating: "-rating", newest: "-created_at", popularity: "-popularity" };
      params.set("ordering", map[params.get("sort")] || params.get("sort"));
      params.delete("sort");
    }
    api.get("/products/", { params }).then(({ data }) => {
      setProducts(data.results || []);
      setPage({ count: data.count || data.length, next: data.next, previous: data.previous, current: Number(searchParams.get("page") || 1) });
      setError("");
    }).catch((requestError) => setError(apiError(requestError))).finally(() => setLoading(false));
  }, [searchParams]);
  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };
  const clear = () => setSearchParams({});
  return <main className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Shop all</span></div>
    <div className="catalog-heading"><div><span className="eyebrow">{search ? "Your search" : "The ShopSphere edit"}</span><h1>{search ? `Results for “${search}”` : category || "Shop all finds"}</h1><p>{page.count} thoughtfully selected {page.count === 1 ? "find" : "finds"} for you.</p></div><button className="button button-outline filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> Filters <ChevronDown size={15} /></button></div>
    <div className="catalog-layout">
      <aside className={`filter-panel ${filtersOpen ? "filter-open" : ""}`}><div className="filter-title"><b>Refine your finds</b><button onClick={clear}>Clear all</button></div>
        <label className="filter-label">Category<select value={category} onChange={(event) => update("category", event.target.value)}><option value="">All categories</option>{categoriesData.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
        <label className="filter-label">Brand<select value={searchParams.get("brand") || ""} onChange={(event) => update("brand", event.target.value)}><option value="">All brands</option>{brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
        <div className="filter-label">Price range<div className="price-inputs"><label>Min<input aria-label="Minimum price" type="number" min="0" placeholder="₹0" value={searchParams.get("min_price") || ""} onChange={(event) => update("min_price", event.target.value)} /></label><label>Max<input aria-label="Maximum price" type="number" min="0" placeholder="No limit" value={searchParams.get("max_price") || ""} onChange={(event) => update("max_price", event.target.value)} /></label></div></div>
        <label className="filter-label">Customer rating<select value={searchParams.get("min_rating") || ""} onChange={(event) => update("min_rating", event.target.value)}><option value="">Any rating</option><option value="4">4★ & above</option><option value="3">3★ & above</option><option value="2">2★ & above</option></select></label>
        <label className="stock-check"><input type="checkbox" checked={searchParams.get("in_stock") === "true"} onChange={(event) => update("in_stock", event.target.checked ? "true" : "")} /> In stock only</label>
      </aside>
      <section className="catalog-results">{metadataError && <ErrorBanner message={metadataError} retry={() => window.location.reload()} />}<div className="catalog-toolbar"><span>{loading ? "Finding your picks..." : `${products.length} items on this page`}</span><label><ArrowDownWideNarrow size={16} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => update("sort", event.target.value)}><option value="">Recommended</option><option value="price_low_to_high">Price: low to high</option><option value="price_high_to_low">Price: high to low</option><option value="rating">Top rated</option><option value="newest">Newest arrivals</option><option value="popularity">Popular</option></select></label></div>
        {error ? <ErrorBanner message={error} retry={() => setSearchParams(new URLSearchParams(searchParams))} /> : loading ? <ProductSkeleton /> : <ProductGrid products={products} />}
        {!loading && !error && page.count > 12 && <div className="pagination"><button disabled={!page.previous} onClick={() => update("page", String(page.current - 1))}><ArrowLeft size={15} /> Previous</button><span>Page {page.current}</span><button disabled={!page.next} onClick={() => update("page", String(page.current + 1))}>Next <ArrowRight size={15} /></button></div>}
      </section>
    </div>
  </main>;
}

function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart, wishlist, toggleWishlist, user, notify } = useShop();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [related, setRelated] = useState([]);
  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}/`).then(async ({ data }) => {
      setProduct(data);
      const ids = JSON.parse(localStorage.getItem("shopsphere_recent") || "[]");
      localStorage.setItem("shopsphere_recent", JSON.stringify([data.id, ...ids.filter((id) => id !== data.id)].slice(0, 8)));
      const [reviewResponse, relatedResponse] = await Promise.all([api.get(`/products/${slug}/reviews/`), api.get("/products/", { params: { category: data.category.slug } })]);
      setReviews(reviewResponse.data);
      setRelated((relatedResponse.data.results || []).filter((item) => item.id !== data.id).slice(0, 4));
      setError("");
    }).catch((requestError) => setError(apiError(requestError))).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <main className="container page-wrap"><ProductSkeleton /></main>;
  if (error || !product) return <main className="container page-wrap"><div className="empty-state"><CircleHelp size={32} /><h2>We couldn't find that product</h2><p>{error || "It may have moved or is no longer available."}</p><Link className="button button-dark" to="/products">Browse all finds</Link></div></main>;
  const liked = wishlist.some((item) => (item.product?.id || item.id) === product.id);
  const submitReview = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post(`/products/${slug}/reviews/`, reviewForm);
      setReviews((current) => [data, ...current]);
      setReviewForm({ rating: 5, title: "", body: "" });
      notify("Thank you for sharing your review");
    } catch (requestError) { notify(apiError(requestError)); }
  };
  const buyNow = async () => {
    try {
      await addToCart(product, quantity);
      navigate(user ? "/checkout" : "/login?next=checkout");
    } catch (requestError) { notify(requestError.message || apiError(requestError)); }
  };
  return <main className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><Link to={`/products?category=${encodeURIComponent(product.category.name)}`}>{product.category.name}</Link><ChevronRight size={14} /><span>{product.name}</span></div>
    <div className="detail-layout"><div className="detail-image"><ProductImage product={product} eager />{product.discount_percent > 0 && <span className="discount-tag">{product.discount_percent}% off</span>}</div><div className="detail-info"><span className="eyebrow">{product.brand.name} · {product.category.name}</span><h1>{product.name}</h1><Rating value={product.rating} count={product.review_count} /><div className="detail-price">{money(product.price)} {product.original_price && <del>{money(product.original_price)}</del>} {product.discount_percent > 0 && <span>You save {product.discount_percent}%</span>}</div><p className="detail-description">{product.description}</p><div className={`stock-status ${product.stock ? "" : "stock-out"}`}><span />{product.stock ? `In stock · ${product.stock} available` : "Currently unavailable"}</div><div className="detail-delivery"><Truck size={18} /><span><b>Complimentary delivery over ₹999</b><small>Estimated delivery in 3–6 business days</small></span></div>
      {Object.keys(product.specifications || {}).length > 0 && <div className="specs"><b>Product details</b>{Object.entries(product.specifications).map(([key, value]) => <div key={key}><span>{key}</span><span>{value}</span></div>)}</div>}
      <div className="detail-actions"><div className="quantity-picker"><button disabled={quantity <= 1} aria-label="Decrease quantity" onClick={() => setQuantity((number) => number - 1)}>−</button><span>{quantity}</span><button disabled={quantity >= product.stock} aria-label="Increase quantity" onClick={() => setQuantity((number) => number + 1)}>+</button></div><button className="button button-dark" disabled={!product.stock} onClick={async () => { try { await addToCart(product, quantity); } catch (requestError) { notify(requestError.message || apiError(requestError)); } }}><ShoppingCart size={17} /> Add to cart</button><button className="button button-outline buy-now" disabled={!product.stock} onClick={buyNow}>Buy now</button><button className={`button icon-outline ${liked ? "is-liked" : ""}`} aria-label="Toggle wishlist" onClick={() => toggleWishlist(product).catch((error) => notify(apiError(error)))}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button></div>
      <div className="policy-row"><span><ShieldCheck size={16} /> Secure shopping</span><span><PackageCheck size={16} /> Easy returns</span></div>
    </div></div>
    <section className="reviews-section"><SectionTitle eyebrow={`${reviews.length} voices`} title="What people are saying" /><div className="review-layout"><div className="review-list">{reviews.length ? reviews.map((review) => <article className="review-card" key={review.id}><div className="review-head"><b>{review.reviewer}</b><Rating value={review.rating} /></div><h4>{review.title}{review.is_demo && <span className="sample-label">Sample</span>}</h4><p>{review.body}</p><small>{new Date(review.created_at).toLocaleDateString("en-IN")}</small></article>) : <div className="empty-inline">No reviews yet. Be the first to share your experience.</div>}</div>
      <form className="review-form" onSubmit={submitReview}><h3>Share your thoughts</h3>{user ? <><label>Your rating<select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}</select></label><label>Review title<input required maxLength="120" value={reviewForm.title} onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })} /></label><label>Your review<textarea required maxLength="2000" rows="4" value={reviewForm.body} onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })} /></label><button className="button button-dark">Submit review</button></> : <p><Link to="/login">Sign in</Link> to leave a review. Demonstration reviews are labelled as samples.</p>}</form></div></section>
    <section className="recent-section"><SectionTitle eyebrow="More to discover" title="You might also like" /><ProductGrid products={related} compact /></section>
  </main>;
}

function CartPage() {
  const { cart, setQuantity, removeFromCart, user, notify } = useShop();
  const navigate = useNavigate();
  if (!cart.items.length) return <main className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Your cart</span></div><div className="empty-state cart-empty"><ShoppingCart size={38} /><h1>Your basket is taking a breather</h1><p>It’s a good time to discover something you’ll love.</p><Link className="button button-dark" to="/products">Continue exploring <ArrowRight size={16} /></Link></div></main>;
  return <main className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Your cart</span></div><div className="page-heading"><div><span className="eyebrow">Good choices</span><h1>Your shopping cart <small>({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)</small></h1></div><Link to="/products">Continue shopping <ArrowRight size={15} /></Link></div>
    <div className="cart-layout"><section className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.id}><Link to={`/products/${item.product.slug}`} className="cart-item-image"><ProductImage product={item.product} /></Link><div className="cart-item-info"><Link className="product-brand" to={`/products/${item.product.slug}`}>{item.product.brand?.name}</Link><Link className="cart-item-name" to={`/products/${item.product.slug}`}>{item.product.name}</Link><span className="cart-stock">{item.product.stock ? "In stock" : "Out of stock"}</span><div className="cart-item-controls"><div className="quantity-picker"><button aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => setQuantity(item, item.quantity - 1).catch((error) => notify(apiError(error)))}>−</button><span>{item.quantity}</span><button aria-label="Increase quantity" disabled={item.quantity >= item.product.stock} onClick={() => setQuantity(item, item.quantity + 1).catch((error) => notify(apiError(error)))}>+</button></div><button className="text-button" onClick={() => removeFromCart(item).catch((error) => notify(apiError(error)))}>Remove</button></div></div><b className="cart-line-price">{money(Number(item.product.price) * item.quantity)}</b></article>)}</section>
      <aside className="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(cart.subtotal)}</b></div><div><span>Estimated delivery</span><b>{cart.shipping === 0 ? <span className="free-label">FREE</span> : money(cart.shipping)}</b></div><p className="shipping-hint">{cart.subtotal < 999 ? `Add ${money(999 - cart.subtotal)} more for free delivery.` : "You’ve unlocked complimentary delivery."}</p><div className="summary-total"><span>Estimated total</span><b>{money(cart.total)}</b></div><button className="button button-dark full-button" onClick={() => user ? navigate("/checkout") : navigate("/login?next=checkout")}>Continue to checkout <ArrowRight size={16} /></button><div className="summary-security"><ShieldCheck size={16} /> Secure checkout · Demo payments only</div></aside></div>
  </main>;
}

function AuthPage({ mode }) {
  const { login, register, notify } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") await register(form);
      else await login(form.username, form.password);
      notify(mode === "register" ? "Your ShopSphere account is ready" : "Welcome back");
      navigate(searchParams.get("next") === "checkout" ? "/checkout" : "/account", { replace: true });
    } catch (error) { notify(apiError(error)); }
    finally { setLoading(false); }
  };
  return <main className="auth-page"><div className="auth-art"><span className="auth-art-mark"><ShoppingBag size={22} /> ShopSphere</span><div><span className="eyebrow">A better kind of everyday</span><h1>Good things<br />are waiting.</h1><p>Sign in to pick up where you left off, or create an account to make your shopping experience yours.</p><span className="auth-perk"><BadgeCheck size={16} /> One place for your favourite finds</span></div><span className="auth-art-bottom">Curated with care. Made for you.</span></div><div className="auth-panel"><div className="auth-form-wrap"><Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to ShopSphere</Link><span className="eyebrow">{mode === "register" ? "Let's get you started" : "Lovely to see you again"}</span><h2>{mode === "register" ? "Create your account" : "Welcome back"}</h2><p>{mode === "register" ? "A few details and you're all set." : "Sign in to manage your orders and saved finds."}</p><form onSubmit={submit} className="form-stack">
    {mode === "register" && <div className="form-split"><label>First name<input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} autoComplete="given-name" /></label><label>Last name<input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} autoComplete="family-name" /></label></div>}
    <label>Username<input required autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
    {mode === "register" && <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>}
    <label>Password<input required type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{mode === "register" && <small>Use at least 8 characters.</small>}</label>
    <button className="button button-dark full-button" disabled={loading}>{loading ? "One moment..." : mode === "register" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button></form><div className="auth-switch">{mode === "register" ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New to ShopSphere? <Link to="/register">Create an account</Link></>}</div><div className="demo-security"><ShieldCheck size={16} /> Your password is securely handled by ShopSphere.</div></div></div></main>;
}

const blankAddress = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false };
function AddressFields({ value, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });
  return <div className="address-fields"><label>Full name<input required value={value.full_name} onChange={(e) => set("full_name", e.target.value)} /></label><label>Phone<input required type="tel" value={value.phone} onChange={(e) => set("phone", e.target.value)} /></label><label className="address-wide">Address line 1<input required value={value.line1} onChange={(e) => set("line1", e.target.value)} /></label><label className="address-wide">Address line 2 <span className="optional">(optional)</span><input value={value.line2} onChange={(e) => set("line2", e.target.value)} /></label><label>City<input required value={value.city} onChange={(e) => set("city", e.target.value)} /></label><label>State<input required value={value.state} onChange={(e) => set("state", e.target.value)} /></label><label>Postal code<input required value={value.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></label><label>Country<input required value={value.country} onChange={(e) => set("country", e.target.value)} /></label><label className="address-default address-wide"><input type="checkbox" checked={Boolean(value.is_default)} onChange={(e) => set("is_default", e.target.checked)} /> Set as default delivery address</label></div>;
}

function CheckoutPage() {
  const { cart, user, refreshCart, notify } = useShop();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [address, setAddress] = useState(blankAddress);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!user) { navigate("/login?next=checkout"); return; }
    Promise.all([api.get("/addresses/"), refreshCart()]).then(([response]) => {
      const savedAddresses = response.data.results || response.data;
      setAddresses(savedAddresses);
      const primary = savedAddresses.find((item) => item.is_default) || savedAddresses[0];
      if (primary) setSelected(String(primary.id)); else setAddingAddress(true);
    }).catch((error) => notify(apiError(error))).finally(() => setLoading(false));
  }, [user]);
  const addAddress = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/addresses/", address);
      setAddresses((current) => [...current.map((item) => data.is_default ? { ...item, is_default: false } : item), data]);
      setSelected(String(data.id));
      setAddingAddress(false);
      setAddress(blankAddress);
    } catch (error) { notify(apiError(error)); }
  };
  const placeOrder = async () => {
    if (!selected) { notify("Please choose a delivery address."); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders/", {
        address_id: Number(selected),
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
      });
      await refreshCart();
      navigate(`/order-confirmation/${data.id}`, { state: { order: data } });
    } catch (error) { notify(apiError(error)); }
    finally { setSubmitting(false); }
  };
  if (loading) return <main className="container page-wrap"><ProductSkeleton /></main>;
  if (!cart.items.length) return <Navigate to="/cart" replace />;
  const deliveryCharge = shippingMethod === "express" ? 149 : Number(cart.shipping);
  return <main className="container page-wrap checkout-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><Link to="/cart">Cart</Link><ChevronRight size={14} /><span>Checkout</span></div><div className="page-heading"><div><span className="eyebrow">Almost there</span><h1>Complete your order</h1></div></div><div className="checkout-steps"><span className="step-active"><i>1</i> Delivery</span><span><i>2</i> Review</span><span><i>3</i> Shipping</span><span><i>4</i> Payment</span></div>
    <div className="checkout-layout"><div className="checkout-main"><section className="checkout-card"><div className="checkout-section-title"><span className="step-number">1</span><div><h2>Delivery address</h2><p>Where should we send your order?</p></div></div>{addresses.length > 0 && <div className="address-list">{addresses.map((item) => <label className={`address-option ${String(item.id) === selected ? "address-selected" : ""}`} key={item.id}><input type="radio" name="address" checked={String(item.id) === selected} onChange={() => { setSelected(String(item.id)); setAddingAddress(false); }} /><span><b>{item.full_name}</b><span>{item.line1}{item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state} {item.postal_code}</span><span>{item.phone}</span></span>{item.is_default && <small>Default</small>}</label>)}</div>}
      {!addingAddress && <button className="button button-outline button-small" onClick={() => setAddingAddress(true)}>+ Add a new address</button>}
      {addingAddress && <form onSubmit={addAddress} className="address-form"><AddressFields value={address} onChange={setAddress} /><div className="inline-actions"><button className="button button-dark button-small">Save address</button>{addresses.length > 0 && <button type="button" className="text-button" onClick={() => setAddingAddress(false)}>Cancel</button>}</div></form>}
    </section><section className="checkout-card"><div className="checkout-section-title"><span className="step-number">2</span><div><h2>Review your items</h2><p>{cart.items.length} products in your order</p></div></div>{cart.items.map((item) => <div className="checkout-item" key={item.id}><ProductImage product={item.product} /><span><b>{item.product.name}</b><small>Quantity: {item.quantity}</small></span><b>{money(Number(item.product.price) * item.quantity)}</b></div>)}</section>
        <section className="checkout-card"><div className="checkout-section-title"><span className="step-number">3</span><div><h2>Delivery speed</h2><p>Choose the service that works for you</p></div></div><div className="payment-options"><label className={shippingMethod === "standard" ? "payment-selected" : ""}><input type="radio" name="shipping" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} /><span><b>Standard delivery · 3–6 days</b><small>{cart.shipping === 0 ? "Complimentary" : money(cart.shipping)}</small></span></label><label className={shippingMethod === "express" ? "payment-selected" : ""}><input type="radio" name="shipping" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} /><span><b>Express delivery · 1–2 days</b><small>{money(149)} · Demo estimate</small></span></label></div></section>
        <section className="checkout-card"><div className="checkout-section-title"><span className="step-number">4</span><div><h2>Payment method</h2><p>Choose how you would like to pay</p></div></div><div className="payment-options"><label className={paymentMethod === "cod" ? "payment-selected" : ""}><input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /><span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span></label><label className={paymentMethod === "demo_card" ? "payment-selected" : ""}><input type="radio" name="payment" value="demo_card" checked={paymentMethod === "demo_card"} onChange={() => setPaymentMethod("demo_card")} /><span><b>Demo card payment</b><small>Simulated only — no card details requested</small></span></label></div><p className="demo-warning"><ShieldCheck size={16} /> This demonstration does not process a real payment.</p></section></div>
        <aside className="order-summary checkout-summary"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(cart.subtotal)}</b></div><div><span>{shippingMethod === "express" ? "Express delivery" : "Standard delivery"}</span><b>{deliveryCharge === 0 ? <span className="free-label">FREE</span> : money(deliveryCharge)}</b></div><div className="summary-total"><span>Total (INR)</span><b>{money(Number(cart.subtotal) + deliveryCharge)}</b></div><button className="button button-dark full-button" disabled={submitting || !selected} onClick={placeOrder}>{submitting ? "Placing your order..." : "Place your order"} <ArrowRight size={16} /></button><p className="checkout-terms">By placing your order, you agree to our <Link to="/info/terms">terms</Link>. Payment is simulated for demo purposes.</p></aside></div>
  </main>;
}

function AccountPage() {
  const { user, logout, notify } = useShop();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState(blankAddress);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  useEffect(() => {
    if (!user) return;
    Promise.all([api.get("/orders/"), api.get("/addresses/")]).then(([orderResponse, addressResponse]) => {
      setOrders(orderResponse.data.results || orderResponse.data);
      setAddresses(addressResponse.data.results || addressResponse.data);
    }).catch((error) => notify(apiError(error))).finally(() => setLoading(false));
  }, [user]);
  if (!user) return <Navigate to="/login" replace />;
  const addAddress = async (event) => {
    event.preventDefault();
    try {
      const { data } = editingId
        ? await api.patch(`/addresses/${editingId}/`, address)
        : await api.post("/addresses/", address);
      setAddresses((current) => {
        const normalized = data.is_default
          ? current.map((item) => ({ ...item, is_default: false }))
          : current;
        return editingId
          ? normalized.map((item) => item.id === editingId ? data : item)
          : [data, ...normalized];
      });
      setAdding(false);
      setEditingId(null);
      setAddress(blankAddress);
      notify(editingId ? "Address updated" : "Address saved");
    } catch (error) { notify(apiError(error)); }
  };
  const editAddress = (item) => {
    setAddress({ ...item });
    setEditingId(item.id);
    setAdding(true);
    setTab("addresses");
  };
  const deleteAddress = async (id) => {
    try {
      await api.delete(`/addresses/${id}/`);
      setAddresses((current) => current.filter((item) => item.id !== id));
      if (editingId === id) { setEditingId(null); setAdding(false); setAddress(blankAddress); }
    }
    catch (error) { notify(apiError(error)); }
  };
  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order? Its items will be returned to stock.")) return;
    try {
      const { data } = await api.post(`/orders/${id}/cancel/`);
      setOrders((current) => current.map((order) => order.id === id ? data : order));
      notify("Your order has been cancelled");
    } catch (error) { notify(apiError(error)); }
  };
  return <main className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Your account</span></div><div className="account-welcome"><div className="account-avatar">{(user.first_name || user.username).slice(0, 1).toUpperCase()}</div><div><span className="eyebrow">Your ShopSphere</span><h1>Hello, {user.first_name || user.username}</h1><p>Manage your orders, addresses and account details.</p></div><button className="button button-outline button-small" onClick={logout}>Sign out</button></div>
    <div className="account-layout"><aside className="account-menu"><button className={tab === "orders" ? "tab-active" : ""} onClick={() => setTab("orders")}><PackageCheck size={17} /> Orders</button><button className={tab === "addresses" ? "tab-active" : ""} onClick={() => setTab("addresses")}><MapPin size={17} /> Addresses</button><Link to="/wishlist"><Heart size={17} /> Wishlist</Link><div className="account-profile"><small>ACCOUNT EMAIL</small><b>{user.email}</b></div></aside><section className="account-content"><div className="account-content-head"><div><span className="eyebrow">Your account</span><h2>{tab === "orders" ? "Order history" : "Saved addresses"}</h2></div>{tab === "addresses" && <button className="button button-dark button-small" onClick={() => setAdding(true)}>+ Add address</button>}</div>
      {loading ? <ProductSkeleton /> : tab === "orders" ? orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><span><small>ORDER REFERENCE</small><b>{order.reference}</b></span><span><small>PLACED</small><b>{new Date(order.created_at).toLocaleDateString("en-IN")}</b></span><div className="order-card-actions"><span className={`status-pill status-${order.status}`}>{order.status}</span>{["pending", "confirmed"].includes(order.status) && <button className="text-button" onClick={() => cancelOrder(order.id)}>Cancel order</button>}</div></div><div className="order-card-items">{order.items.map((item, index) => <div key={index}><span>{item.product_name} <small>× {item.quantity}</small></span><b>{money(item.unit_price * item.quantity)}</b></div>)}</div><div className="order-card-total"><span>{order.payment_method === "demo_card" ? "Demo payment · not processed" : "Cash on Delivery"}</span><b>Total {money(order.total)}</b></div></article>)}</div> : <div className="empty-inline">No orders yet. Your next favourite is waiting. <Link to="/products">Explore the shop</Link></div> : <div className="address-manager">{addresses.length === 0 && !adding && <div className="empty-inline">You haven't saved a delivery address yet.</div>}{addresses.map((item) => <article className="saved-address" key={item.id}><div><b>{item.full_name} {item.is_default && <span className="default-tag">Default</span>}</b><p>{item.line1}{item.line2 ? `, ${item.line2}` : ""}<br />{item.city}, {item.state} {item.postal_code}<br />{item.country} · {item.phone}</p></div><div className="saved-address-actions"><button className="text-button" onClick={() => editAddress(item)}>Edit</button><button className="text-button" onClick={() => deleteAddress(item.id)}>Remove</button></div></article>)}{adding && <form onSubmit={addAddress} className="address-form"><h3>{editingId ? "Edit delivery address" : "New delivery address"}</h3><AddressFields value={address} onChange={setAddress} /><div className="inline-actions"><button className="button button-dark button-small">{editingId ? "Save changes" : "Save address"}</button><button type="button" className="text-button" onClick={() => { setAdding(false); setEditingId(null); setAddress(blankAddress); }}>Cancel</button></div></form>}</div>}
    </section></div>
  </main>;
}

function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, notify } = useShop();
  const [movingId, setMovingId] = useState(null);
  const items = wishlist.map((item) => item.product || item).filter((product) => product?.id);
  const moveToCart = async (product) => {
    setMovingId(product.id);
    try {
      await addToCart(product);
      await toggleWishlist(product);
    } catch (error) { notify(error.message || apiError(error)); }
    finally { setMovingId(null); }
  };
  return <main className="container page-wrap">
    <div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>Your wishlist</span></div>
    <div className="page-heading"><div><span className="eyebrow">Saved for later</span><h1>Your wishlist <small>({items.length})</small></h1></div></div>
    {items.length ? <div className="product-grid">{items.map((product) => <div key={product.id} className="wishlist-wrap">
      <ProductCard product={product} />
      <div className="wishlist-actions">
        <button className="text-button" disabled={movingId === product.id} onClick={() => moveToCart(product)}>{movingId === product.id ? "Moving..." : "Move to cart"}</button>
        <button className="text-button" onClick={() => toggleWishlist(product).catch((error) => notify(apiError(error)))}>Remove</button>
      </div>
    </div>)}</div> : <div className="empty-state"><Heart size={34} /><h2>Keep the good ones close</h2><p>Tap the heart on anything you love and it’ll be waiting here.</p><Link to="/products" className="button button-dark">Explore the collection</Link></div>}
  </main>;
}

function OrderConfirmationPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { notify } = useShop();
  const [order, setOrder] = useState(null);
  useEffect(() => {
    api.get(`/orders/${id}/`).then(({ data }) => setOrder(data)).catch((error) => notify(apiError(error)));
  }, [id]);
  const result = order || state?.order;
  return <main className="container page-wrap confirmation-page"><div className="confirmation-icon"><Check size={34} /></div><span className="eyebrow">Order received</span><h1>Thank you. It’s in good hands.</h1><p>Your ShopSphere order has been created successfully. This is a demo store; payment has not been processed.</p>{result && <div className="confirmation-card"><span>ORDER REFERENCE</span><b>{result.reference}</b><div><span>Order total</span><b>{money(result.total)}</b></div><div><span>Payment</span><b>{result.payment_method === "cod" ? "Cash on Delivery" : "Demo card · not processed"}</b></div></div>}<div className="confirmation-actions"><Link className="button button-dark" to="/account">View your orders</Link><Link className="button button-outline" to="/products">Keep exploring</Link></div></main>;
}

function InfoPage() {
  const { slug } = useParams();
  const content = {
    about: ["A little about ShopSphere", "ShopSphere is an original e-commerce demonstration built around thoughtful discovery and a straightforward shopping experience."],
    shipping: ["Shipping information", "Delivery estimates shown in this demo are illustrative. Complimentary delivery is applied to orders of ₹999 or more; other orders show an estimated ₹49 delivery charge."],
    returns: ["Returns & refunds", "This demo does not initiate real shipments or refunds. In a live store, review the seller’s return eligibility and support details before placing an order."],
    contact: ["Contact support", "For this demonstration, contact support is a placeholder. No real customer support service is connected."],
    privacy: ["Privacy policy", "This local demo stores anonymous cart, wishlist, and recently viewed product IDs in your browser. Account and order data is stored by the local Django API. Do not enter sensitive personal or payment information."],
    terms: ["Terms of use", "ShopSphere is a demonstration storefront. Prices, shipping, inventory, delivery estimates, and payment options are provided for demonstration only. No payment is processed."],
  };
  const [title, body] = content[slug] || ["Information", "This information page is part of the ShopSphere demonstration."];
  return <main className="container page-wrap info-page"><div className="breadcrumbs"><Link to="/">Home</Link><ChevronRight size={14} /><span>{title}</span></div><span className="eyebrow">The ShopSphere guide</span><h1>{title}</h1><p>{body}</p><Link to="/products" className="button button-dark">Back to shopping <ArrowRight size={16} /></Link></main>;
}

function Toast() {
  const { toast } = useShop();
  return toast ? <div className="toast" role="status"><Check size={17} />{toast}</div> : null;
}

export default function App() {
  return <><Header /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/products/:slug" element={<ProductDetailPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
    <Route path="/info/:slug" element={<InfoPage />} />
    <Route path="*" element={<InfoPage />} />
  </Routes><Footer /><Toast /></>;
}
