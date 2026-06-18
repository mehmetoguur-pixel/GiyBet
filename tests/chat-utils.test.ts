import { describe, expect, it } from "vitest";
import { gossipChatLabel } from "@/lib/rooms/chat-utils";

describe("gossip chat utils", () => {
  it("truncates long labels", () => {
    const long = "a".repeat(40);
    expect(gossipChatLabel(long)).toHaveLength(37);
    expect(gossipChatLabel(long).endsWith("…")).toBe(true);
  });

  it("returns default label for empty text", () => {
    expect(gossipChatLabel("")).not.toBe("");
  });

  it("keeps short labels intact", () => {
    expect(gossipChatLabel("Kısa gıybet")).toBe("Kısa gıybet");
  });
});
