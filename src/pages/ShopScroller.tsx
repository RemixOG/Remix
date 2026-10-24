import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type ShopEntry = {
  offerId?: string;
  devName?: string;
  finalPrice?: number;
  brItems?: Array<{
    id?: string;
    name?: string;
    images?: { icon?: string; featured?: string; smallIcon?: string };
  }>;
  bundle?: { name?: string; image?: string };
  layout?: { name?: string };
  newDisplayAsset?: {
    materialInstances?: Array<{ images?: Array<{ url?: string }> }>;
  };
  displayAssets?: Array<{ url?: string; background?: string }>;
};

type ShopResponse = {
  data?: {
    entries?: ShopEntry[];
    date?: string;
  };
};

type ShopItem = {
  id: string;
  name: string;
  image: string;
  price?: number;
  category: string;
};

function convertEntry(entry: ShopEntry, index: number): ShopItem | null {
  const cosmetic = entry.brItems?.[0];
  const name =
    entry.bundle?.name ||
    cosmetic?.name ||
    entry.devName?.replace(/^\[[^\]]+\]\s*/, "") ||
    "";

  const image =
    entry.newDisplayAsset?.materialInstances?.[0]?.images?.[0]?.url ||
    entry.displayAssets?.[0]?.url ||
    entry.bundle?.image ||
    cosmetic?.images?.featured ||
    cosmetic?.images?.icon ||
    cosmetic?.images?.smallIcon ||
    "";

  if (!name || !image) return null;

  return {
    id: entry.offerId || cosmetic?.id || String(index),
    name,
    image,
    price: typeof entry.finalPrice === "number"
      ? entry.finalPrice
      : undefined,
    category: entry.layout?.name || "ITEM SHOP",
  };
}

export default function ShopScroller() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const track = useRef<HTMLDivElement>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadShop() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "https://fortnite-api.com/v2/shop?language=en",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Shop API returned ${response.status}`);
        }

        const json = (await response.json()) as ShopResponse;
        const entries = json.data?.entries;

        if (!Array.isArray(entries)) {
          throw new Error("Unexpected shop response format");
        }

        const result = entries
          .map(convertEntry)
          .filter((item): item is ShopItem => item !== null);

        // Remove duplicate offers, preserving API ordering.
        const unique = Array.from(
          new Map(result.map(item => [item.id, item])).values()
        );

        if (!unique.length) {
          throw new Error("No displayable items in today's shop");
        }

        setItems(unique);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load shop");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadShop();
    return () => controller.abort();
  }, [reload]);

  function scroll(direction: number) {
    track.current?.scrollBy({
      left: direction * 175 * 2,
      behavior: "smooth",
    });
  }

  return (
    <section className="remix-shop-card">
      <div className="remix-shop-top">
        <div>
          
          <h3>Item Shop</h3>
        </div>

        <div className="remix-shop-actions">
          <button
            onClick={() => setReload(n => n + 1)}
            title="Refresh shop"
            aria-label="Refresh shop"
          >
            <RefreshCw size={15} />
          </button>
          <span className="remix-shop-divider" />
          <button
            onClick={() => scroll(-1)}
            title="Previous items"
            aria-label="Previous items"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => scroll(1)}
            title="Next items"
            aria-label="Next items"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="remix-shop-message">
          Loading today's Item Shop…
        </div>
      ) : error ? (
        <div className="remix-shop-message">
          <span>Couldn't load the live shop.</span>
          <small>{error}</small>
          <button onClick={() => setReload(n => n + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <div className="remix-shop-track" ref={track}>
          {items.map(item => (
            <article key={item.id} className="remix-shop-item">
              <div className="remix-shop-image">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  draggable={false}
                />
              </div>

              <div className="remix-shop-item-info">
                <span className="remix-shop-item-name" title={item.name}>
                  {item.name}
                </span>
                <span className="remix-shop-price">
                  {item.price === undefined
                    ? "—"
                    : `${item.price.toLocaleString()} V-Bucks`}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="remix-shop-footer">
        <span>Current Fortnite Item Shop</span>
        <span>{loading ? "SYNCING" : error ? "UNAVAILABLE" : `${items.length} OFFERS`}</span>
      </div>
    </section>
  );
}
