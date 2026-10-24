import { useState } from "react";
import {
  House,
  LibraryBig,
  ShoppingBag,
  Trophy,
  Settings,
} from "lucide-react";

import logo from "../../assets/letters/sidebarlogo.png";

const navigation = [
  { name: "Home", icon: House },
  { name: "Library", icon: LibraryBig },
  { name: "Shop", icon: ShoppingBag },
  { name: "Leaderboards", icon: Trophy },
  { name: "Settings", icon: Settings },
];

export default function SidebarPreview() {
  const [active, setActive] = useState("Home");

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0a0a0a] font-bricolage text-white">

      {/* Remix sidebar */}
      <aside className="flex h-full w-16 shrink-0 flex-col items-center border-r border-white/10 bg-gray-500/5 backdrop-blur-lg backdrop-saturate-100 backdrop-contrast-100 px-3 py-4">

        <img
          src={logo}
          alt="Remix"
          draggable={false}
          className="mb-5 h-8 w-8 object-contain"
        />

        <nav className="flex flex-col gap-[12px]">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => setActive(name)}
              className={`flex h-10 w-10 items-center justify-center border-none bg-transparent transition-colors duration-200 ${
                active === name
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Icon size={16} strokeWidth={1.65} />
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="mt-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#181818]"
          title="Profile"
        >
          <img
            src="https://fortnite-api.com/images/cosmetics/br/CID_001_Athena_Commando_F_Default/icon.png"
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </button>
      </aside>

      {/* Empty canvas for you to design next */}
      <main className="flex-1 bg-[#0a0a0a]" />
    </div>
  );
}
