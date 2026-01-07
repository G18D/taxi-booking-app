'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [driversRes, analyticsRes] = await Promise.all([
        adminAPI.getAllDrivers(),
        adminAPI.getAnalytics(),
      ]);
      setDrivers(driversRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (driverId) => {
    try {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await adminAPI.verifyDriver(driverId, expiryDate.toISOString().split('T')[0]);
      fetchData();
    } catch (err) {
      console.error('Error verifying driver:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">🚕 Taxi VI - Admin</h1>
        <button onClick={() => {
          useAuthStore.getState().logout();
          router.push('/');
        }} className="btn-outline">
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Bookings</p>
            <p className="text-4xl font-bold text-primary mt-2">{analytics.totalBookings || 0}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-4xl font-bold text-primary mt-2">${analytics.totalRevenue || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Verified Drivers</p>
            <p className="text-4xl font-bold text-primary mt-2">{analytics.totalDrivers || 0}</p>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-6">Manage Drivers</h3>
          
          {loading ? (
            <p className="text-gray-600 text-center py-8">Loading drivers...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Medallion</th>
                    <th className="px-6 py-3 text-left font-semibold">Vehicle</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Rating</th>
                    <th className="px-6 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{driver.first_name} {driver.last_name}</td>
                      <td className="px-6 py-4">{driver.medallion_number}</td>
                      <td className="px-6 py-4">{driver.vehicle_type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          driver.medallion_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {driver.medallion_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">⭐ {driver.total_rating || 5.0}</td>
                      <td className="px-6 py-4">
                        {driver.medallion_status !== 'verified' && (
                          <button
                            onClick={() => handleVerifyDriver(driver.id)}
                            className="text-sm bg-primary text-white px-3 py-1 rounded hover:opacity-90"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
