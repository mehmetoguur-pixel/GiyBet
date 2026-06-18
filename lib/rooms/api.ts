import { supabase } from "@/lib/supabase";
import { getLocalizedString } from "@/lib/i18n";
import { haversineDistanceMeters } from "@/lib/geo";
import { DEFAULT_GOSSIP_LOCATION, GOSSIP_CHAT_TABLE } from "@/lib/gossip/constants";
import { asPostId, avatarForAuthor, normalizeGossipId } from "@/lib/gossip/parsers";
import { gossipChatLabel } from "./chat-utils";
import type {
  City,
  GossipChatMessageRow,
  MapRoom,
  RoomMessageRow,
  RoomRow,
  VenueChatMessage,
} from "@/lib/giybet/types";

export function roomRowToMapRoom(row: RoomRow): MapRoom {
  const feedCity: City =
    row.city === "İstanbul" || row.city === "Istanbul"
      ? "Istanbul"
      : row.city === "Ankara"
        ? "Ankara"
        : DEFAULT_GOSSIP_LOCATION.feedCity;
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    city: feedCity,
    ...(row.place_id ? { placeId: row.place_id } : {}),
  };
}

export async function findRoomByPlaceId(placeId: string): Promise<MapRoom | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("place_id", placeId)
    .maybeSingle();
  if (error || !data) return null;
  return roomRowToMapRoom(data as RoomRow);
}

export function findRoomByPlaceIdLocal(rooms: MapRoom[], placeId: string): MapRoom | null {
  return rooms.find((room) => room.placeId === placeId) ?? null;
}

export function findNearestMapRoom(
  lat: number,
  lng: number,
  rooms: MapRoom[],
  maxMeters = 200,
): MapRoom | null {
  let best: MapRoom | null = null;
  let bestDistance = maxMeters;
  for (const room of rooms) {
    const distance = haversineDistanceMeters(lat, lng, room.lat, room.lng);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = room;
    }
  }
  return best;
}

const ROOM_COORD_MATCH_METERS = 150;
const ROOM_NAME_MATCH_METERS = 200;

export function normalizeRoomName(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR");
}

export function findRoomByNameAndCoordsLocal(
  rooms: MapRoom[],
  name: string,
  lat: number,
  lng: number,
  maxMeters = ROOM_NAME_MATCH_METERS,
): MapRoom | null {
  const normalized = normalizeRoomName(name);
  let best: MapRoom | null = null;
  let bestDistance = maxMeters;
  for (const room of rooms) {
    if (normalizeRoomName(room.name) !== normalized) continue;
    const distance = haversineDistanceMeters(lat, lng, room.lat, room.lng);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = room;
    }
  }
  return best;
}

export async function findRoomByNameAndCoords(
  name: string,
  lat: number,
  lng: number,
): Promise<MapRoom | null> {
  const trimmedName = name.trim();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .ilike("name", trimmedName);

  if (error || !data?.length) return null;

  const normalized = normalizeRoomName(trimmedName);
  let best: MapRoom | null = null;
  let bestDistance = ROOM_NAME_MATCH_METERS;

  for (const row of data as RoomRow[]) {
    const room = roomRowToMapRoom(row);
    if (normalizeRoomName(room.name) !== normalized) continue;
    const distance = haversineDistanceMeters(lat, lng, room.lat, room.lng);
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = room;
    }
  }

  return best;
}

export async function ensureRoomForVenue(
  venue: {
    name: string;
    lat: number;
    lng: number;
    city: string;
    placeId?: string;
  },
  localRooms: MapRoom[],
): Promise<MapRoom> {
  if (venue.placeId) {
    const localByPlace = findRoomByPlaceIdLocal(localRooms, venue.placeId);
    if (localByPlace) return localByPlace;

    const remoteByPlace = await findRoomByPlaceId(venue.placeId);
    if (remoteByPlace) return remoteByPlace;
  }

  const localByName = findRoomByNameAndCoordsLocal(
    localRooms,
    venue.name,
    venue.lat,
    venue.lng,
  );
  if (localByName) return localByName;

  const remoteByName = await findRoomByNameAndCoords(venue.name, venue.lat, venue.lng);
  if (remoteByName) return remoteByName;

  const nearest = findNearestMapRoom(
    venue.lat,
    venue.lng,
    localRooms,
    ROOM_COORD_MATCH_METERS,
  );
  if (nearest && normalizeRoomName(nearest.name) === normalizeRoomName(venue.name)) {
    return nearest;
  }

  const insertPayload: Record<string, string | number> = {
    name: venue.name.trim(),
    lat: venue.lat,
    lng: venue.lng,
    city: venue.city,
  };
  if (venue.placeId) insertPayload.place_id = venue.placeId;

  const { data, error } = await supabase
    .from("rooms")
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || getLocalizedString("errors.roomCreateFailed"));
  }

  return roomRowToMapRoom(data as RoomRow);
}

export async function fetchRoomsFromSupabase(): Promise<MapRoom[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  return (data as RoomRow[]).map(roomRowToMapRoom);
}
export function isSupabaseSchemaMismatchError(message: string): boolean {
  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("null value") ||
    message.includes("violates not-null")
  );
}
export function mapRoomMessageRow(row: RoomMessageRow): VenueChatMessage {
  const author = (row.author ?? row.username ?? "Anonim").trim() || "Anonim";
  const text = (row.content ?? row.message ?? "").trim();
  return {
    id: asPostId(row.id),
    author,
    text,
    avatar: avatarForAuthor(author),
  };
}
export async function findRoomIdByGossipId(gossipId: string): Promise<string | null> {
  const gid = normalizeGossipId(gossipId);
  const fromRoom = await findRoomByGossipId(gid);
  if (fromRoom) return fromRoom.id;

  const { data, error } = await supabase
    .from("gossips")
    .select("room_id")
    .eq("id", gid)
    .maybeSingle();

  if (error || !data?.room_id) return null;
  return String(data.room_id);
}

export async function findRoomByGossipId(gossipId: string): Promise<MapRoom | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("gossip_id", gossipId)
    .maybeSingle();
  if (error || !data) return null;
  return roomRowToMapRoom(data as RoomRow);
}

export async function createRoomForGossip(
  gossipId: string,
  location: { lat: number; lng: number; city: string },
  previewText: string,
  options?: { skipExistingLookup?: boolean },
): Promise<MapRoom> {
  if (!options?.skipExistingLookup) {
    const existing = await findRoomByGossipId(gossipId);
    if (existing) return existing;
  }

  const name = `${getLocalizedString("chat.gossipPrefix")}${gossipChatLabel(previewText)}`;
  const payloads: Record<string, string | number>[] = [
    { name, lat: location.lat, lng: location.lng, city: location.city, gossip_id: gossipId },
    { name, lat: location.lat, lng: location.lng, city: location.city },
  ];

  for (const payload of payloads) {
    const { data, error } = await supabase.from("rooms").insert([payload]).select().single();
    if (!error && data) return roomRowToMapRoom(data as RoomRow);
  }

  throw new Error(getLocalizedString("errors.chatRoomFailed"));
}

export function mapGossipChatMessageRow(row: GossipChatMessageRow): VenueChatMessage {
  return {
    id: asPostId(row.id),
    author: row.author,
    text: row.content,
    avatar: avatarForAuthor(row.author),
  };
}
export async function fetchGossipChatMessagesLegacy(gossipId: string): Promise<{
  messages: VenueChatMessage[];
  error: string | null;
}> {
  const gid = normalizeGossipId(gossipId);

  const fetchByGossip = await supabase
    .from("room_messages")
    .select("*")
    .eq("gossip_id", gid)
    .order("created_at", { ascending: true })
    .limit(200);

  if (fetchByGossip.error) {
    return { messages: [], error: fetchByGossip.error.message };
  }

  let rows = (fetchByGossip.data ?? []) as RoomMessageRow[];

  if (rows.length === 0) {
    const roomId = await findRoomIdByGossipId(gid);
    if (roomId) {
      const fetchByRoom = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (fetchByRoom.error) {
        return { messages: [], error: fetchByRoom.error.message };
      }
      rows = (fetchByRoom.data ?? []) as RoomMessageRow[];
    }
  }

  return {
    messages: rows.map(mapRoomMessageRow),
    error: null,
  };
}

export async function fetchGossipChatMessages(gossipId: string): Promise<{
  messages: VenueChatMessage[];
  error: string | null;
}> {
  const gid = normalizeGossipId(gossipId);

  const { data, error } = await supabase
    .from(GOSSIP_CHAT_TABLE)
    .select("*")
    .eq("gossip_id", gid)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    if (isSupabaseSchemaMismatchError(error.message)) {
      return fetchGossipChatMessagesLegacy(gid);
    }
    return { messages: [], error: error.message };
  }

  const primary = (data ?? []) as GossipChatMessageRow[];
  if (primary.length > 0) {
    return { messages: primary.map(mapGossipChatMessageRow), error: null };
  }

  const legacy = await fetchGossipChatMessagesLegacy(gid);
  if (legacy.messages.length > 0) return legacy;
  return { messages: [], error: null };
}

export async function resolveVenueNameForGossip(gossipId: string): Promise<string> {
  const gid = normalizeGossipId(gossipId);
  const { data } = await supabase.from("gossips").select("content").eq("id", gid).maybeSingle();
  if (data?.content) return gossipChatLabel(String(data.content));

  const room = await findRoomByGossipId(gid);
  if (room) return room.name;

  return getLocalizedString("chat.defaultLabel");
}

export async function insertGossipChatMessageLegacy(
  gossipId: string,
  author: string,
  content: string,
): Promise<{ message: VenueChatMessage | null; error: string | null }> {
  const gid = normalizeGossipId(gossipId);
  const trimmedAuthor = author.trim();
  const trimmedContent = content.trim();
  const roomId = await findRoomIdByGossipId(gid);
  const venueName = await resolveVenueNameForGossip(gid);

  const withVenue = (payload: Record<string, string>) => ({
    ...payload,
    venue_name: venueName,
  });

  const payloads: Record<string, string>[] = [];

  if (roomId) {
    payloads.push(
      withVenue({ room_id: roomId, gossip_id: gid, author: trimmedAuthor, content: trimmedContent }),
      withVenue({ room_id: roomId, gossip_id: gid, username: trimmedAuthor, content: trimmedContent }),
      withVenue({ room_id: roomId, gossip_id: gid, author: trimmedAuthor, message: trimmedContent }),
      withVenue({ room_id: roomId, author: trimmedAuthor, content: trimmedContent }),
      withVenue({ room_id: roomId, username: trimmedAuthor, message: trimmedContent }),
    );
  }

  payloads.push(
    withVenue({ gossip_id: gid, author: trimmedAuthor, content: trimmedContent }),
    withVenue({ gossip_id: gid, username: trimmedAuthor, content: trimmedContent }),
    withVenue({ gossip_id: gid, author: trimmedAuthor, message: trimmedContent }),
  );

  let lastError = getLocalizedString("errors.chatSaveFailed");
  for (const payload of payloads) {
    const { data, error } = await supabase.from("room_messages").insert([payload]).select().single();
    if (!error && data) {
      return { message: mapRoomMessageRow(data as RoomMessageRow), error: null };
    }
    lastError = error?.message ?? lastError;
    if (!isSupabaseSchemaMismatchError(lastError)) break;
  }

  return { message: null, error: lastError };
}

export async function insertGossipChatMessage(
  gossipId: string,
  author: string,
  content: string,
): Promise<{ message: VenueChatMessage | null; error: string | null }> {
  const gid = normalizeGossipId(gossipId);
  const trimmedAuthor = author.trim();
  const trimmedContent = content.trim();

  const { data, error } = await supabase
    .from(GOSSIP_CHAT_TABLE)
    .insert([{ gossip_id: gid, author: trimmedAuthor, content: trimmedContent }])
    .select()
    .single();

  if (!error && data) {
    return {
      message: mapGossipChatMessageRow(data as GossipChatMessageRow),
      error: null,
    };
  }

  const legacy = await insertGossipChatMessageLegacy(gid, trimmedAuthor, trimmedContent);
  if (legacy.message) return legacy;

  const primaryError = error?.message ?? legacy.error ?? getLocalizedString("errors.chatSaveFailed");
  console.error("Sohbet mesajı kaydedilemedi:", primaryError);
  return { message: null, error: primaryError };
}
