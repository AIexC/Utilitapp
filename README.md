# 🏠 Airbnb Utilities Management System

Full-stack application for managing utilities across multiple Airbnb properties with shared and individual meters, user access control, and bill tracking.

## 🎯 Features

- **Multi-property Management**: Manage multiple properties with multiple rooms
- **Shared & Individual Meters**: Support for both shared (split by area/equal) and individual meters
- **User Access Control**: Admin can create users and grant access to specific properties
- **Bill Tracking**: Upload bill images to Cloudinary and auto-compare with readings
- **Auto Price Updates**: Utility prices update automatically from bills
- **Dashboard & Reports**: Comprehensive dashboard with landlord breakdowns and consumption analytics

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **File Storage**: Cloudinary
- **Deployment**: Railway

## 📦 Project Structure

```
airbnb-utilities/
├── backend/
│   ├── server.js          # Main Express server
│   ├── database.js        # PostgreSQL connection & schema
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication
│   │   ├── users.js       # User management
│   │   ├── landlords.js   # Landlords
│   │   ├── properties.js  # Properties
│   │   ├── rooms.js       # Rooms
│   │   ├── meters.js      # Meters
│   │   ├── readings.js    # Meter readings
│   │   ├── bills.js       # Bills with Cloudinary
│   │   ├── utilityPrices.js
│   │   └── dashboard.js   # Dashboard data
│   ├── package.json
│   └── .env.example
├── frontend/              # React frontend (to be created)
└── README.md
```

## 🚀 Deployment to Railway

### Step 1: Prepare Cloudinary

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### Step 2: Deploy Backend to Railway

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway automatically sets `DATABASE_URL` environment variable

### Step 4: Set Environment Variables

In Railway dashboard, go to your backend service → Variables:

```env
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-frontend-url.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Database Initialization

The database will auto-initialize on first run with:
- All required tables
- Default utility prices
- Admin user: `username: admin`, `password: admin123`

⚠️ **Change admin password immediately after first login!**

## 🔧 Local Development

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Database Setup (Local)

If using local PostgreSQL:

```bash
# Create database
createdb airbnb_utilities

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://localhost:5432/airbnb_utilities
```

## 📚 API Documentation

### Authentication

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
Returns: `{ "token": "...", "user": {...} }`

**GET /api/auth/me**
Headers: `Authorization: Bearer <token>`

### Users (Admin Only)

**GET /api/users** - Get all users
**POST /api/users** - Create user
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**POST /api/users/:id/property-access** - Grant property access
```json
{
  "propertyId": 1
}
```

### Properties

**GET /api/properties** - Get accessible properties
**POST /api/properties** - Create property
**PUT /api/properties/:id** - Update property
**DELETE /api/properties/:id** - Delete property

### Rooms

**GET /api/rooms/property/:propertyId** - Get rooms for property
**POST /api/rooms** - Create room
**PUT /api/rooms/:id** - Update room
**DELETE /api/rooms/:id** - Delete room

### Meters

**GET /api/meters/property/:propertyId** - Get meters for property
**POST /api/meters** - Create meter
```json
{
  "property_id": 1,
  "utility_type": "electric",
  "meter_type": "shared",
  "split_method": "area"
}
```

### Readings

**GET /api/readings?property_id=1&start_date=2024-01-01** - Get readings
**POST /api/readings** - Create reading
```json
{
  "meter_id": 1,
  "date": "2024-01-15",
  "current_value": 1500,
  "previous_value": 1350
}
```

### Bills

**GET /api/bills?property_id=1** - Get bills
**POST /api/bills** - Create bill with image
- Content-Type: `multipart/form-data`
- Fields: `property_id`, `utility_type`, `date`, `amount`, `consumption`, `image`

**PATCH /api/bills/:id/verify** - Verify bill
```json
{
  "verified": true
}
```

### Dashboard

**GET /api/dashboard/summary** - Get summary stats
**GET /api/dashboard/monthly-by-landlord** - Get monthly costs by landlord
**GET /api/dashboard/recent-activity** - Get recent readings & bills

## 🔐 User Roles

### Admin
- Create/manage users
- Grant property access to users
- Full access to all properties
- Manage landlords, properties, rooms, meters

### User
- Access only assigned properties
- Create readings and bills
- View reports for accessible properties

## 💡 Usage Flow

1. **Admin** creates landlords
2. **Admin** creates properties and assigns to landlords
3. **Admin** adds rooms to properties
4. **Admin** adds meters (shared or individual) to properties
5. **Admin** creates users and grants property access
6. **User** logs in and sees their accessible properties
7. **User** enters meter readings monthly
8. **User** uploads bills when received
9. **System** auto-compares bills with readings
10. **User** views dashboard with landlord breakdowns

## 🐛 Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL is running
- Check firewall/network settings

### Cloudinary Upload Fails
- Verify credentials in environment variables
- Check image file size (max 5MB)
- Ensure proper MIME type

### Authentication Errors
- Check `JWT_SECRET` is set
- Verify token is sent in `Authorization: Bearer <token>` header
- Check user is active

## 📝 License

MIT

## 👥 Support

For issues, please create a GitHub issue or contact support.
