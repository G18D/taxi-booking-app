# Taxi Booking Backend

Backend API server for the Taxi VI booking platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

3. Update the `.env` file with your actual credentials:
   - JWT_SECRET: Generate a secure random string
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_KEY: Your Supabase anon/public key
   - Payment provider keys (optional)

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Variables

Required:
- `JWT_SECRET`: Secret key for JWT token generation
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anon key

Optional:
- `PORT`: Server port (default: 5000)
- `STRIPE_SECRET_KEY`: For Stripe payments
- `PAYPAL_CLIENT_ID`: For PayPal payments
- `PAYPAL_CLIENT_SECRET`: For PayPal payments
- `PAYPAL_MODE`: 'sandbox' or 'live'

## API Endpoints

### Authentication
- `POST /api/auth/tourist/register` - Register tourist
- `POST /api/auth/tourist/login` - Login tourist
- `POST /api/auth/driver/register` - Register driver
- `POST /api/auth/driver/login` - Login driver

### Drivers
- `GET /api/drivers` - Get all active drivers
- `GET /api/drivers/:id` - Get driver profile with reviews
- `PATCH /api/drivers/:id/location` - Update driver location (auth required)
- `PATCH /api/drivers/:id/availability` - Toggle driver availability (auth required)

### Bookings
- `POST /api/bookings` - Create new booking (auth required)
- `GET /api/bookings/tourist/:touristId` - Get tourist bookings (auth required)
- `PATCH /api/bookings/:id/respond` - Driver respond to booking (auth required)
- `PATCH /api/bookings/:id/complete` - Complete booking (auth required)

### Payments
- `POST /api/payments/stripe` - Create Stripe payment intent (auth required)
- `POST /api/payments/paypal` - Create PayPal payment (auth required)

### Reviews
- `POST /api/reviews` - Submit driver review (auth required)

### Leaderboard
- `GET /api/leaderboard` - Get top drivers

### Admin
- `GET /api/admin/drivers` - Get all drivers (auth required)
- `PATCH /api/admin/drivers/:id/verify` - Verify driver medallion (auth required)
- `GET /api/admin/analytics` - Get platform analytics (auth required)

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `tourists` - Tourist user accounts
- `drivers` - Driver accounts with medallion info
- `bookings` - Ride bookings
- `reviews` - Driver reviews
- `payments` - Payment transactions

Refer to the Supabase migration files or schema documentation for detailed table structures.
