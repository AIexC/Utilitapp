# ⚡ Quick Start Guide

## 🎯 Get Running in 5 Minutes

### 1. Clone & Setup
```bash
git clone <your-repo>
cd airbnb-utilities/backend
npm install
```

### 2. Get Cloudinary Credentials
1. Go to https://cloudinary.com → Sign up (FREE)
2. Dashboard → Copy these 3 values:
   - Cloud Name
   - API Key
   - API Secret

### 3. Create .env File
```bash
cp .env.example .env
nano .env  # or use any editor
```

Fill in:
```env
DATABASE_URL=postgresql://localhost:5432/airbnb_utilities
JWT_SECRET=paste-long-random-string-here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Setup Database (Local)
```bash
# If you have PostgreSQL installed:
createdb airbnb_utilities

# If not, install PostgreSQL or use Railway for free database
```

### 5. Run!
```bash
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database schema initialized successfully
🚀 Server running on port 3000
```

### 6. Test It
```bash
# Health check
curl http://localhost:3000/health

# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

You'll get a token - save it!

### 7. Change Admin Password
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"YourNewPassword123!"}'
```

## 🎨 Using the API

### Create a Landlord
```bash
curl -X POST http://localhost:3000/api/landlords \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ion Popescu",
    "email": "ion@example.com",
    "phone": "0721123456",
    "bank_account": "RO49AAAA1B31007593840000"
  }'
```

### Create a Property
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Str. Victoriei 10",
    "address": "Strada Victoriei 10, București",
    "landlord_id": 1
  }'
```

### Create Rooms
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camera 1",
    "square_meters": 25,
    "property_id": 1
  }'
```

### Create a Shared Meter (Energy for whole property)
```bash
curl -X POST http://localhost:3000/api/meters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": 1,
    "utility_type": "electric",
    "meter_type": "shared",
    "split_method": "area"
  }'
```

### Add a Reading
```bash
curl -X POST http://localhost:3000/api/readings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meter_id": 1,
    "date": "2024-01-15",
    "previous_value": 1350,
    "current_value": 1500
  }'
```

### Upload a Bill (with image)
```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "property_id=1" \
  -F "utility_type=electric" \
  -F "date=2024-01-20" \
  -F "amount=145.50" \
  -F "consumption=150" \
  -F "image=@/path/to/bill.jpg"
```

### Get Dashboard Data
```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

curl http://localhost:3000/api/dashboard/monthly-by-landlord \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deploy to Railway

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Railway deployment guide.

Quick version:
1. Push to GitHub
2. Connect Railway to GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Done!

## 📚 Full Documentation

- [README.md](README.md) - Complete project documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- API routes in `/backend/routes/` - See source code for all endpoints

## 🆘 Common Issues

**"Cannot connect to database"**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env

**"Token expired"**
- Login again to get new token
- Tokens expire after 7 days

**"Access denied"**
- Check you're using correct token
- Verify user has property access (if not admin)

**"Image upload failed"**
- Verify Cloudinary credentials
- Check image size < 5MB
- Use correct Content-Type: multipart/form-data

## 💡 Tips

- Use Postman or Insomnia for easier API testing
- Check logs with `npm run dev` for detailed errors
- Database resets on schema changes (development)
- Admin can grant property access to regular users
- Shared meters auto-split costs by area

## Next Steps

1. ✅ API is running
2. Build frontend (React/Vue/etc)
3. Connect frontend to API
4. Deploy both to production
5. Add users and start tracking utilities!

---

Need help? Create a GitHub issue or check the full [README.md](README.md)
