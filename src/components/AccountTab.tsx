import React, { useState, useEffect } from 'react';
import { update, ref } from 'firebase/database';
import { db, BASE, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import {
  User,
  AtSign,
  Smile,
  Palette,
  Save,
  CheckCircle2,
  Smartphone,
  LogOut,
  ShieldCheck,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface AccountTabProps {
  currentUserUid: string;
  myProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onOpenApkCenter: () => void;
}

const AVATAR_COLORS = [
  '#67e8c4', // Emerald / Teal
  '#38bdf8', // Sky Blue
  '#818cf8', // Indigo
  '#f472b6', // Pink
  '#fbbf24', // Amber
  '#a78bfa', // Purple
  '#f87171'  // Coral
];

const EMOJI_PRESETS = ['💡', '❤️', '🚀', '🌟', '⚡', '🍀', '🎧', '🛡️', '☕', '🐱'];

export const AccountTab: React.FC<AccountTabProps> = ({
  currentUserUid,
  myProfile,
  onUpdateProfile,
  onOpenApkCenter
}) => {
  const [chatName, setChatName] = useState(myProfile.chatName || '');
  const [handle, setHandle] = useState(myProfile.handle || '');
  const [statusMessage, setStatusMessage] = useState(myProfile.statusMessage || 'Available for calls');
  const [bio, setBio] = useState(myProfile.bio || '');
  const [avatarColor, setAvatarColor] = useState(myProfile.avatarColor || '#67e8c4');
  const [avatarEmoji, setAvatarEmoji] = useState(myProfile.avatarEmoji || '💡');
  const [favoriteManual, setFavoriteManual] = useState(myProfile.favoriteManual || 'Tech Tips & Shortcuts');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setChatName(myProfile.chatName || '');
    setHandle(myProfile.handle || '');
    setStatusMessage(myProfile.statusMessage || 'Available for calls');
    setBio(myProfile.bio || '');
    setAvatarColor(myProfile.avatarColor || '#67e8c4');
    setAvatarEmoji(myProfile.avatarEmoji || '💡');
    setFavoriteManual(myProfile.favoriteManual || 'Tech Tips & Shortcuts');
  }, [myProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const formattedHandle = handle.trim().startsWith('@')
        ? handle.trim()
        : `@${handle.trim().replace(/\s+/g, '') || 'reader'}`;

      await onUpdateProfile({
        chatName: chatName.trim(),
        handle: formattedHandle,
        statusMessage: statusMessage.trim(),
        bio: bio.trim(),
        avatarColor,
        avatarEmoji,
        favoriteManual: favoriteManual.trim()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d1625] text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#213247] bg-[#111e30] shrink-0">
        <h2 className="text-lg font-extrabold text-white mb-0.5">Account &amp; Profile</h2>
        <p className="text-xs text-[#a6b5ca]">
          Customize your chatting persona, handle, avatar, and settings
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* Profile Card Preview */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#16273e] to-[#0e1a2b] border border-[#273d59] flex items-center gap-4 shadow-md">
          <div
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 border-2 border-white/20"
            style={{ backgroundColor: avatarColor }}
          >
            {avatarEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-lg sm:text-xl text-white truncate">
              {chatName || 'Your Name'}
            </h3>
            <p className="text-xs text-[#67e8c4] font-mono">
              {handle || '@handle'}
            </p>
            <p className="text-xs text-gray-300 italic truncate mt-1">
              "{statusMessage || 'Available for calls'}"
            </p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-3xl bg-[#122033] border border-[#233852] space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-[#67e8c4]" />
            <span>Edit Profile Details</span>
          </h4>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accName">
              Display Name
            </label>
            <input
              id="accName"
              type="text"
              required
              maxLength={30}
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accHandle">
              Username Handle
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                id="accHandle"
                type="text"
                maxLength={20}
                value={handle.replace(/^@/, '')}
                onChange={(e) => setHandle(`@${e.target.value.replace(/[^a-zA-Z0-9_]/g, '')}`)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accStatus">
              Status Message
            </label>
            <input
              id="accStatus"
              type="text"
              maxLength={60}
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Free for calls · Reading manuals"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accBio">
              About / Bio
            </label>
            <textarea
              id="accBio"
              rows={2}
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell friends about yourself…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none resize-none focus:border-[#67e8c4]"
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#67e8c4]" />
              Avatar Theme Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full transition active:scale-90 ${
                    avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#122033] scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Avatar Symbol Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[#67e8c4]" />
              Avatar Emoji Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-8 h-8 rounded-xl text-base flex items-center justify-center transition ${
                    avatarEmoji === emoji ? 'bg-[#213752] border-2 border-[#67e8c4]' : 'bg-[#091321] hover:bg-[#1a2c42]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Favorite manual */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1" htmlFor="accManual">
              Favorite Quick Manual
            </label>
            <input
              id="accManual"
              type="text"
              maxLength={40}
              value={favoriteManual}
              onChange={(e) => setFavoriteManual(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#091321] border border-[#283e58] text-sm text-white outline-none focus:border-[#67e8c4]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#67e8c4] hover:bg-[#52d6b1] text-[#09271f] font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes…' : 'Save Profile Changes'}
          </button>

          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Profile details saved successfully!</span>
            </div>
          )}
        </form>

        {/* Tools & Utilities */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#122033] border border-[#233852] space-y-3">
          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-1">
            Tools &amp; Disguise
          </h4>

          {/* Open APK Center button */}
          <button
            onClick={onOpenApkCenter}
            className="w-full p-3 rounded-2xl bg-[#17283d] hover:bg-[#203652] border border-[#263e5c] flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#67e8c4]/15 text-[#67e8c4]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Compilable APK Center</div>
                <div className="text-xs text-gray-400">Download Android Studio Gradle project (.ZIP)</div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-[#fbbf24]" />
          </button>

          {/* Camouflage info card */}
          <div className="p-3 rounded-2xl bg-[#091321] border border-[#1b2b40] flex items-center gap-3 text-xs text-gray-400">
            <BookOpen className="w-5 h-5 text-[#fbbf24] shrink-0" />
            <div>
              <span className="text-gray-300 font-semibold block">Camouflage Mode Active</span>
              <span>Disguised as "Tips — Manuals &amp; Quick Guides". Log out to relock.</span>
            </div>
          </div>
        </div>

        {/* Log out button */}
        <div className="pt-1 pb-4">
          <button
            onClick={() => signOut(auth)}
            className="w-full py-3 px-4 rounded-2xl bg-[#ff5570]/15 hover:bg-[#ff5570]/25 border border-[#ff5570]/30 text-[#ff8093] hover:text-white font-bold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out &amp; Lock Camouflage</span>
          </button>
        </div>

      </div>
    </div>
  );
};
