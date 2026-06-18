"use client";

import { GiybetMap } from "@/components/map/GiybetMap";
import { PlaceSearchBar } from "@/components/map/PlaceSearchBar";
import { SelectedPlacePanel } from "@/components/map/SelectedPlacePanel";
import { FEED_INPUT_CLASS } from "@/hooks/useGiybetFeed";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function MapTabContent({ feed }: { feed: FeedState }) {
  const {
    t,
    nickname,
    rooms,
    btnPrimary,
    feedTab,
    geoCoords,
    userCity,
    mapPinsVisible,
    pinsInMapViewport,
    mapDisplayPins,
    nearbyPlaces,
    selectedPlace,
    setSelectedPlace,
    mapFlyTarget,
    setMapFlyTarget,
    mapFlyZoom,
    setMapFlyZoom,
    mapFitAllNonce,
    setMapFitAllNonce,
    highlightedRoomId,
    roomCreateLoading,
    selectedPlaceHasRoom,
    handleSelectPlaceFromSearch,
    handleNearbyPlaceClick,
    handleMapBoundsChange,
    handleOpenRoomAtSelectedPlace,
    handleShareAtSelectedPlace,
    setSelectedMapPin,
    setMapShareTarget,
  } = feed;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMapFitAllNonce((n) => n + 1)}
          className="rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-200 transition hover:border-pink-500/50 hover:text-pink-200"
        >
          {t("map.worldView")}
        </button>
        {geoCoords && (
          <button
            type="button"
            onClick={() => {
              setMapFlyZoom(13);
              setMapFlyTarget({ lat: geoCoords.lat, lng: geoCoords.lng });
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-purple-500/40 hover:text-purple-200"
          >
            {t("map.myLocation")}
          </button>
        )}
        <span className="text-[11px] text-zinc-500">
          {mapPinsVisible
            ? t("map.pinsInArea", { count: pinsInMapViewport.length })
            : t("map.zoomForPins")}
        </span>
      </div>
      <PlaceSearchBar
        userLocation={geoCoords}
        onSelectPlace={handleSelectPlaceFromSearch}
        inputClass={FEED_INPUT_CLASS}
      />
      <div className="relative">
        <GiybetMap
          active={feedTab === "map"}
          pins={mapDisplayPins}
          rooms={rooms}
          nearbyPlaces={nearbyPlaces}
          selectedPlace={selectedPlace}
          flyTarget={mapFlyTarget}
          flyZoom={mapFlyZoom}
          fitAllPinsNonce={mapFitAllNonce}
          highlightedRoomId={highlightedRoomId}
          currentUser={nickname}
          userLocation={geoCoords}
          userCity={userCity}
          onPinSelect={setSelectedMapPin}
          onMapClick={(coords) => setMapShareTarget(coords)}
          onRoomSelect={(room) =>
            setMapShareTarget({
              lat: room.lat,
              lng: room.lng,
              roomId: room.id,
              placeId: room.placeId,
              placeName: room.name,
            })
          }
          onNearbyPlaceClick={handleNearbyPlaceClick}
          onBoundsChange={handleMapBoundsChange}
        />
        {selectedPlace && (
          <SelectedPlacePanel
            place={selectedPlace}
            hasRoom={selectedPlaceHasRoom}
            loading={roomCreateLoading}
            onOpenRoom={handleOpenRoomAtSelectedPlace}
            onShareGossip={handleShareAtSelectedPlace}
            onClose={() => setSelectedPlace(null)}
            btnPrimary={btnPrimary}
          />
        )}
      </div>
      <div className="rounded-2xl border border-purple-500/30 bg-[#12121a]/70 p-4">
        <h2 className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
          {t("feed.mapGossipList")}
          <span className="ml-2 text-purple-300">({pinsInMapViewport.length})</span>
        </h2>
        <p className="mt-1 text-[11px] text-zinc-600">
          {mapPinsVisible ? t("feed.mapListHintVisible") : t("feed.mapListHintHidden")}
        </p>
        {!mapPinsVisible ? (
          <p className="mt-3 text-sm text-zinc-500">{t("map.wideZoomHint")}</p>
        ) : pinsInMapViewport.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">{t("map.noGossipHere")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {pinsInMapViewport.slice(0, 10).map((pin) => (
              <li key={`${pin.id}-${pin.feedPostId}`}>
                <button
                  type="button"
                  onClick={() => {
                    setMapFlyZoom(12);
                    setMapFlyTarget({ lat: pin.lat, lng: pin.lng });
                    setSelectedMapPin(pin);
                  }}
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-3 py-2.5 text-left transition hover:border-purple-500/40 hover:bg-purple-950/20"
                >
                  <span className="text-xs font-semibold text-pink-300">
                    {pin.cityLabel ?? pin.location}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-zinc-300">{pin.text}</span>
                  <span className="mt-1 text-[10px] text-zinc-500">@{pin.author}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
