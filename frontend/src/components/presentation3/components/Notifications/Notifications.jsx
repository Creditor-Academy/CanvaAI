import React, { useState, useEffect } from "react";
import { useUIStore } from "../../store/useUIStore";
import "./notifications.css";

export default function Notifications() {
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    const timers = [];
    
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 3000);
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}