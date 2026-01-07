'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function DriverDashboard() {
  const router = useRouter();
  const { user, userType } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    rating: 5.0,
  });

  useEffect(() => {
    if (userType !== 'driver') {
      router.push('/login');
    }
  }, [userType, router]);

  if (userType !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">🚕 Taxi VI - Driver</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="text-gray-600 hover:text-primary">
            Home
          </button>
          <button onClick={() => {
            useAuthStore.getState().logout();
            router.push('/');
          }} className="btn-outline">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-8 py-8 max-w-6xl mx-auto">
        {/* Profile Section */}
        <div className="card mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{user?.first_name} {user?.last_name}</h2>
              <p className="text-gray-600">Medallion: {user?.medallion_number}</p>
              <p className="text-gray-600">Vehicle: {user?.vehicle_type} | License: {user?.license_plate}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-accent mb-2">⭐ {user?.total_rating || 5.0}</div>
              <p className="text-gray-600">Status: <span className={isAvailable ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {isAvailable ? '🟢 Available' : '🔴 Offline'}
              </span></p>
            </div>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold mb-4">Availability</h3>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={isAvailable ? 'btn-secondary' : 'btn-primary'}
          >
            {isAvailable ? '🔴 Go Offline' : '🟢 Go Online'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Bookings</p>
            <p className="text-4xl font-bold text-primary mt-2">{stats.totalBookings}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Total Earnings</p>
            <p className="text-4xl font-bold text-primary mt-2">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Avg Rating</p>
            <p className="text-4xl font-bold text-primary mt-2">{stats.rating}</p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-6">Recent Bookings</h3>
          <div className="text-center py-12 text-gray-600">
            <p>No bookings yet. Go online to receive booking requests!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
