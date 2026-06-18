import { describe, expect, it } from "vitest";
import {
  asPostId,
  commentRowToComment,
  normalizeGossipId,
  parseLikeUsernames,
  parseReactionCounts,
  parseUserReactions,
  resolveGossipAuthor,
  resolveGossipLocation,
} from "@/lib/gossip/parsers";

describe("gossip parsers", () => {
  it("normalizes gossip id to string", () => {
    expect(normalizeGossipId(42)).toBe("42");
    expect(normalizeGossipId("abc")).toBe("abc");
  });

  it("hashes string ids to stable post numbers", () => {
    const a = asPostId("gossip-uuid-1");
    const b = asPostId("gossip-uuid-2");
    expect(a).not.toBe(b);
    expect(asPostId("gossip-uuid-1")).toBe(a);
  });

  it("parses reaction counts safely", () => {
    expect(parseReactionCounts({ fire: 2, shock: 1, secret: 0 })).toEqual({
      fire: 2,
      shock: 1,
      secret: 0,
    });
    expect(parseReactionCounts(null)).toEqual({ fire: 0, shock: 0, secret: 0 });
  });

  it("parses like usernames and user reactions", () => {
    expect(parseLikeUsernames([" alice ", "", "bob"])).toEqual(["alice", "bob"]);
    expect(parseLikeUsernames(null)).toEqual([]);
    expect(parseUserReactions({ alice: "fire", bob: "invalid", carol: "shock" })).toEqual({
      alice: "fire",
      carol: "shock",
    });
  });

  it("resolves gossip author and location", () => {
    expect(resolveGossipAuthor({ username: "  giybetci  " } as never)).toBe("giybetci");
    expect(resolveGossipAuthor({ author: "legacy" } as never)).toBe("legacy");

    const withCoords = resolveGossipLocation({ lat: 41.0, lng: 29.0, city: "Istanbul" });
    expect(withCoords.hasUserCoords).toBe(true);
    expect(withCoords.city).toBe("İstanbul");

    const fallback = resolveGossipLocation({});
    expect(fallback.hasUserCoords).toBe(false);
    expect(fallback.lat).toBeGreaterThan(0);
  });

  it("maps comment rows to feed comments", () => {
    const comment = commentRowToComment({
      id: "cmt-1",
      content: "selam",
      username: "tester",
    } as never);
    expect(comment.author).toBe("tester");
    expect(comment.text).toBe("selam");
    expect(comment.id).toBe(asPostId("cmt-1"));
  });
});
