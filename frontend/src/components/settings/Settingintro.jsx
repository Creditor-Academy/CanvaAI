import React, { useState, useEffect, useMemo } from 'react';
import './Settingintro.css';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { getAvatarSource, getInitialsColors, generateDiceBearAvatar, DICEBEAR_STYLES } from './avatarUtils';

// const AVATAR_FILTERS = [
//   { key: 'all', label: 'All' },
//   { key: 'initials', label: 'Initials' },
//   { key: 'emoji', label: 'Emoji' },
// ];

// Generate DiceBear avatars with curated seeds for more predictable variety
// const generateDiceBearCatalog = () => {
//   const styles = ['adventurer', 'avataaars', 'bottts', 'fun', 'micah', 'personas', 'lorelei'];

// Seeds that tend to produce more masculine appearances
// const maleSeeds = [
//   'john', 'mike', 'david', 'james', 'robert', 'william', 'richard', 'joseph', 'thomas', 'charles',
//   'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth',
//   'kevin', 'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan', 'jacob',
//   'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin',
//   'samuel', 'frank', 'gregory', 'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler',
//   'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'zachary', 'peter', 'kyle', 'noah',
//   'alan', 'ethan', 'wayne', 'jordan', 'harold', 'dylan', 'sean', 'billy', 'jesse', 'ralph'
// ];

// Seeds that tend to produce more feminine appearances
// const femaleSeeds = [
//   'emily', 'sarah', 'jessica', 'jennifer', 'amanda', 'lisa', 'michelle', 'melissa', 'ashley', 'nicole',
//   'stephanie', 'elizabeth', 'heather', 'kimberly', 'amy', 'angela', 'rebecca', 'samantha', 'megan', 'rachel',
//   'christina', 'kelly', 'lauren', 'maria', 'katherine', 'andrea', 'julie', 'sarah', 'sara', 'karen',
//   'nancy', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura',
//   'emily', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra',
//   'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy',
//   'anna', 'sophia', 'olivia', 'isabella', 'emma', 'charlotte', 'amelia', 'mia', 'harper', 'evelyn'
// ];

// const catalog = [];

// // Generate male avatars - use first 70 seeds
// styles.forEach((style, styleIndex) => {
//   for (let i = 0; i < 10; i++) {
//     const seedIndex = (styleIndex * 10) + i;
//     const seed = maleSeeds[seedIndex % maleSeeds.length];
//     catalog.push({
//       id: `dicebear-${style}-male-${i}`,
//       label: `${style.charAt(0).toUpperCase() + style.slice(1)} ${i + 1}`,
//       value: `male-${seed}-${styleIndex}-${i}`,
//       type: 'dicebear',
//       style: style,
//       seed: seed,
//       isDiceBear: true,
//     });
//   }
// });

// Generate female avatars - use first 70 seeds
//   styles.forEach((style, styleIndex) => {
//     for (let i = 0; i < 10; i++) {
//       const seedIndex = (styleIndex * 10) + i;
//       const seed = femaleSeeds[seedIndex % femaleSeeds.length];
//       catalog.push({
//         id: `dicebear-${style}-female-${i}`,
//         label: `${style.charAt(0).toUpperCase() + style.slice(1)} ${i + 11}`,
//         value: `female-${seed}-${styleIndex}-${i}`,
//         type: 'dicebear',
//         style: style,
//         seed: seed,
//         isDiceBear: true,
//       });
//     }
//   });

//   return catalog;
// };

// const AVATAR_CATALOG = [
//   // DiceBear avatars
//   ...generateDiceBearCatalog(),

//   // Emoji-style avatars
//   { id: 'emoji-1', label: 'Rocket', value: '🚀', type: 'emoji' },
//   { id: 'emoji-2', label: 'Robot', value: '🤖', type: 'emoji' },
//   { id: 'emoji-3', label: 'Spark', value: '✨', type: 'emoji' },
//   { id: 'emoji-4', label: 'Star', value: '⭐', type: 'emoji' },
//   { id: 'emoji-5', label: 'Fire', value: '🔥', type: 'emoji' },

//   // Initials-based
//   { id: 'init-1', label: 'AT', value: 'AT', type: 'initials' },
//   { id: 'init-2', label: 'PS', value: 'PS', type: 'initials' },
//   { id: 'init-3', label: 'JD', value: 'JD', type: 'initials' },
//   { id: 'init-4', label: 'SM', value: 'SM', type: 'initials' },
// ];



const Settingintro = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  // const [selectedAvatar, setSelectedAvatar] = useState('AT');
  const [loading, setLoading] = useState(true);
  // const [avatarFilter, setAvatarFilter] = useState('all');
  // const [avatarSearch, setAvatarSearch] = useState('');
  // const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const tabs = ['Profile'];

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || ''
        });

        // ADD THIS
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

      } catch (error) {
        alert('Failed to load profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const updated = await api.updateProfile(profileData);
      setProfileData({
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        email: updated.email || ''
      });
      console.log('Profile updated successfully:', updated);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      await api.changePassword(passwordData);

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      alert('Password changed successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update password');
    }
  };

  // const filteredAvatars = useMemo(() => {
  //   const normalizedQuery = avatarSearch.trim().toLowerCase();

  //   return AVATAR_CATALOG.filter((option) => {
  //     const matchesFilter =
  //       avatarFilter === 'all'
  //         ? true
  //         : option.type === avatarFilter;
  //     const matchesSearch =
  //       !normalizedQuery ||
  //       option.label.toLowerCase().includes(normalizedQuery) ||
  //       (typeof option.value === 'string' &&
  //         option.value.toLowerCase().includes(normalizedQuery)) ||
  //       option.type.toLowerCase().includes(normalizedQuery) ||
  //       (option.style && option.style.toLowerCase().includes(normalizedQuery));

  //     return matchesFilter && matchesSearch;
  //   });
  // }, [avatarFilter, avatarSearch]);

  // const openAvatarModal = () => setIsAvatarModalOpen(true);
  // const closeAvatarModal = () => {
  //   setIsAvatarModalOpen(false);
  //   setAvatarSearch('');
  //   setAvatarFilter('all');
  // };
  // const saveAvatar = async () => {
  //   try {
  //     await api.updateProfile({ ...profileData, avatar: selectedAvatar });
  //     alert('Avatar updated successfully!');
  //   } catch (error) {
  //     console.error('Error updating avatar:', error);
  //     alert('Failed to update avatar. Please try again.');
  //   }
  //   closeAvatarModal();
  // };

  if (loading) {
    return (
      <div className="settings-container" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Get the selected avatar option to determine its type
  // const getSelectedAvatarOption = () => {
  //   return AVATAR_CATALOG.find(opt => opt.value === selectedAvatar);
  // };

  // Render the main avatar display
  // const renderMainAvatar = () => {
  //   // Check if selectedAvatar is a URL (starts with http)
  //   if (selectedAvatar && (selectedAvatar.startsWith('http://') || selectedAvatar.startsWith('https://'))) {
  //     return (
  //       <div className="avatar">
  //         <img
  //           src={selectedAvatar}
  //           alt="Avatar"
  //           style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
  //           onError={(e) => {
  //             // Fallback if URL fails
  //             e.target.style.display = 'none';
  //             const fallback = e.target.parentElement.querySelector('.avatar-fallback');
  //             if (fallback) fallback.style.display = 'flex';
  //           }}
  //         />
  //         <div className="avatar-fallback" style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
  //           <div className="avatar-initials">??</div>
  //         </div>
  //       </div>
  //     );
  //   }

  //   const selectedOption = getSelectedAvatarOption();

  //   // Handle DiceBear avatars (identified via isDiceBear flag regardless of filter)
  //   if (selectedOption?.isDiceBear) {
  //     const avatarSrc = generateDiceBearAvatar(
  //       selectedOption.seed || selectedAvatar,
  //       selectedOption.style || 'adventurer',
  //       140
  //     );
  //     return (
  //       <div className="avatar">
  //         <img
  //           src={avatarSrc}
  //           alt="Avatar"
  //           style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
  //           onError={(e) => {
  //             e.target.style.display = 'none';
  //             const fallback = e.target.parentElement.querySelector('.avatar-fallback');
  //             if (fallback) fallback.style.display = 'flex';
  //           }}
  //         />
  //         <div className="avatar-fallback" style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
  //           <div className="avatar-initials">??</div>
  //         </div>
  //       </div>
  //     );
  //   }

  //   const avatarSrc = getAvatarSource(selectedAvatar, selectedOption?.type, selectedOption?.style);

  //   if (selectedOption?.type === 'initials') {
  //     const colors = getInitialsColors(selectedAvatar);
  //     return (
  //       <div
  //         className="avatar"
  //         style={{
  //           background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
  //         }}
  //       >
  //         <div className="avatar-initials">{selectedAvatar}</div>
  //       </div>
  //     );
  //   }

  //   if (selectedOption?.type === 'emoji') {
  //     return (
  //       <div className="avatar" style={{ fontSize: '64px' }}>
  //         {selectedAvatar}
  //       </div>
  //     );
  //   }

  //   if (avatarSrc) {
  //     return (
  //       <div className="avatar">
  //         <img
  //           src={avatarSrc}
  //           alt="Avatar"
  //           style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
  //           onError={(e) => {
  //             e.target.style.display = 'none';
  //             const fallback = e.target.parentElement.querySelector('.avatar-fallback');
  //             if (fallback) fallback.style.display = 'flex';
  //           }}
  //         />
  //         <div className="avatar-fallback" style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
  //           <div className="avatar-initials">??</div>
  //         </div>
  //       </div>
  //     );
  //   }

  //   // Fallback
  //   return (
  //     <div className="avatar">
  //       <div className="avatar-initials">??</div>
  //     </div>
  //   );
  // };

  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="profile-mini-avatar">
          {(profileData.firstName?.[0] || '').toUpperCase()}
          {(profileData.lastName?.[0] || '').toUpperCase()}
        </div>
        <h2>Profile Information</h2>
        <p>Update your personal information and profile settings</p>
      </div>

      {/* <div className="avatar-section">
        <div className="avatar-container">
          {renderMainAvatar()}

          <div className="avatar-actions">
            <button className="change-avatar-btn" onClick={openAvatarModal}>Change Avatar</button>
            <p className="avatar-hint">Choose from our collection or use your own image URL</p>
          </div>
        </div>
      </div> */}

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={profileData.firstName}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              className="form-input input-base"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={profileData.lastName}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              className="form-input input-base"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={profileData.email}
            readOnly
            className="form-input input-base"

            title="Email cannot be changed"
          />
        </div>

        {/* <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={profileData.bio}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            className="form-textarea"
            rows="3"
            placeholder="Tell us about yourself..."
          />
        </div> */}

        {/* <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            value={profileData.website}
            onChange={(e) => handleProfileChange('website', e.target.value)}
            className="form-input"
            placeholder="https://yourwebsite.com"
          />
        </div> */}

        <div>
          <button className="save-btn" onClick={handleSaveProfile}>
            Save Changes
          </button>
          {/* <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Logout
          </button> */}
        </div>
        <div className="settings-section">
          <div className="section-header">
            <h2 className="section-title">Change Password</h2>
            <p className="section-description">
              Ensure your account stays secure with a strong password
            </p>
          </div>
          <div className="section-content">
            <div className="password-fields">
              {/* Current Password */}
              <div className="input-group">
                <label htmlFor="current-password" className="input-label">
                  Current Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="current-password"
                    autoComplete="new-password"
                    id="current-password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="password-input input-base"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('current')}
                    aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.current ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21M9.9 9.9C9.5 10.3 9.2 10.8 9.2 11.4C9.2 12.7 10.3 13.8 11.6 13.8C12.2 13.8 12.7 13.5 13.1 13.1M15.2 15.2C14.1 16.1 12.6 16.6 11 16.6C7.1 16.6 3.7 13.2 2 8.6C2.8 6.8 3.9 5.3 5.2 4.1L15.2 15.2ZM22 8.6C20.1 12.1 16.2 15.6 11 15.6C10.1 15.6 9.2 15.4 8.4 15.1L22 8.6ZM8.4 8.4L15.6 15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="input-group">
                <label htmlFor="new-password" className="input-label">
                  New Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    id="new-password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="password-input input-base"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('new')}
                    aria-label={showPasswords.newPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.new ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21M9.9 9.9C9.5 10.3 9.2 10.8 9.2 11.4C9.2 12.7 10.3 13.8 11.6 13.8C12.2 13.8 12.7 13.5 13.1 13.1M15.2 15.2C14.1 16.1 12.6 16.6 11 16.6C7.1 16.6 3.7 13.2 2 8.6C2.8 6.8 3.9 5.3 5.2 4.1L15.2 15.2ZM22 8.6C20.1 12.1 16.2 15.6 11 15.6C10.1 15.6 9.2 15.4 8.4 15.1L22 8.6ZM8.4 8.4L15.6 15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="input-group">
                <label htmlFor="confirm-password" className="input-label">
                  Confirm New Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    id="confirm-password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="password-input input-base"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility('confirm')}
                    aria-label={showPasswords.confirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.confirm ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21M9.9 9.9C9.5 10.3 9.2 10.8 9.2 11.4C9.2 12.7 10.3 13.8 11.6 13.8C12.2 13.8 12.7 13.5 13.1 13.1M15.2 15.2C14.1 16.1 12.6 16.6 11 16.6C7.1 16.6 3.7 13.2 2 8.6C2.8 6.8 3.9 5.3 5.2 4.1L15.2 15.2ZM22 8.6C20.1 12.1 16.2 15.6 11 15.6C10.1 15.6 9.2 15.4 8.4 15.1L22 8.6ZM8.4 8.4L15.6 15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              className="update-password-btn"
              onClick={handleUpdatePassword}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-hero">
      <div className="settings-container">
        <div className="glass-layer">

          <div className="settings-header">
            <div className="settings-title-row">
              <h1>Settings</h1>
            </div>
          </div>

          <div className="settings-content">
            {renderProfileTab()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settingintro;
