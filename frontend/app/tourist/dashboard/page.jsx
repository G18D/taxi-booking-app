'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { driverAPI, bookingAPI } from '@/lib/api';
import { useAuthStore, useDriverStore } from '@/lib/store';

// St. Thomas bounding coordinates
const ST_THOMAS_BOUNDS = {
  minLat: 18.3,
  maxLat: 18.4,
  minLng: -64.9,
  maxLng: -64.7,
};

export default function TouristDashboard() {
  const router = useRouter();
  const { user, userType } = useAuthStore();
  const { drivers, setDrivers } = useDriverStore();
  const [loading, setLoading] = useState(true);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    if (userType !== 'tourist') {
      router.push('/login');
    }
    fetchDrivers();
  }, [userType]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverAPI.getAll(18.35, -64.8, 15);
      setDrivers(response.data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (driverId) => {
    try {
      const booking = await bookingAPI.create({
        driverId,
        pickupLat: 18.35,
        pickupLng: -64.8,
        dropoffLat: 18.36,
        dropoffLng: -64.79,
        estimatedFare: 25.00,
      });
      router.push(`/tourist/booking/${booking.data.id}`);
    } catch (err) {
      console.error('Error booking ride:', err);
    }
  };

  if (userType !== 'tourist') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">🚕 Taxi VI - Tourist</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-secondary">Book a Ride</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup address"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Location</label>
                  <input
                    type="text"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    placeholder="Enter destination"
                    className="input-field"
                  />
                </div>

                <button
                  onClick={fetchDrivers}
                  className="btn-primary w-full"
                >
                  Find Drivers
                </button>

                {selectedDriver && (
                  <div className="bg-accent bg-opacity-10 p-4 rounded-lg border border-accent">
                    <p className="font-semibold">Selected Driver</p>
                    <p>{selectedDriver.first_name} {selectedDriver.last_name}</p>
                    <p className="text-sm text-gray-600">{selectedDriver.vehicle_type}</p>
                    <button
                      onClick={() => handleBookRide(selectedDriver.id)}
                      className="btn-primary w-full mt-4"
                    >
                      Book This Ride
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drivers List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-secondary">Available Drivers</h2>

            {loading ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">Loading drivers...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">No drivers available right now. Try again later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver)}
                    className={`card cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedDriver?.id === driver.id ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">
                          {driver.first_name} {driver.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{driver.vehicle_type}</p>
                        <p className="text-xs text-gray-500">Medallion: {driver.medallion_number}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent">
                          ⭐ {driver.total_rating || 5.0}
                        </div>
                        <p className="text-xs text-gray-600">{driver.total_bookings} rides</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="font-semibold">{driver.avg_professionalism || 5.0}</p>
                          <p className="text-xs text-gray-600">Professional</p>
                        </div>
                        <div>
                          <p className="font-semibold">{driver.avg_cleanliness || 5.0}</p>
                          <p className="text-xs text-gray-600">Clean</p>
                        </div>
                        <div>
                          <p className="font-semibold">{driver.avg_timeliness || 5.0}</p>
                          <p className="text-xs text-gray-600">Timely</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        handleBookRide(driver.id);
                      }}
                      className="btn-primary w-full mt-4"
                    >
                      Book Ride
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
