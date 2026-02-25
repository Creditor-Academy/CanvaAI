// import React, { useState } from 'react';
// import './Settinghero.css';
// import api from '../../services/api';

// const Settinghero = () => {
//   // const [website, setWebsite] = useState('https://alexthompson.design');
  
  

//   // const handleWebsiteChange = (e) => {
//   //   setWebsite(e.target.value);
//   // };

//   const handlePasswordChange = (field, value) => {
//     setPasswords(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const togglePasswordVisibility = (field) => {
//     setShowPasswords(prev => ({
//       ...prev,
//       [field]: !prev[field]
//     }));
//   };

//   // const handleSaveWebsite = () => {
//   //   console.log('Saving website:', website);
//   //   // Add save logic here
//   // };

//   const handleUpdatePassword = async () => {
//     // Validate passwords
//     if (!passwords.current || !passwords.new || !passwords.confirm) {
//       alert('Please fill in all password fields');
//       return;
//     }

//     if (passwords.new !== passwords.confirm) {
//       alert('New password and confirm password do not match');
//       return;
//     }

//     if (passwords.new.length < 6) {
//       alert('New password must be at least 6 characters long');
//       return;
//     }

//     try {
//       await api.changePassword({
//         currentPassword: passwords.current,
//         newPassword: passwords.new,
//         confirmPassword: passwords.confirm
//       });
      
//       // Clear password fields on success
//       setPasswords({
//         current: '',
//         new: '',
//         confirm: ''
//       });
      
//       alert('Password changed successfully!');
//       console.log('Password updated successfully');
//     } catch (error) {
//       console.error('Error updating password:', error);
//       const errorMessage = error.message || 'Failed to update password. Please try again.';
//       alert(errorMessage);
//     }
//   };

//   return (
//     <div className="settings-hero">
//       <div className="settings-container">
//         {/* Website Section */}
//         {/* <div className="settings-section">
//           <div className="section-header">
//             <h2 className="section-title">Website</h2>
//           </div>
//           <div className="section-content">
//             <div className="input-group">
//               <input
//                 type="url"
//                 value={website}
//                 onChange={handleWebsiteChange}
//                 className="website-input"
//                 placeholder="https://yourwebsite.com"
//               />
//             </div>
//             <button 
//               className="save-btn"
//               onClick={handleSaveWebsite}
//             >
//               Save Changes
//             </button>
//           </div>
//         </div> */}

//         {/* Change Password Section */}
        
//       </div>
//     </div>
//   );
// };

// export default Settinghero;
