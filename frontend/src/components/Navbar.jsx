import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  FiSettings,
  FiSearch,
  FiArrowLeft,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardNavbarConfig } from '../contexts/DashboardNavbarContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user: profile, logout } = useAuth();
  const { subtitle, back, search } = useDashboardNavbarConfig();

  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef(null);

  const userInitial = (
    profile?.firstName?.[0] ||
    profile?.email?.[0] ||
    'R'
  ).toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="w-full">
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-transparent px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Left — logo / title */}
        <div className="flex min-w-0 items-center gap-3">
          {back?.onClick && (
            <button
              type="button"
              onClick={back.onClick}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c0c7d3] bg-white text-[#121c2c] shadow-sm transition hover:border-[#005ea1]/40"
              aria-label="Go back"
            >
              <FiArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0">
            <h1
              className="cursor-pointer font-['Source_Serif_4',serif] text-2xl font-semibold leading-tight text-[#005ea1] sm:text-[32px]"
              onClick={() => navigate('/dashboard/home')}
            >
              Designova
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-[#414751]">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right — search + actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {search && (
            <div className="relative hidden sm:block">
              <FiSearch
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#717782]"
                size={18}
              />
              <input
                type="text"
                placeholder={search.placeholder || 'Search...'}
                value={search.value ?? ''}
                onChange={(e) => search.onChange?.(e.target.value)}
                className="w-56 rounded-full border-none bg-[#f0f3ff] py-2 pl-12 pr-4 text-base text-[#414751] outline-none transition focus:ring-2 focus:ring-[#005ea1] lg:w-72"
              />
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/settings')}
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#dee8ff]"
              aria-label="Settings"
            >
              <FiSettings size={20} className="text-[#121c2c]" />
            </button>

            <div className="relative ml-1" ref={profileRef}>
              <button
                type="button"
                onClick={() => setOpenProfile((v) => !v)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#2178c3] text-sm font-bold text-white shadow-sm"
                aria-label="Profile menu"
              >
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </button>

              {openProfile && (
                <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2178c3] text-base font-bold text-white">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {profile?.firstName
                          ? `${profile.firstName} ${profile.lastName || ''}`
                          : profile?.email?.split('@')[0]}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-400">
                        {profile?.email}
                      </div>
                    </div>
                  </div>

                  <div className="py-1.5 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/dashboard/settings', { state: { profile } });
                        setOpenProfile(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                    >
                      <FiUser size={16} />
                      Personal Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50"
                    >
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search */}
      {search && (
        <div className="relative px-4 pb-2 sm:hidden sm:px-6 lg:px-8 xl:px-10">
          <FiSearch
            className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-[#717782]"
            size={18}
          />
          <input
            type="text"
            placeholder={search.placeholder || 'Search...'}
            value={search.value ?? ''}
            onChange={(e) => search.onChange?.(e.target.value)}
            className="w-full rounded-full border-none bg-[#f0f3ff] py-2 pl-12 pr-4 text-base text-[#414751] outline-none focus:ring-2 focus:ring-[#005ea1]"
          />
        </div>
      )}
    </div>
  );
};

export default Navbar;
