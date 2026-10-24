import { create } from "zustand";

type BannerStore = {
  PostIndex: number;

  setPostIndex: (index: number) => void;
  incrementPostIndex: () => void;
};

export const useBannerStore = create<BannerStore>((set) => ({
  PostIndex: 0,

  setPostIndex: (index) => set({ PostIndex: index }),
  incrementPostIndex: () =>
    set((state) => ({
      PostIndex: state.PostIndex >= 1 ? 0 : state.PostIndex + 1,
    })),
}));
