import { describe, expect, it } from "vitest";
import {
  mergeCommentInsert,
  mergeGossipInsert,
  mergeGossipUpdate,
  mergeServerPostsIntoFeed,
} from "@/lib/gossip/realtime-feed";
import type { CommentRow, FeedPost, GossipRow } from "@/lib/giybet/types";

const basePost = (gossipId: string, postId: number): FeedPost => ({
  id: postId,
  gossipId,
  author: "alice",
  text: "hello",
  liked: false,
  likers: [],
  commentItems: [],
  reactions: { fire: 0, shock: 0, secret: 0 },
  userReaction: null,
  time: "now",
  avatar: { eyes: "normal", mouth: "smile", skin: "light", hair: "short", accessory: "none" },
  city: "Istanbul",
  tags: [],
  distanceMeters: 100,
  lat: 41,
  lng: 29,
});

describe("realtime-feed merge", () => {
  it("prepends new gossip without duplicates", () => {
    const row = {
      id: "gossip-new",
      content: "fresh",
      username: "bob",
      city: "Istanbul",
      lat: 41,
      lng: 29,
      created_at: new Date().toISOString(),
    } as GossipRow;

    const first = mergeGossipInsert([], [], row, "viewer");
    expect(first.added).toBe(true);
    expect(first.posts.length).toBe(1);

    const second = mergeGossipInsert(first.posts, first.pins, row, "viewer");
    expect(second.added).toBe(false);
    expect(second.posts.length).toBe(1);
  });

  it("removes soft-deleted gossip on update", () => {
    const posts = [basePost("g1", 1), basePost("g2", 2)];
    const row = {
      id: "g1",
      deleted_at: new Date().toISOString(),
    } as GossipRow;
    const merged = mergeGossipUpdate(posts, [], row, "viewer");
    expect(merged.posts.length).toBe(1);
    expect(merged.posts[0].gossipId).toBe("g2");
  });

  it("ignores partial realtime updates without engagement fields", () => {
    const posts = [basePost("g1", 1)];
    posts[0].likers = ["alice"];
    posts[0].liked = true;
    const row = { id: "g1", room_id: "room-1" } as GossipRow;
    const merged = mergeGossipUpdate(posts, [], row, "viewer");
    expect(merged.posts[0].likers).toEqual(["alice"]);
    expect(merged.posts[0].liked).toBe(true);
  });

  it("appends comment without duplicates", () => {
    const posts = [basePost("g1", 1)];
    const row = {
      id: 99,
      gossip_id: "g1",
      author: "carol",
      content: "nice",
    } as CommentRow;
    const once = mergeCommentInsert(posts, row);
    expect(once[0].commentItems.length).toBe(1);
    const twice = mergeCommentInsert(once, row);
    expect(twice[0].commentItems.length).toBe(1);
  });

  it("keeps existing posts when merging a pagination page", () => {
    const existing = [basePost("g1", 1), basePost("g2", 2)];
    const nextPage = [basePost("g3", 3), basePost("g4", 4)];
    const merged = mergeServerPostsIntoFeed(existing, nextPage);
    expect(merged.map((p) => p.gossipId)).toEqual(["g1", "g2", "g3", "g4"]);
  });

  it("updates overlapping posts without dropping others", () => {
    const existing = [basePost("g1", 1), basePost("g2", 2)];
    existing[0].distanceMeters = 250;
    const refreshed = [{ ...basePost("g1", 1), distanceMeters: undefined }];
    const merged = mergeServerPostsIntoFeed(existing, refreshed);
    expect(merged.length).toBe(2);
    expect(merged[0].distanceMeters).toBe(250);
    expect(merged[1].gossipId).toBe("g2");
  });
});
