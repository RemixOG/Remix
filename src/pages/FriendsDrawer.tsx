import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Users, X } from "lucide-react";

type Friend = {
  id: string;
  name: string;
  discord: string;
  outfit: string;
  image: string;
  stats: {
    wins: number;
    matches: number;
    eliminations: number;
  };
};

const friends: Friend[] = [
  {
    id: "friend-1",
    name: "ikari",
    discord: "@ikari",
    outfit: "Peely",
    image:
      "https://fortnite-api.com/images/cosmetics/br/CID_175_Athena_Commando_M_Banana/icon.png",
    stats: { wins: 47, matches: 305, eliminations: 1192 },
  },
  {
    id: "friend-2",
    name: "aeris",
    discord: "@aeris.exe",
    outfit: "Drift",
    image:
      "https://fortnite-api.com/images/cosmetics/br/CID_150_Athena_Commando_M_Drift/icon.png",
    stats: { wins: 28, matches: 181, eliminations: 764 },
  },
  {
    id: "friend-3",
    name: "haze",
    discord: "@haze.jpg",
    outfit: "Aura",
    image:
      "https://fortnite-api.com/images/cosmetics/br/CID_397_Athena_Commando_F_TreasureHunterFashion/icon.png",
    stats: { wins: 64, matches: 412, eliminations: 1685 },
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function FriendsDrawer({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Friend | null>(null);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selected, onClose]);

  if (!open) return null;

  return (
    <aside className="remix-friends-drawer" aria-label="friends">
      <header className="remix-friends-header">
        {selected ? (
          <button
            className="remix-friends-icon"
            onClick={() => setSelected(null)}
            aria-label="back to friends"
          >
            <ArrowLeft size={17} />
          </button>
        ) : (
          <Users size={17} />
        )}

        <h2>{selected ? "profile" : "friends"}</h2>

        <button
          className="remix-friends-icon remix-friends-close"
          onClick={onClose}
          aria-label="close friends"
        >
          <X size={17} />
        </button>
      </header>

      {!selected ? (
        <>
          <p className="remix-friends-description">
            {friends.length} added · preview
          </p>

          <div className="remix-friends-list">
            {friends.map(friend => (
              <button
                key={friend.id}
                className="remix-friend-row"
                onClick={() => setSelected(friend)}
              >
                <div className="remix-friend-avatar">
                  <img
                    src={friend.image}
                    alt={friend.outfit}
                    onError={event => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="remix-friend-identity">
                  <strong>{friend.name}</strong>
                  <span>{friend.discord}</span>
                </div>

                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="remix-friend-profile">
          <div className="remix-friend-profile-avatar">
            <img src={selected.image} alt={selected.outfit} />
          </div>

          <h3>{selected.name}</h3>
          <p>{selected.discord}</p>
          <span className="remix-friend-outfit">
            {selected.outfit}
          </span>

          <div className="remix-friend-stats">
            <div>
              <span>wins</span>
              <strong>{selected.stats.wins}</strong>
            </div>
            <div>
              <span>matches</span>
              <strong>{selected.stats.matches}</strong>
            </div>
            <div>
              <span>eliminations</span>
              <strong>{selected.stats.eliminations.toLocaleString()}</strong>
            </div>
          </div>

          <p className="remix-friends-disclaimer">
            sample statistics · backend not connected
          </p>
        </div>
      )}
    </aside>
  );
}
