"use client";

import { ReportModal } from "@/components/ReportModal";
import { GossipChatFlash } from "@/components/chat/GossipChatFlash";
import { GossipChatModal } from "@/components/chat/GossipChatModal";
import { ReportAcknowledgedToast } from "@/components/chat/ReportAcknowledgedToast";
import { RoomLimitAlert } from "@/components/chat/RoomLimitAlert";
import { LikersModal } from "@/components/feed/LikersModal";
import { GossipLaunchOverlay } from "@/components/map/GossipLaunchOverlay";
import { MapPinDetailModal } from "@/components/map/MapPinDetailModal";
import { MapShareModal } from "@/components/map/MapShareModal";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { getLocalizedString } from "@/lib/i18n";
import type { useGiybetFeed } from "@/hooks/useGiybetFeed";

type FeedState = ReturnType<typeof useGiybetFeed>;

export function GiybetFeedModals({ feed }: { feed: FeedState }) {
  const {
    nickname,
    avatar,
    rooms,
    btnPrimary,
    btnSecondary,
    onAddComment,
    onSaveAvatar,
    onLogout,
    shareLoading,
    roomLimitAlert,
    showReportToast,
    reportTarget,
    setReportTarget,
    handleSubmitReport,
    gossipChatFlash,
    handleGossipFlashNavigate,
    gossipChatModalOpen,
    setGossipChatModalOpen,
    currentFocusedGossipId,
    activeGossipChats,
    gossipChatLabels,
    gossipChatMessages,
    gossipChatError,
    handleGossipChatSend,
    leaveGossipChat,
    likersModalPost,
    setLikersModalPostId,
    selectedMapPin,
    selectedMapPost,
    setSelectedMapPin,
    authorReactionScores,
    handleOpenReport,
    mapShareTarget,
    setMapShareTarget,
    handleShareWithChat,
    showProfile,
    setShowProfile,
    editingAvatar,
    setEditingAvatar,
    userPostCount,
    profileFollowers,
    profileFollowing,
    userReactionScore,
    userPosts,
  } = feed;

  return (
    <>
      <GossipLaunchOverlay visible={shareLoading} />
      {roomLimitAlert && <RoomLimitAlert />}
      {showReportToast && <ReportAcknowledgedToast />}
      <ReportModal
        open={reportTarget != null}
        author={reportTarget?.author ?? ""}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
      {gossipChatFlash && (
        <GossipChatFlash
          gossipId={gossipChatFlash.gossipId}
          label={gossipChatFlash.label}
          onNavigate={handleGossipFlashNavigate}
        />
      )}
      {gossipChatModalOpen &&
        currentFocusedGossipId &&
        activeGossipChats.includes(currentFocusedGossipId) && (
          <GossipChatModal
            label={
              gossipChatLabels[currentFocusedGossipId] ??
              getLocalizedString("chat.defaultLabel")
            }
            nickname={nickname}
            avatar={avatar}
            messages={gossipChatMessages[currentFocusedGossipId] ?? []}
            sendError={gossipChatError}
            onSend={handleGossipChatSend}
            onClose={() => setGossipChatModalOpen(false)}
            onLeave={() => leaveGossipChat(currentFocusedGossipId)}
          />
        )}
      {likersModalPost && (
        <LikersModal
          likers={likersModalPost.likers}
          currentUser={nickname}
          onClose={() => setLikersModalPostId(null)}
        />
      )}
      {selectedMapPin && selectedMapPost && (
        <MapPinDetailModal
          pin={selectedMapPin}
          post={selectedMapPost}
          nickname={nickname}
          avatar={avatar}
          authorReactionScores={authorReactionScores}
          onAddComment={onAddComment}
          onClose={() => setSelectedMapPin(null)}
          onReport={handleOpenReport}
        />
      )}
      {mapShareTarget && (
        <MapShareModal
          target={mapShareTarget}
          rooms={rooms}
          onClose={() => setMapShareTarget(null)}
          onSubmit={handleShareWithChat}
          btnPrimary={btnPrimary}
          btnSecondary={btnSecondary}
        />
      )}
      <ProfilePanel
        open={showProfile}
        onClose={() => {
          setShowProfile(false);
          setEditingAvatar(null);
        }}
        nickname={nickname}
        avatar={avatar}
        postCount={userPostCount}
        followers={profileFollowers}
        following={profileFollowing}
        totalReactionScore={userReactionScore}
        userPosts={userPosts}
        editingAvatar={editingAvatar}
        onStartEdit={() => setEditingAvatar({ ...avatar })}
        onCancelEdit={() => setEditingAvatar(null)}
        onSaveAvatar={() => {
          if (editingAvatar) {
            onSaveAvatar(editingAvatar);
            setEditingAvatar(null);
          }
        }}
        onDraftChange={(patch) =>
          setEditingAvatar((prev) => (prev ? { ...prev, ...patch } : prev))
        }
        onLogout={onLogout}
        btnPrimary={btnPrimary}
        btnSecondary={btnSecondary}
      />
    </>
  );
}
