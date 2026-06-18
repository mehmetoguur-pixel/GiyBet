import { describe, expect, it } from "vitest";
import {
  buildAuthorReactionScores,
  formatReactionScore,
  getRankFromScore,
  sumPostReactions,
} from "@/lib/feed/rank";
import type { FeedPost } from "@/lib/giybet/types";
import { DEFAULT_AVATAR } from "@/lib/avatar";

function stubPost(author: string, reactions: { fire: number; shock: number; secret: number }): FeedPost {
  return {
    id: 1,
    author,
    text: "x",
    liked: false,
    likers: [],
    commentItems: [],
    reactions,
    userReaction: null,
    time: "now",
    avatar: DEFAULT_AVATAR,
    city: "Istanbul",
    tags: [],
  };
}

describe("feed rank", () => {
  it("sums reaction counts", () => {
    expect(sumPostReactions({ fire: 2, shock: 1, secret: 3 })).toBe(6);
  });

  it("formats large reaction scores", () => {
    expect(formatReactionScore(999)).toBe("999");
    expect(formatReactionScore(1500)).toBe("1.5K");
    expect(formatReactionScore(2000)).toBe("2K");
  });

  it("assigns rank tiers from score", () => {
    expect(getRankFromScore(10).title).toBe("Çaylak Kuş");
    expect(getRankFromScore(100).title).toBe("Mahalle Casusu");
    expect(getRankFromScore(300).title).toBe("Gıybet Muhtarı");
    expect(getRankFromScore(600).title).toBe("Dedikodu İmparatoru");
  });

  it("aggregates author reaction scores", () => {
    const posts = [
      stubPost("alice", { fire: 2, shock: 0, secret: 1 }),
      stubPost("bob", { fire: 1, shock: 1, secret: 0 }),
      stubPost("alice", { fire: 0, shock: 3, secret: 0 }),
    ];
    expect(buildAuthorReactionScores(posts)).toEqual({ alice: 6, bob: 2 });
  });
});
