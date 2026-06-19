"use client";

import { ReportModal } from "@/components/ReportModal";
import { GossipChatFlash } from "@/components/chat/GossipChatFlash";
import { GossipChatModal } from "@/components/chat/GossipChatModal";
import { ReportAcknowledgedToast } from "@/components/chat/ReportAcknowledgedToast";
import { NeonToast } from "@/components/ui/NeonToast";
import { RoomLimitAlert } from "@/components/chat/RoomLimitAlert";
import { LikersModal } from "@/components/feed/LikersModal";
import { GossipLaunchOverlay } from "@/components/map/GossipLaunchOverlay";
import { MapPinDetailModal } from "@/components/map/MapPinDetailModal";
import { MapShareModal } from "@/components/map/MapShareModal";
import { ProfileGossipDetailModal } from "@/components/profile/ProfileGossipDetailModal";
import { ProfilePanel } from "@/components/profile/ProfilePanel";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
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
    reportError,
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
    authorReactionScores,
    setLikersModalPostId,
    selectedMapPin,
    selectedMapPost,
    setSelectedMapPin,
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
    posts,
    followingAuthors,
    followFeedback,
    selectedUserProfile,
    setSelectedUserProfile,
    blockedAuthors,
    deepLinkPost,
    setDeepLinkPost,
    handleBlockUser,
    handleUnblockUser,
    handleToggleFollow,
  } = feed;

  return (
    <>
      <GossipLaunchOverlay visible={shareLoading} />
      {roomLimitAlert && <RoomLimitAlert />}
      {showReportToast && <ReportAcknowledgedToast />}
      {reportError && <NeonToast message={reportError} variant="error" />}
      {followFeedback && (
        <NeonToast message={followFeedback.message} variant={followFeedback.variant} />
      )}
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
        authorReactionScores={authorReactionScores}
        blockedAuthors={blockedAuthors}
        onUnblockUser={handleUnblockUser}
      />
      {selectedUserProfile && (
        <UserProfileModal
          username={selectedUserProfile}
          posts={posts}
          currentNickname={nickname}
          followingAuthors={followingAuthors}
          blockedAuthors={blockedAuthors}
          authorReactionScores={authorReactionScores}
          onClose={() => setSelectedUserProfile(null)}
          onToggleFollow={handleToggleFollow}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      )}
      {deepLinkPost && (
        <ProfileGossipDetailModal
          post={deepLinkPost}
          authorReactionScores={authorReactionScores}
          onClose={() => setDeepLinkPost(null)}
        />
      )}
    </>
  );
}
