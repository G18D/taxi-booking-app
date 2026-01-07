'use client';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-blue-900 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-secondary mb-6">Login</h1>
        <form className="space-y-4">
          <input type="email" placeholder="Email" className="input-field" />
          <input type="password" placeholder="Password" className="input-field" />
          <button type="submit" className="btn-primary w-full">Login</button>
        </form>
      </div>
    </div>
  );
}