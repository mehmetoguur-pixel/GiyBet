export const AVATAR_MARKER_PX = 48;

export function buildAvatarMarkerHtml(avatarUrl: string, isSelf = false, isHot = false): string {
  const selfClass = isSelf ? " giybet-avatar-marker--self" : "";
  if (isHot) {
    return `<div class="giybet-marker-host giybet-marker-host--hot">
      <div class="giybet-sonar-ring giybet-sonar-ring--1"></div>
      <div class="giybet-sonar-ring giybet-sonar-ring--2"></div>
      <div class="giybet-sonar-ring giybet-sonar-ring--3"></div>
      <div class="giybet-avatar-marker giybet-avatar-marker--hot${selfClass}"><img src="${avatarUrl}" alt="" /></div>
    </div>`;
  }
  return `<div class="giybet-avatar-marker${selfClass}"><img src="${avatarUrl}" alt="" /></div>`;
}

export const HOT_MARKER_PX = 72;
export const ROOM_MARKER_PX = 56;
export const PLACE_MARKER_PX = 34;
export const SELECTED_PLACE_MARKER_PX = 44;

export function buildRoomMarkerHtml(roomName: string, highlighted = false): string {
  const safeName = roomName.replace(/"/g, "&quot;");
  const hostClass = highlighted
    ? "giybet-room-marker-host giybet-room-marker-host--highlight"
    : "giybet-room-marker-host";
  return `<div class="${hostClass}" title="${safeName}">
    <div class="giybet-room-marker-ring giybet-room-marker-ring--1"></div>
    <div class="giybet-room-marker-ring giybet-room-marker-ring--2"></div>
    <div class="giybet-room-marker-core">🏛️</div>
  </div>`;
}

export function buildNearbyPlaceMarkerHtml(name: string, emoji: string): string {
  const safeName = name.replace(/"/g, "&quot;");
  return `<div class="giybet-place-marker-host" title="${safeName}">
    <div class="giybet-place-marker-glow"></div>
    <span class="giybet-place-marker-emoji">${emoji}</span>
  </div>`;
}

export function buildSelectedPlaceMarkerHtml(name: string, emoji: string): string {
  const safeName = name.replace(/"/g, "&quot;");
  return `<div class="giybet-selected-place-host" title="${safeName}">
    <div class="giybet-selected-place-ring"></div>
    <span class="giybet-selected-place-emoji">${emoji}</span>
  </div>`;
}
