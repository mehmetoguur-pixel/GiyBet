import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function subscribeGossipChat(
  gossipId: string,
  onInsert: () => void,
): RealtimeChannel {
  return supabase
    .channel(`gossip-chat:${gossipId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "gossip_chat_messages",
        filter: `gossip_id=eq.${gossipId}`,
      },
      () => onInsert(),
    )
    .subscribe();
}

export function subscribeNotifications(
  recipientUsername: string,
  onChange: () => void,
): RealtimeChannel {
  return supabase
    .channel(`notifications:${recipientUsername}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_username=eq.${recipientUsername}`,
      },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `recipient_username=eq.${recipientUsername}`,
      },
      () => onChange(),
    )
    .subscribe();
}

/** Yeni gıybet, engagement güncellemesi ve yorumlar için feed realtime */
export function subscribeFeedRealtime(handlers: {
  onGossipInsert?: (row: Record<string, unknown>) => void;
  onGossipUpdate?: (row: Record<string, unknown>) => void;
  onCommentInsert?: (row: Record<string, unknown>) => void;
}): RealtimeChannel {
  const channel = supabase.channel("feed-realtime");

  if (handlers.onGossipInsert) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "gossips" },
      (payload) => handlers.onGossipInsert?.(payload.new as Record<string, unknown>),
    );
  }

  if (handlers.onGossipUpdate) {
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "gossips" },
      (payload) => handlers.onGossipUpdate?.(payload.new as Record<string, unknown>),
    );
  }

  if (handlers.onCommentInsert) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "comments" },
      (payload) => handlers.onCommentInsert?.(payload.new as Record<string, unknown>),
    );
  }

  channel.subscribe();
  return channel;
}

export function unsubscribeChannel(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
