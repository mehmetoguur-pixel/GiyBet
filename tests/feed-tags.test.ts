import { describe, expect, it } from "vitest";
import {
  computeTrendingTags,
  extractHashtags,
  formatTag,
  mergeTags,
  normalizeTagKey,
  postHasTag,
} from "@/lib/feed/tags";
import type { FeedPost } from "@/lib/giybet/types";
import { DEFAULT_AVATAR } from "@/lib/avatar";

function stubPost(tags: string[], id = 1): FeedPost {
  return {
    id,
    author: "tester",
    text: "post",
    liked: false,
    likers: [],
    commentItems: [],
    reactions: { fire: 0, shock: 0, secret: 0 },
    userReaction: null,
    time: "now",
    avatar: DEFAULT_AVATAR,
    city: "Istanbul",
    tags,
  };
}

describe("feed tags", () => {
  it("normalizes and formats tag keys", () => {
    expect(normalizeTagKey("#Gıybet")).toBe("gıybet");
    expect(formatTag("giybet")).toBe("#giybet");
    expect(formatTag("")).toBe("");
  });

  it("extracts unique hashtags from text", () => {
    // Turkish İ vs ASCII i normalize to different keys
    expect(extractHashtags("Merhaba #Gıybet ve #giybet")).toEqual(["#Gıybet", "#giybet"]);
    expect(extractHashtags("dup #foo #foo")).toEqual(["#foo"]);
    expect(extractHashtags("no tags")).toEqual([]);
  });

  it("merges tag lists without duplicates", () => {
    expect(mergeTags(["#foo"], ["foo", "#bar"])).toEqual(["#foo", "#bar"]);
  });

  it("matches posts by tag filter", () => {
    const post = stubPost(["#Kadıköy"]);
    expect(postHasTag(post, "kadıköy")).toBe(true);
    expect(postHasTag(post, "beşiktaş")).toBe(false);
  });

  it("computes trending tags by frequency", () => {
    const posts = [
      stubPost(["#gece"], 1),
      stubPost(["#gece", "#istanbul"], 2),
      stubPost(["#istanbul"], 3),
    ];
    const trending = computeTrendingTags(posts, 2);
    expect(trending[0]).toEqual({ tag: "#gece", count: 2 });
    expect(trending[1]).toEqual({ tag: "#istanbul", count: 2 });
  });
});
