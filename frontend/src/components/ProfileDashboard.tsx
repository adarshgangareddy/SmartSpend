import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Sparkles,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  Edit3,
  X,
  FileText,
} from 'lucide-react';
import { AuthUser, authService } from '../services/auth';
import { api } from '../services/api';
import { useNotification } from './NotificationToast';

interface ProfileDashboardProps {
  user: AuthUser | null;
  onProfileUpdate: (updatedUser: AuthUser) => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  user,
  onProfileUpdate,
}) => {
  const { success, error, info } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [location, setLocation] = useState<string>(user?.location || '');
  const [dob, setDob] = useState<string>(user?.dob || '');

  // Photo States
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const displayName = fullName || user?.fullName || user?.email?.split('@')[0] || 'User';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'U';

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsEditing(true);
  };

  // Handle Removing Photo
  const handleRemovePhoto = async () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (!isEditing) {
      setIsSaving(true);
      try {
        await api.updateProfile({ avatar_url: null });
        const updated: AuthUser = {
          ...user!,
          avatarUrl: undefined,
        };
        localStorage.setItem('smartspend_auth_user', JSON.stringify(updated));
        onProfileUpdate(updated);
        success('Profile photo removed.');
      } catch (err: any) {
        error(err.message || 'Failed to remove photo.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Save All Profile Information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatarUrl = user?.avatarUrl;

      // Upload photo if a new file was chosen
      if (avatarFile && user?.id) {
        setIsUploadingPhoto(true);
        finalAvatarUrl = await authService.uploadAvatar(avatarFile, user.id);
        setIsUploadingPhoto(false);
      } else if (avatarPreview === null) {
        finalAvatarUrl = undefined;
      }

      // Update backend profile
      await api.updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        dob: dob || null,
        avatar_url: finalAvatarUrl,
      });

      const updatedUser: AuthUser = {
        ...user!,
        fullName: fullName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        dob: dob,
        avatarUrl: finalAvatarUrl,
      };

      localStorage.setItem('smartspend_auth_user', JSON.stringify(updatedUser));
      onProfileUpdate(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      success('Profile updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(user?.fullName || '');
    setBio(user?.bio || '');
    setPhone(user?.phone || '');
    setLocation(user?.location || '');
    setDob(user?.dob || '');
    setAvatarPreview(user?.avatarUrl || null);
    setAvatarFile(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
            Profile
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1 font-medium">
            Manage your personal profile, identity, and security credentials
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-glass flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* SECTION A: PROFILE OVERVIEW CARD */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-glass border border-white/90">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Area with Image Upload trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-linear-to-tr from-[#E7DFEE] to-white p-1 shadow-glass border-2 border-white/90 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-4xl sm:text-5xl font-black text-primary select-none">
                  {initialLetter}
                </span>
              )}
            </div>

            {/* Change Photo Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile picture"
              className="absolute inset-0 rounded-full bg-[#302C49]/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition-opacity cursor-pointer backdrop-blur-2xs"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span>Change</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* User Primary Details */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight truncate">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EBF5EA] text-[#55823D] border border-[#75A65A]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary font-semibold mb-3">
              {user?.email || 'Email address connected'}
            </p>

            {bio ? (
              <p className="text-xs sm:text-sm text-text-primary/90 font-medium italic max-w-xl leading-relaxed mb-4">
                "{bio}"
              </p>
            ) : (
              <p className="text-xs text-text-muted font-medium italic mb-4">
                No personal bio added yet. Click edit to introduce yourself.
              </p>
            )}

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-bold text-text-secondary">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/60 border border-white">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Provider: {user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}</span>
              </span>

              {location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/60 border border-white">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{location}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/60 border border-white">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Active Member</span>
              </span>
            </div>
          </div>
        </div>

        {/* Photo Action Buttons */}
        {avatarPreview && isEditing && (
          <div className="mt-4 pt-4 border-t border-white/60 flex items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-primary bg-white/80 hover:bg-white border border-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Replace Photo</span>
            </button>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-expense bg-[#FBEEEC] hover:bg-[#F8E2E0] border border-expense/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION B & D: PERSONAL INFORMATION & EDIT FORM */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90">
        <div className="flex items-center justify-between pb-4 border-b border-white/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-light text-primary shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Personal Information</h2>
              <p className="text-xs text-text-secondary">
                {isEditing ? 'Update your personal details below' : 'View your stored profile information'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Full Display Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adarsh"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isEditing
                      ? 'bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary shadow-2xs'
                      : 'bg-white/40 border border-white text-text-primary cursor-default'
                  }`}
                />
                <User className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Email Address (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Email Address (Managed by Authentication)
              </label>
              <div className="relative">
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/35 border border-white text-sm font-semibold text-text-secondary cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isEditing
                      ? 'bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary shadow-2xs'
                      : 'bg-white/40 border border-white text-text-primary cursor-default'
                  }`}
                />
                <Phone className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Location (Optional) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Location / City (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore, India"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isEditing
                      ? 'bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary shadow-2xs'
                      : 'bg-white/40 border border-white text-text-primary cursor-default'
                  }`}
                />
                <MapPin className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date of Birth (Optional) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Date of Birth (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  disabled={!isEditing}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isEditing
                      ? 'bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary shadow-2xs'
                      : 'bg-white/40 border border-white text-text-primary cursor-default'
                  }`}
                />
                <Calendar className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bio / About Me */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
              Bio / About Me (Optional, max 500 characters)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                disabled={!isEditing}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short note about yourself or your financial tracking habits..."
                className={`w-full p-4 rounded-2xl text-sm font-semibold transition-all ${
                  isEditing
                    ? 'bg-white/80 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary shadow-2xs'
                    : 'bg-white/40 border border-white text-text-primary cursor-default'
                }`}
              />
            </div>
            {isEditing && (
              <p className="text-[11px] text-text-secondary text-right mt-1 mr-1">
                {bio.length}/500 characters
              </p>
            )}
          </div>

          {/* Action Buttons in Edit Mode */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary bg-white/60 hover:bg-white border border-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-glass flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

