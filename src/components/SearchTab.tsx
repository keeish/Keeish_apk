import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  Phone,
  Video,
  Sparkles,
  Heart,
  ChevronRight
} from 'lucide-react';
import { UserPresence, FollowRequest, UserProfile } from '../types';

interface SearchTabProps {
  currentUserUid: string;
  users: UserPresence[];
  followRequests: FollowRequest[];
  followingUids: Set<string>;
  onOpenDirectChat: (partner: UserPresence) => void;
  onSendFollowRequest: (targetUid: string, targetName: string) => Promise<void>;
  onAcceptFollowRequest: (request: FollowRequest) => Promise<void>;
  onDeclineFollowRequest: (requestId: string) => Promise<void>;
  onUnfollow: (targetUid: string) => Promise<void>;
  onViewProfile: (profile: UserProfile) => void;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  currentUserUid,
  users,
  followRequests,
  followingUids,
  onOpenDirectChat,
  onSendFollowRequest,
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onUnfollow,
  onViewProfile,
  onStartCall
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'all' | 'requests'>('all');
  const [pendingActionUid, setPendingActionUid] = useState<string | null>(null);

  const incomingPending = followRequests.filter((r) => r.status === 'pending');

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    if (u.uid === currentUserUid) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.handle || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q)
    );
  });

  const handleFollowToggle = async (user: UserPresence) => {
    setPendingActionUid(user.uid);
    try {
      if (followingUids.has(user.uid)) {
        await onUnfollow(user.uid);
      } else {
        await onSendFollowRequest(user.uid, user.name);
      }
    } finally {
      setPendingActionUid(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#213247] bg-[#111e30] shrink-0">
        <h2 className="text-lg font-extrabold text-white mb-0.5">Find &amp; Connect</h2>
        <p className="text-xs text-[#a6b5ca] mb-3">
          Search for users by name to message directly or send a follow request
        </p>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a name, @handle, or topic…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08121f] border border-[#273a52] text-sm text-white placeholder-gray-500 outline-none focus:border-[#67e8c4] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mt-3 text-xs font-semibold">
          <button
            onClick={() => setSubTab('all')}
            className={`py-1.5 px-3 rounded-xl transition ${
              subTab === 'all'
                ? 'bg-[#67e8c4] text-[#09271f]'
                : 'bg-[#1b2b40] text-gray-300 hover:text-white'
            }`}
          >
            All Members ({filteredUsers.length})
          </button>
          <button
            onClick={() => setSubTab('requests')}
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition ${
              subTab === 'requests'
                ? 'bg-[#67e8c4] text-[#09271f]'
                : 'bg-[#1b2b40] text-gray-300 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Follow Requests
            {incomingPending.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                {incomingPending.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {subTab === 'all' && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44]">
                <Search className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">
                  {searchQuery ? `No user found matching "${searchQuery}"` : 'No other members found'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Make sure you typed the exact name or username handle.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isFollowing = followingUids.has(user.uid);
                const isPending = user.hasPendingRequest;

                return (
                  <div
                    key={user.uid}
                    className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] hover:border-[#2f4f78] flex items-center justify-between gap-3 shadow-sm transition"
                  >
                    {/* User profile preview & tap to view */}
                    <div
                      onClick={() =>
                        onViewProfile({
                          uid: user.uid,
                          chatName: user.name,
                          handle: user.handle,
                          bio: user.bio,
                          statusMessage: user.statusMessage,
                          avatarColor: user.avatarColor,
                          avatarEmoji: user.avatarEmoji,
                          favoriteManual: user.favoriteManual
                        })
                      }
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="relative shrink-0">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/10"
                          style={{ backgroundColor: user.avatarColor || '#1f354f' }}
                        >
                          {user.avatarEmoji || user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#142338] ${
                            user.online ? 'bg-emerald-400' : 'bg-gray-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>
                          {user.online && (
                            <span className="text-[10px] text-emerald-400 font-medium">· Online</span>
                          )}
                        </div>
                        {user.handle && (
                          <p className="text-xs text-[#67e8c4] font-mono truncate">{user.handle}</p>
                        )}
                        {user.bio && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Direct Chat + Calls + Follow */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Direct Message button: NEVER opens group chat, opens 1-on-1 direct! */}
                      <button
                        onClick={() => onOpenDirectChat(user)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                        title={`Direct private message with ${user.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      {/* Call triggers if user is online */}
                      {user.online && (
                        <>
                          <button
                            onClick={() => onStartCall(user.uid, user.name, 'audio')}
                            className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2c476c] text-[#67e8c4] transition cursor-pointer"
                            title="Audio Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onStartCall(user.uid, user.name, 'video')}
                            className="p-2 rounded-xl bg-[#20334d] hover:bg-[#2c476c] text-[#67e8c4] transition cursor-pointer"
                            title="Video Call"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Follow toggle button */}
                      <button
                        onClick={() => handleFollowToggle(user)}
                        disabled={pendingActionUid === user.uid || isPending}
                        className={`p-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                          isFollowing
                            ? 'bg-[#1b2e46] text-emerald-300'
                            : isPending
                            ? 'bg-[#25364e] text-amber-300'
                            : 'bg-[#1b2e46] hover:bg-[#253f61] text-gray-200'
                        }`}
                        title={isFollowing ? 'Following (Tap to unfollow)' : 'Send follow request'}
                      >
                        {isFollowing ? (
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                        ) : isPending ? (
                          <Clock className="w-4 h-4 text-amber-300" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {subTab === 'requests' && (
          <>
            {incomingPending.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-2xl bg-[#0f1b2c] border border-[#1e2f44]">
                <Heart className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">No pending follow requests</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  When someone sends you a connection or follow request, it will appear right here.
                </p>
              </div>
            ) : (
              incomingPending.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-[#142338] border border-[#213752] flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow shrink-0 border border-white/10"
                      style={{ backgroundColor: req.fromAvatarColor || '#233954' }}
                    >
                      {req.fromAvatarEmoji || req.fromName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{req.fromName}</h4>
                      {req.fromHandle && (
                        <p className="text-xs text-[#67e8c4] font-mono">{req.fromHandle}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">Wants to connect with you</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onAcceptFollowRequest(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => onDeclineFollowRequest(req.id)}
                      className="p-1.5 rounded-xl bg-[#20334d] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
