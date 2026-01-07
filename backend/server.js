import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file with the required variables.');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const JWT_SECRET = process.env.JWT_SECRET;

// ========== UTILITY FUNCTIONS ==========

const generateToken = (userId, userType) => {
  return jwt.sign({ userId, userType }, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });

  req.user = decoded;
  next();
};

// ========== AUTH ROUTES ==========

// Tourist Register
app.post('/api/auth/tourist/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('tourists')
      .insert([{
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const token = generateToken(data.id, 'tourist');
    res.json({ user: data, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Tourist Login
app.post('/api/auth/tourist/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase
      .from('tourists')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, data.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(data.id, 'tourist');
    res.json({ user: data, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Driver Register
app.post('/api/auth/driver/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, medallionNumber, vehicleType, licensePlate, lat, lng } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('drivers')
      .insert([{
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
        medallion_number: medallionNumber,
        vehicle_type: vehicleType,
        license_plate: licensePlate,
        current_latitude: lat,
        current_longitude: lng,
        is_active: false,
        medallion_status: 'pending_verification',
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const token = generateToken(data.id, 'driver');
    res.json({ user: data, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Driver Login
app.post('/api/auth/driver/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, data.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(data.id, 'driver');
    res.json({ user: data, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== DRIVER ROUTES ==========

// Get all active drivers (with location filter for St. Thomas)
app.get('/api/drivers', async (req, res) => {
  try {
    const { lat, lng, radius = 15 } = req.query;
    
    let query = supabase
      .from('drivers')
      .select('*')
      .eq('is_active', true)
      .eq('medallion_status', 'verified');
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const filtered = data.filter(driver => {
      return driver.current_latitude >= 18.3 && 
             driver.current_latitude <= 18.4 &&
             driver.current_longitude >= -64.9 &&
             driver.current_longitude <= -64.7;
    });
    
    res.json(filtered);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get driver profile
app.get('/api/drivers/:id', async (req, res) => {
  try {
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('driver_id', req.params.id)
      .order('created_at', { ascending: false });
    
    const avgRatings = {
      professionalism: 0,
      cleanliness: 0,
      timeliness: 0,
    };
    
    if (reviews && reviews.length > 0) {
      reviews.forEach(review => {
        avgRatings.professionalism += review.professionalism_rating;
        avgRatings.cleanliness += review.cleanliness_rating;
        avgRatings.timeliness += review.timeliness_rating;
      });
      Object.keys(avgRatings).forEach(key => {
        avgRatings[key] /= reviews.length;
      });
    }
    
    res.json({ driver, reviews, avgRatings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update driver location
app.patch('/api/drivers/:id/location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (lat < 18.3 || lat > 18.4 || lng < -64.9 || lng > -64.7) {
      return res.status(400).json({ error: 'Location must be in St. Thomas' });
    }
    
    const { data, error } = await supabase
      .from('drivers')
      .update({
        current_latitude: lat,
        current_longitude: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle driver availability
app.patch('/api/drivers/:id/availability', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_active: isActive })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== BOOKING ROUTES ==========

// Create booking
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { driverId, pickupLat, pickupLng, dropoffLat, dropoffLng, estimatedFare } = req.body;
    
    const bookingId = uuidv4();
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        id: bookingId,
        tourist_id: req.user.userId,
        driver_id: driverId,
        pickup_latitude: pickupLat,
        pickup_longitude: pickupLng,
        dropoff_latitude: dropoffLat,
        dropoff_longitude: dropoffLng,
        estimated_fare: estimatedFare,
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get bookings for tourist
app.get('/api/bookings/tourist/:touristId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, drivers(first_name, last_name, vehicle_type, license_plate)')
      .eq('tourist_id', req.params.touristId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Driver accept/decline booking
app.patch('/api/bookings/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { response } = req.body;
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: response, responded_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete booking
app.patch('/api/bookings/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { finalFare, paymentMethod } = req.body;
    
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        final_fare: finalFare,
        payment_method: paymentMethod,
        completed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== PAYMENT ROUTES ==========

// Create Stripe payment intent
app.post('/api/payments/stripe', authMiddleware, async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { bookingId },
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create PayPal payment
app.post('/api/payments/paypal', authMiddleware, async (req, res) => {
  try {
    const { amount, bookingId, returnUrl, cancelUrl } = req.body;
    
    const payment = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      redirect_urls: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      transactions: [
        {
          amount: {
            total: amount.toFixed(2),
            currency: 'USD',
            details: {
              subtotal: amount.toFixed(2),
            },
          },
          description: `Taxi Booking: ${bookingId}`,
          custom: bookingId,
        },
      ],
    };
    
    paypal.payment.create(payment, (err, payment) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
      res.json({ approvalUrl: approvalUrl.href });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== REVIEW ROUTES ==========

// Create review
app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { driverId, bookingId, professionalismRating, cleanlinessRating, timelinessRating, comment } = req.body;
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        driver_id: driverId,
        tourist_id: req.user.userId,
        booking_id: bookingId,
        professionalism_rating: professionalismRating,
        cleanliness_rating: cleanlinessRating,
        timeliness_rating: timelinessRating,
        comment,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== LEADERBOARD ROUTES ==========

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { period = 'month', category = 'rating' } = req.query;
    
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, vehicle_type, medallion_number')
      .eq('medallion_status', 'verified')
      .order('total_rating', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    res.json(drivers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== ADMIN ROUTES ==========

// Get all drivers (for admin)
app.get('/api/admin/drivers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify driver medallion
app.patch('/api/admin/drivers/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { medallionExpiryDate } = req.body;
    
    const { data, error } = await supabase
      .from('drivers')
      .update({
        medallion_status: 'verified',
        medallion_expiry_date: medallionExpiryDate,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get analytics
app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  try {
    const { data: totalBookings, error: err1 } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'completed');
    
    const { data: totalRevenue, error: err2 } = await supabase
      .from('bookings')
      .select('final_fare')
      .eq('status', 'completed');
    
    const { data: totalDrivers, error: err3 } = await supabase
      .from('drivers')
      .select('id')
      .eq('medallion_status', 'verified');
    
    if (err1 || err2 || err3) throw new Error('Analytics error');
    
    const revenue = totalRevenue.reduce((sum, b) => sum + (b.final_fare || 0), 0);
    
    res.json({
      totalBookings: totalBookings.length,
      totalRevenue: revenue.toFixed(2),
      totalDrivers: totalDrivers.length,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ========== ERROR HANDLING MIDDLEWARE ==========

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ All required environment variables are set`);
});