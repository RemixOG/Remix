import { useEffect, useRef, useState } from "react";
import {
  House, LibraryBig, ShoppingBag, Trophy, Settings,
  Users, ChevronRight, X, Minus,
  ArrowLeft, Play, Trash2
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import logo from "../assets/letters/sidebarlogo.png";
import heroLogo from "../assets/remix-hero-logo.png";
import heroImage from "../assets/juice-wrld-hero.png";
import buildArtwork from "../assets/chapter-2-remix-build.jpg";

import "./remix-dashboard.css";
import "./remix-pages.css";

type Page = "home" | "library" | "shop" | "leaderboards" | "settings";

type Cosmetic = {
  id: string;
  name: string;
  image: string;
  detail?: string;
  price?: number;
};

type Friend = {
  id: string;
  name: string;
  discord: string;
  skin: string;
  skinId: string;
  wins: number;
  matches: number;
  eliminations: number;
};

const friends: Friend[] = [
  {
    id: "self",
    name: "endorphins",
    discord: "@endorphins",
    skin: "Lara Croft",
    skinId: "remix-endorphins",
    wins: 0,
    matches: 0,
    eliminations: 0
  },
  {
    id: "1", name: "flamingo", discord: "@flamingo",
    skin: "Arcane Jinx", skinId: "remix-flamingo",
    wins: 47, matches: 305, eliminations: 1192
  },
  {
    id: "2", name: "ahere", discord: "@ahere",
    skin: "Drift", skinId: "CID_150_Athena_Commando_M_Drift",
    wins: 28, matches: 181, eliminations: 764
  },
  {
    id: "3", name: "mayvr", discord: "@mayvr",
    skin: "Aura", skinId: "CID_397_Athena_Commando_F_TreasureHunterFashion",
    wins: 64, matches: 412, eliminations: 1685
  }
];

const navigation = [
  { id: "home", label: "home", Icon: House },
  { id: "library", label: "library", Icon: LibraryBig },
  { id: "shop", label: "shop", Icon: ShoppingBag },
  { id: "leaderboards", label: "leaderboards", Icon: Trophy },
  { id: "settings", label: "settings", Icon: Settings }
] as const;

function skinImage(id: string) {
  const avatars: Record<string, string> = {
    "remix-endorphins": "/friends/endorphins.png",
    "remix-flamingo": "/friends/flamingo.png",
    "CID_175_Athena_Commando_M_Banana": "/friends/flamingo.png",
    "CID_150_Athena_Commando_M_Drift": "/friends/ahere.png",
    "CID_397_Athena_Commando_F_TreasureHunterFashion": "/friends/mayvr.png"
  };

  return avatars[id] || "/friends/endorphins.png";
}

function CosmeticCard({ item }: { item: Cosmetic }) {
  return (
    <article className="rp-cosmetic rp-shop-tile">
      <div className="rp-cosmetic-art">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="rp-shop-tile-gradient"/>
        <div className="rp-shop-tile-details">
          <strong title={item.name}>{item.name}</strong>
          
          <span className="rp-vbucks-price">
            {typeof item.price === "number" ? (
              <>
                <img
                  src="/remix-shop/vbucks.png"
                  alt="V-Bucks"
                  className="rp-vbucks-icon"
                  draggable={false}
                />
                {item.price.toLocaleString()}
              </>
            ) : (
              item.detail === "battle pass"
                ? "battle pass"
                : "price unavailable"
            )}
          </span>
        </div>
      </div>
    </article>
  );
}


const remixShopItems: Cosmetic[] = [
  {
    "id": "Character_GoldCat_Claw",
    "name": "Meowdas",
    "image": "/remix-shop/meowdas.png",
    "detail": "battle pass"
  },
  {
    "id": "Character_StageCue_Chalk",
    "name": "1-Ball",
    "image": "/remix-shop/1-ball.png",
    "detail": "battle pass"
  },
  {
    "id": "Character_DenimEquip_Stock",
    "name": "Undercover Skye",
    "image": "/remix-shop/undercover-skye.png",
    "detail": "battle pass"
  },
  {
    "id": "Character_MissusMind_Suit",
    "name": "Chaos Director",
    "image": "/remix-shop/chaos-director.png",
    "detail": "battle pass"
  },
  {
    "id": "Character_BoomShot_Blam",
    "name": "Dynamo TNTina",
    "image": "/remix-shop/dynamo-tntina.png",
    "detail": "battle pass"
  },
  {
    "id": "Character_KelpLinenCalcium",
    "name": "Juice WRLD",
    "image": "/remix-shop/juice-wrld.png",
    "detail": "chapter 2 remix"
  },
  {
    "id": "Character_KelpLinenMagnesium",
    "name": "Slayer Juice WRLD",
    "image": "/remix-shop/slayer-juice-wrld.png",
    "detail": "chapter 2 remix"
  },
  {
    "id": "Character_ClayPlug",
    "name": "Rap Boy Reloaded",
    "image": "/remix-shop/rap-boy-reloaded.png",
    "detail": "chapter 2 remix"
  },
  {
    "id": "Character_LemonCartGranite",
    "name": "Snoop Dogg",
    "image": "/remix-shop/snoop-dogg.png",
    "detail": "chapter 2 remix"
  }
];

function ShopStrip({ compact = false }: { compact?: boolean }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = track.current;
    if (!element) return;

    let position = element.scrollLeft;
    let target = position;
    let frame = 0;

    const animate = () => {
      position += (target - position) * 0.12;

      if (Math.abs(target - position) < 0.4) {
        position = target;
      }

      element.scrollLeft = position;

      if (Math.abs(target - position) > 0.4) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const wheel = (event: WheelEvent) => {
      const max = element.scrollWidth - element.clientWidth;
      if (max <= 0) return;

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        cancelAnimationFrame(frame);
        frame = 0;
        position = element.scrollLeft;
        target = position;
        return;
      }

      const multiplier =
        event.deltaMode === 1 ? 30 :
        event.deltaMode === 2 ? element.clientWidth : 1;

      target = Math.max(
        0,
        Math.min(max, target + event.deltaY * multiplier)
      );

      event.preventDefault();

      if (!frame) {
        position = element.scrollLeft;
        frame = requestAnimationFrame(animate);
      }
    };

    element.addEventListener("wheel", wheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("wheel", wheel);
    };
  }, []);

  return (
    <section
      className={`rp-surface rp-shop rp-new-shop ${compact ? "rp-shop-compact" : ""}`}
    >
      

      <div className="rp-item-track" ref={track}>
        {remixShopItems.map(item => (
          <CosmeticCard key={item.id} item={item}/>
        ))}
      </div>
    </section>
  );
}

function LibraryPage() {
  const [expanded, setExpanded] = useState(false);
  const [buildAdded, setBuildAdded] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addBuild = () => {
    setBuildAdded(true);

    setConfirmDelete(false);
  };

  const removeBuild = () => {
    setBuildAdded(false);

    setConfirmDelete(false);
  };

  return (
    <div className="rp-page rp-page-enter rp-library-page">
      <div className="rp-page-heading">
        <h1>library</h1>
        <p>manage your game installations</p>
      </div>

      <button
        className={`rp-build-section ${expanded ? "rp-build-expanded" : ""}`}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className="rp-build-section-symbol">
          <LibraryBig size={19} strokeWidth={1.6}/>
        </span>
        <span className="rp-build-section-label">
          <strong>game installations</strong>
          <small>manage your local fortnite builds</small>
        </span>
        <ChevronRight size={17} className="rp-build-chevron"/>
      </button>

      {expanded && (
        <div className="rp-build-area rp-build-area-enter">
          {!buildAdded ? (
            <button className="rp-add-build" onClick={addBuild}>
              <span className="rp-add-symbol">+</span>
              <strong>add build</strong>
              <small>add a fortnite installation</small>
            </button>
          ) : (
            <div className="rp-build-card rp-build-card-enter">
              <img src={buildArtwork} alt="Chapter 2 Remix" draggable={false}/>
              <div className="rp-build-card-gradient"/>

              <div className="rp-build-card-info">
                <h2>Chapter 2 Remix</h2>
                </div>

              <div className="rp-build-card-controls">
                <button className="rp-build-play" disabled
                  title="connect an installation first">
                  <Play size={16} fill="currentColor"/>
                  <span>play</span>
                </button>
                
                <button title="remove build"
                  aria-label="remove build"
                  onClick={() => {
                    setConfirmDelete(true);

                  }}>
                  <Trash2 size={17}/>
                </button>
              </div>
            </div>
          )}

          

          {buildAdded && confirmDelete && (
            <div className="rp-build-detail rp-build-area-enter">
              <strong>remove chapter 2 remix?</strong>
              <p>this only removes the placeholder card. No game files
              will be deleted.</p>
              <div className="rp-build-confirm">
                <button onClick={() => setConfirmDelete(false)}>cancel</button>
                <button onClick={removeBuild}>remove build</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FriendsPanel({
  open,
  onClose,
  onExited
}: {
  open: boolean;
  onClose: () => void;
  onExited: () => void;
}) {
  const [selected, setSelected] = useState<Friend | null>(null);

  return (
    <aside
      className={`rp-friends ${open ? "rp-friends-enter" : "rp-friends-exit"}`}
      aria-label="friends panel"
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && !open) onExited();
      }}
    >
      <div className="rp-section-heading">
        <div className="rp-friends-title">
          {selected && <button
            className="rp-icon"
            onClick={() => setSelected(null)}
            aria-label="back"
          ><ArrowLeft size={17} /></button>}
          <h2>{selected ? "profile" : "friends"}</h2>
        </div>
        <button className="rp-icon" onClick={onClose} aria-label="close">
          <X size={17} />
        </button>
      </div>

      {!selected ? <>
        <p className="rp-friends-subtitle">{friends.length} profiles · sample stats</p>
        {friends.map(friend => (
          <button
            key={friend.id}
            className="rp-friend-row"
            onClick={() => setSelected(friend)}
          >
            <img src={skinImage(friend.skinId)}
              loading="lazy" decoding="async"
              alt={friend.skin} />
            <div>
              <strong>{friend.name}</strong>
              <span>{friend.discord}</span>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </> : (
        <div className="rp-profile">
          <img src={skinImage(selected.skinId)} alt={selected.skin}/>
          <h2>{selected.name}</h2>
          <p>{selected.discord}</p>
          <span>{selected.skin}</span>

          <div className="rp-stats">
            {([
              ["wins", selected.wins],
              ["matches", selected.matches],
              ["eliminations", selected.eliminations]
            ] as const).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <p className="rp-note">
            sample stats · epic account and backend not connected
          </p>
        </div>
      )}
    </aside>
  );
}

function LeaderboardsPage() {
  const ranked = [...friends].sort((a, b) => b.wins - a.wins);

  return (
    <div className="rp-page">
      <div className="rp-page-heading">
        <h1>leaderboards</h1>
        <p>community rankings · preview data</p>
      </div>
      <div className="rp-surface rp-leaderboard">
        {ranked.map((friend, index) => (
          <div key={friend.id} className="rp-leaderboard-row">
            <span>{`#${index + 1}`}</span>
            <img src={skinImage(friend.skinId)} alt={friend.skin}
              loading="lazy" decoding="async" />
            <div>
              <strong>{friend.name}</strong>
              <small>{friend.discord}</small>
            </div>
            <strong>{friend.wins} wins</strong>
          </div>
        ))}
      </div>
      <p className="rp-note">
        these rankings are placeholders. real player statistics
        will require verified accounts and a backend.
      </p>
    </div>
  );
}


function SettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactCards, setCompactCards] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const choices = [
    {
      id: "motion",
      label: "reduce motion",
      description: "limit interface animations",
      checked: reducedMotion,
      change: setReducedMotion
    },
    {
      id: "compact",
      label: "compact interface",
      description: "prefer a tighter dashboard layout",
      checked: compactCards,
      change: setCompactCards
    },
    {
      id: "notifications",
      label: "notifications",
      description: "show launcher alerts",
      checked: notifications,
      change: setNotifications
    }
  ];

  return (
    <div className="rp-page rp-page-enter rp-settings-page">
      <div className="rp-page-heading">
        <h1>settings</h1>
        <p>personalize your launcher</p>
      </div>

      <div className="rp-settings-group">
        <h2>preferences</h2>
        <p>configure how remix looks and feels</p>

        <div className="rp-settings-list">
          {choices.map(choice => (
            <label key={choice.id} className="rp-setting-row">
              <span className="rp-setting-copy">
                <strong>{choice.label}</strong>
                <small>{choice.description}</small>
              </span>

              <input
                type="checkbox"
                checked={choice.checked}
                onChange={event => choice.change(event.target.checked)}
                className="rp-switch-input"
              />
              <span className="rp-switch" aria-hidden="true">
                <span className="rp-switch-thumb">
                  
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <p className="rp-note">
        preview preferences are not persisted yet.
      </p>
    </div>
  );
}

export default function RemixDashboard() {
  const [page, setPage] = useState<Page>("home");
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendsMounted, setFriendsMounted] = useState(false);

  const openFriends = () => {
    setFriendsMounted(true);
    setFriendsOpen(true);
  };

  const closeFriends = () => {
    setFriendsOpen(false);
  };

  const win = getCurrentWindow();

  const navigate = (next: Page) => {
    closeFriends();
    setPage(next);
  };

  return (
    <div className="remix-dashboard rp-app">
      <aside className="remix-dashboard-sidebar rp-sidebar">
        <div className="remix-dashboard-navigation">
          <img src={logo} alt="remix" draggable={false}/>
          {navigation.map(({ id, label, Icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              className={page === id ? "selected" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={17} strokeWidth={1.8}/>
            </button>
          ))}
        </div>

        <div className="rp-sidebar-bottom">
          <button
            title="friends"
            aria-label="friends"
            className={friendsOpen ? "rp-friends-active" : ""}
            onClick={() => friendsOpen ? closeFriends() : openFriends()}
          >
            <Users size={17} strokeWidth={1.8}/>
          </button>
          <img
            className="remix-dashboard-avatar"
            src={skinImage("remix-endorphins")}
            alt="profile"
            draggable={false}
          />
        </div>
      </aside>

      <div className="remix-dashboard-content rp-content">
        <header className="remix-dashboard-top">
          <div className="remix-dashboard-drag"
            onMouseDown={e => {
              if (e.button === 0)
                void win.startDragging().catch(console.error);
            }}
          />
          <button aria-label="minimize" onClick={() => void win.minimize()}>
            <Minus size={17}/>
          </button>
          <button aria-label="close" onClick={() => void win.close()}>
            <X size={17}/>
          </button>
        </header>

        {page === "home" && (
          <main className="remix-dashboard-home rp-home">
            <div className="remix-dashboard-heading">
              <h1>welcome to remix.</h1>
              
            </div>

            <section className="remix-dashboard-banner">
              <img src={heroImage} alt="juice wrld fortnite"
                draggable={false}/>
              <div className="remix-dashboard-banner-shade"/>
              <div className="remix-dashboard-banner-copy">
                <img className="remix-hero-logo" src={heroLogo}
                  alt="remix" draggable={false}/>
                
                <button onClick={() => navigate("library")}>
                  view library
                </button>
              </div>
            </section>

            <div className="remix-dashboard-lower rp-home-lower">
              <section className="remix-library-card">
                <div className="remix-library-card-body">
                  <LibraryBig size={22} strokeWidth={1.4}/>
                  <h3>game library</h3>
                  <p>your builds, installations and launch settings.</p>
                </div>
                <button className="remix-library-link"
                  onClick={() => navigate("library")}>
                  view library
                </button>
              </section>

              <ShopStrip compact/>
            </div>
          </main>
        )}

        {page === "library" && <LibraryPage/>}
        {page === "shop" && <div className="rp-page">
          <div className="rp-page-heading">
            <h1>item shop</h1>
            <p>browse current fortnite cosmetics and offers</p>
          </div>
          <ShopStrip/>
        </div>}
        {page === "leaderboards" && <LeaderboardsPage/>}
        {page === "settings" && <SettingsPage/>}
      </div>

      {friendsMounted && (
        <FriendsPanel
          open={friendsOpen}
          onClose={closeFriends}
          onExited={() => setFriendsMounted(false)}
        />
      )}
    </div>
  );
}
