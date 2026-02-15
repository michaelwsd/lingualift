'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, KeyRound, X, Check } from 'lucide-react';

const ADMIN_PASSWORD_KEY = 'lingualift-admin-password';
const DEFAULT_ADMIN_PASSWORD = 'admin1234';

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

function getUserRole(userId: string) {
  return localStorage.getItem(`lingualift-user-role-${userId}`);
}

export function ProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isTeacher = user ? getUserRole(user.id) === 'teacher' : false;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || '?';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full overflow-hidden border-2 border-stone-200 hover:border-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200/60 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.fullName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-stone-400 truncate">{user.emailAddresses[0]?.emailAddress}</p>
            </div>

            <div className="py-1">
              {isTeacher && (
                <button
                  onClick={() => { setOpen(false); setShowPasswordModal(true); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-stone-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-stone-400" />
                  Configure admin password
                </button>
              )}
              <button
                onClick={() => signOut({ redirectUrl: '/sign-in' })}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-stone-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-400" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && createPortal(
        <PasswordConfigModal onClose={() => setShowPasswordModal(false)} />,
        document.body
      )}
    </>
  );
}

function PasswordConfigModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setError('');

    if (currentPassword !== getAdminPassword()) {
      setError('Current password is incorrect');
      return;
    }
    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
    setSuccess(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-slate-900">Configure Admin Password</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {success ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Password updated successfully</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 text-sm text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 text-sm text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50/50 text-sm text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm new password"
              />
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <button
              onClick={handleSave}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-md transition-all duration-200 mt-1"
            >
              Update password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
