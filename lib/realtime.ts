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
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `recipient_username=eq.${recipientUsername}`,
      },
      () => onChange(),
    )
    .subscribe();
}

export function unsubscribeChannel(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
