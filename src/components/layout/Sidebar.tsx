import {
  House,
  Library,
  ShoppingBag,
  Trophy,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_SKIN =
  "CID_001_Athena_Commando_F_Default";

const fallbackAvatar =
  `https://fortnite-api.com/images/cosmetics/br/${DEFAULT_SKIN}/icon.png`;

const navigation = [
  { name: "Home", icon: House },
  { name: "Builds", icon: Library },
  { name: "Shop", icon: ShoppingBag },
  { name: "Leaderboard", icon: Trophy },
  { name: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [avatar, setAvatar] = useState(fallbackAvatar);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `https://fortnite-api.com/v2/cosmetics/br/${DEFAULT_SKIN}`,
      { signal: controller.signal }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Avatar unavailable");
        return response.json();
      })
      .then((json) => {
        const image =
          json.data?.images?.icon ??
          json.data?.images?.smallIcon;

        if (image) setAvatar(image);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <aside className="flex h-full w-[45px] shrink-0 flex-col items-center gap-[5px] border-r border-white/10 bg-[#111111] px-1 py-2">
      <nav className="flex w-full flex-col items-center gap-1">
        {navigation.map(({ name, icon: Icon }, index) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-current={index === 0 ? "page" : undefined}
            className={`flex size-[30px] items-center justify-center rounded-none transition-colors ${
              index === 0
                ? "bg-[#292929] text-white"
                : "text-zinc-500 hover:bg-[#252525] hover:text-white"
            }`}
          >
            <Icon size={17} strokeWidth={1.8} />
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div
          title="Default Recruit"
          className="size-[32px] overflow-hidden rounded-none border border-white/10 bg-[#242424]"
        >
          <img
            src={avatar}
            alt="Default Fortnite Recruit"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>
    </aside>
  );
}
