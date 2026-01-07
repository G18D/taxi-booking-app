'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-blue-900">
      <nav className="flex justify-between items-center px-8 py-6 bg-black bg-opacity-20">
        <h1 className="text-3xl font-bold text-accent">🚕 Taxi VI</h1>
        <div className="flex gap-4">
          <Link href="/login" className="btn-outline">
            Login
          </Link>
          <Link href="/" className="btn-primary">
            Book
          </Link>
        </div>
      </nav>

      <section className="px-8 py-20 text-center text-white">
        <h2 className="text-5xl font-bold mb-6">Licensed Taxis, Anytime</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Book verified taxis in St. Thomas instantly.
        </p>
        <Link href="/" className="btn-primary bg-accent text-black inline-block">
          Book a Ride
        </Link>
      </section>

      <section className="px-8 py-20 bg-white">
        <h3 className="text-4xl font-bold text-center mb-16 text-secondary">Why Choose Taxi VI?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="card">
            <h4 className="text-2xl font-bold mb-4 text-primary">✅ Verified</h4>
            <p className="text-gray-600">Licensed drivers</p>
          </div>
          <div className="card">
            <h4 className="text-2xl font-bold mb-4 text-primary">⭐ Rated</h4>
            <p className="text-gray-600">Real reviews</p>
          </div>
          <div className="card">
            <h4 className="text-2xl font-bold mb-4 text-primary">💳 Safe</h4>
            <p className="text-gray-600">Secure payments</p>
          </div>
        </div>
      </section>

      <footer className="bg-black bg-opacity-40 text-white px-8 py-8 text-center">
        <p>&copy; 2024 Taxi Booking VI</p>
      </footer>
    </div>
  );
}
