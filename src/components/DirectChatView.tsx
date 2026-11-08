import React, { useState, useEffect, useRef } from 'react';
import {
  ref,
  push,
  set,
  remove,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast
} from 'firebase/database';
import { db, BASE } from '../firebase';
import { MessageItem, UserPresence, UserProfile } from '../types';
import { MessageInfoModal } from './MessageInfoModal';
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  User,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface DirectChatViewProps {
  currentUserUid: string;
  currentUserName: string;
  partner: UserPresence | null;
  isLounge?: boolean;
  onBackToInbox: () => void;
  onStartCall: (partnerUid: string, partnerName: string, type: 'audio' | 'video') => void;
  onViewProfile: (profile: UserProfile) => void;
  onUpdateConversationSnippet?: (chatId: string, lastText: string, lastTime: number) => void;
}

export const DirectChatView: React.FC<DirectChatViewProps> = ({
  currentUserUid,
  currentUserName,
  partner,
  isLounge = false,
  onBackToInbox,
  onStartCall,
  onViewProfile,
  onUpdateConversationSnippet
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessageForInfo, setSelectedMessageForInfo] = useState<MessageItem | null>(null);
  const [unsendTargetId, setUnsendTargetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Compute conversation database path
  // If lounge: 'keeishChat/loungeMessages'
  // If 1-on-1 direct: 'keeishChat/directMessages/{chatId}' where chatId = [uid1, uid2].sort().join('__')
  const chatId = isLounge
    ? 'lounge'
    : partner
    ? [currentUserUid, partner.uid].sort().join('__')
    : 'unknown';

  const dbPath = isLounge
    ? `${BASE}/loungeMessages`
    : `${BASE}/directMessages/${chatId}`;

  // Listen to messages in this specific thread
  useEffect(() => {
    setIsLoading(true);
    const messagesQuery = query(
      ref(db, dbPath),
      orderByChild('createdAt'),
      limitToLast(100)
    );

    const unsub = onValue(messagesQuery, (snapshot) => {
      const items: MessageItem[] = [];
      let latestText = '';
      let latestTime = 0;

      snapshot.forEach((child) => {
        const val = child.val();
        items.push({
          id: child.key as string,
          uid: val.uid,
          senderName: val.senderName,
          text: val.text,
          createdAt: val.createdAt
        });

        latestText = val.text;
        latestTime = val.createdAt || Date.now();

        // Mark as seen if received from partner
        if (val.uid !== currentUserUid) {
          set(
            ref(db, `${BASE}/directMessageSeen/${chatId}/${child.key}/${currentUserUid}`),
            serverTimestamp()
          ).catch(() => {});
        }
      });

      setMessages(items);
      setIsLoading(false);

      if (latestText && onUpdateConversationSnippet) {
        onUpdateConversationSnippet(chatId, latestText, latestTime);
      }
    });

    return () => unsub();
  }, [dbPath, chatId, currentUserUid]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
    }

    try {
      const newMsgRef = push(ref(db, dbPath));
      await set(newMsgRef, {
        uid: currentUserUid,
        senderName: currentUserName,
        text,
        createdAt: serverTimestamp()
      });

      if (onUpdateConversationSnippet) {
        onUpdateConversationSnippet(chatId, text, Date.now());
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handlePointerDown = (message: MessageItem) => {
    if (message.uid !== currentUserUid) return;
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setUnsendTargetId(message.id);
    }, 550);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (message: MessageItem, event: React.MouseEvent) => {
    if (message.uid !== currentUserUid) return;
    event.preventDefault();
    setUnsendTargetId(message.id);
  };

  const handleExecuteUnsend = async (messageId: string) => {
    try {
      await remove(ref(db, `${dbPath}/${messageId}`));
    } catch (err) {
      console.error('Unsend error:', err);
    } finally {
      setUnsendTargetId(null);
    }
  };

  const formatTimestamp = (ts: number | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Direct Chat Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-3 bg-[#111e30] border-b border-[#24354c] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Back button to return to Inbox */}
          <button
            onClick={onBackToInbox}
            className="p-2 -ml-1 rounded-xl hover:bg-[#1a2c42] text-gray-300 hover:text-white transition active:scale-95 cursor-pointer shrink-0"
            title="Return to Inbox"
          >
            <ArrowLeft className="w-5 h-5 text-[#67e8c4]" />
          </button>

          {/* Partner profile header item */}
          <div
            onClick={() => {
              if (partner) {
                onViewProfile({
                  uid: partner.uid,
                  chatName: partner.name,
                  handle: partner.handle,
                  bio: partner.bio,
                  statusMessage: partner.statusMessage,
                  avatarColor: partner.avatarColor,
                  avatarEmoji: partner.avatarEmoji,
                  favoriteManual: partner.favoriteManual
                });
              }
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          >
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md border border-white/10"
                style={{ backgroundColor: partner?.avatarColor || (isLounge ? '#0284c7' : '#1f344d') }}
              >
                {isLounge ? '🏛️' : partner?.avatarEmoji || (partner?.name || 'M').slice(0, 1).toUpperCase()}
              </div>
              {!isLounge && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111e30] ${
                    partner?.online ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-white truncate leading-tight flex items-center gap-1.5">
                <span>{isLounge ? 'Keeish Community Lounge' : partner?.name || 'Direct Chat'}</span>
                {!isLounge && partner?.handle && (
                  <span className="text-xs font-mono text-gray-400 font-normal hidden sm:inline">
                    {partner.handle}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#67e8c4] flex items-center gap-1 mt-0.5">
                {isLounge ? (
                  <span className="text-gray-400">Public Room</span>
                ) : partner?.online ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active now</span>
                  </>
                ) : (
                  <span className="text-gray-400">Offline</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons: direct calling & profile */}
        {!isLounge && partner && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onStartCall(partner.uid, partner.name, 'audio')}
              className="p-2.5 rounded-xl bg-[#1d2f47] hover:bg-[#2b4466] text-[#67e8c4] transition active:scale-95 cursor-pointer"
              title={`Call ${partner.name}`}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartCall(partner.uid, partner.name, 'video')}
              className="p-2.5 rounded-xl bg-[#1d2f47] hover:bg-[#2b4466] text-[#67e8c4] transition active:scale-95 cursor-pointer"
              title={`Video call ${partner.name}`}
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Security Banner */}
      <div className="py-1 px-3 bg-[#0a121e] border-b border-[#1b2a3c] text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>{isLounge ? 'Public Community Lounge' : 'End-to-end Private Direct Chat · Tap message for details'}</span>
      </div>

      {/* Messages Thread */}
      <div
        onClick={() => setUnsendTargetId(null)}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-400 animate-pulse">
            Loading private messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            {isLounge ? 'No messages in community room yet. Start the conversation!' : `Say hello to ${partner?.name}!`}
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.uid === currentUserUid;

            return (
              <div
                key={message.id}
                onPointerDown={() => handlePointerDown(message)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onContextMenu={(e) => handleContextMenu(message, e)}
                onClick={() => {
                  if (isLongPressRef.current) {
                    isLongPressRef.current = false;
                    return;
                  }
                  setSelectedMessageForInfo(message);
                }}
                className={`relative group max-w-[85%] sm:max-w-[75%] p-3 cursor-pointer select-none transition ${
                  isMine
                    ? 'ml-auto rounded-[17px] rounded-br-[5px] bg-[#164b42] text-white shadow-sm'
                    : 'mr-auto rounded-[17px] rounded-bl-[5px] bg-[#1b2a40] text-gray-100 shadow-sm'
                }`}
              >
                {/* Sender Name in group room */}
                {isLounge && (
                  <div className="text-[11px] font-bold text-[#8de6cc] mb-1">
                    {isMine ? 'You' : message.senderName || 'Member'}
                  </div>
                )}

                {/* Text Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </div>

                {/* Timestamp */}
                <div className="text-[10px] text-[#a9b8cb] text-right mt-1">
                  {formatTimestamp(message.createdAt)}
                </div>

                {/* Unsend Overlay */}
                {unsendTargetId === message.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-30 right-2 -bottom-14 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#16243a] border border-[#43546c] shadow-2xl animate-in zoom-in-95"
                  >
                    <button
                      onClick={() => handleExecuteUnsend(message.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff5570] hover:bg-[#ff3b5b] text-white text-xs font-bold transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Unsend
                    </button>
                    <button
                      onClick={() => setUnsendTargetId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#2a3d57] hover:bg-[#395071] text-gray-200 text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <footer className="p-3 bg-[#111e30] border-t border-[#23354c] shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            maxLength={2000}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              const target = e.target;
              target.style.height = '50px';
              target.style.height = `${Math.min(target.scrollHeight, 130)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isLounge ? 'Message community lounge…' : `Message ${partner?.name || 'friend'}…`}
            className="flex-1 min-h-[50px] max-h-[130px] px-3.5 py-3 rounded-xl bg-[#0b1525] border border-[#35465e] text-white text-sm outline-none resize-none focus:border-[#67e8c4] transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-13 h-[50px] rounded-xl bg-[#67e8c4] hover:bg-[#54deb4] text-[#09271f] flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>

      {/* Message Info Modal */}
      <MessageInfoModal
        message={selectedMessageForInfo}
        onClose={() => setSelectedMessageForInfo(null)}
        currentUid={currentUserUid}
      />
    </div>
  );
};
