import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

