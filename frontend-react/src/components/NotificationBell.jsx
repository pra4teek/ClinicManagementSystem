import React, { useState, useEffect, useRef } from 'react';
import pharmacistService from '../services/pharmacistService.js';
import '../styles/notifications.css';

const BellSvg = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function NotificationBell({ role = 'Pharmacist', onNotificationClick, showToast }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const previousIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const fetchNotifications = async () => {
    try {
      const data = await pharmacistService.getNotifications(role);
      const list = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      const count = typeof data.unread_count === 'number' ? data.unread_count : list.filter(n => !n.IsRead).length;

      // Detect newly arrived unread notifications for audio/toast alert
      if (!initialLoadRef.current && showToast) {
        list.forEach(item => {
          if (!item.IsRead && !previousIdsRef.current.has(item.NotificationId)) {
            showToast(`${item.Title}: ${item.Message}`, 'info');
          }
        });
      }

      previousIdsRef.current = new Set(list.map(n => n.NotificationId));
      initialLoadRef.current = false;
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // silently handle network glitches
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    const handleCustomEvent = () => {
      fetchNotifications();
    };

    window.addEventListener('cms_rx_updated', handleCustomEvent);
    window.addEventListener('cms_stock_updated', handleCustomEvent);
    window.addEventListener('storage', handleCustomEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cms_rx_updated', handleCustomEvent);
      window.removeEventListener('cms_stock_updated', handleCustomEvent);
      window.removeEventListener('storage', handleCustomEvent);
    };
  }, [role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = async (notif) => {
    try {
      if (!notif.IsRead) {
        await pharmacistService.markNotificationRead(notif.NotificationId);
        setNotifications(prev => prev.map(n => n.NotificationId === notif.NotificationId ? { ...n, IsRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}

    setIsOpen(false);
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await pharmacistService.markAllNotificationsRead(role);
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return 'Just now';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className={`notif-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
      >
        <BellSvg size={19} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <div className="notif-title-wrap">
              <h4 className="notif-title">Notifications</h4>
              {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <ul className="notif-list">
            {notifications.length === 0 ? (
              <li className="notif-empty">No notifications for {role} portal.</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.NotificationId}
                  className={`notif-item ${!n.IsRead ? 'unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  {!n.IsRead && <span className="notif-dot" />}
                  <div className="notif-content">
                    <div className="notif-meta-row">
                      <span className={`notif-type-tag notif-type-${n.NotificationType || 'INFO'}`}>
                        {n.NotificationType?.replace(/_/g, ' ') || 'SYSTEM'}
                      </span>
                      <span className="notif-time">{formatTimestamp(n.CreatedAt)}</span>
                    </div>
                    <h5 className="notif-item-title">{n.Title}</h5>
                    <p className="notif-item-message">{n.Message}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
