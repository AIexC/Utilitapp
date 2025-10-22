# 🎉 Airbnb Utilities Management System

Aplicația ta completă este gata! 🚀

## 📁 Ce ai primit:

```
airbnb-utilities/
├── 📖 START_HERE.md          ← Citești asta acum
├── 📖 README.md               ← Documentație completă
├── 📖 QUICK_START.md          ← Ghid rapid (5 minute)
├── 📖 DEPLOYMENT.md           ← Ghid deployment Railway
├── 🔧 backend/                ← Codul backend (Node.js + Express)
│   ├── server.js             ← Server principal
│   ├── database.js           ← PostgreSQL + Schema
│   ├── routes/               ← API endpoints
│   │   ├── auth.js          ← Autentificare JWT
│   │   ├── users.js         ← Admin gestionare useri
│   │   ├── landlords.js     ← Landlord-i
│   │   ├── properties.js    ← Proprietăți + acces
│   │   ├── rooms.js         ← Camere
│   │   ├── meters.js        ← Contoare
│   │   ├── readings.js      ← Citiri
│   │   ├── bills.js         ← Facturi + Cloudinary
│   │   ├── utilityPrices.js ← Prețuri utilități
│   │   └── dashboard.js     ← Dashboard data
│   ├── package.json          ← Dependencies
│   ├── .env.example          ← Template variabile
│   ├── hashPassword.js       ← Utilitar parole
│   └── test-api.sh           ← Script test API
└── 🎨 frontend/               ← Aici vei face frontend-ul React
```

## ⚡ START RAPID (Alege-ți calea):

### Opțiunea 1: Deploy Direct pe Railway (Recomandat) 🚀

**Timp: 5 minute**

1. **Cloudinary** (gratuit):
   - Mergi la https://cloudinary.com → Sign up
   - Dashboard → Copiază: Cloud Name, API Key, API Secret

2. **Railway** (gratuit):
   - Mergi la https://railway.app → Sign up
   - "New Project" → "Deploy from GitHub repo"
   - Conectează repo-ul tău
   - "New" → "Database" → "Add PostgreSQL"

3. **Environment Variables** (în Railway):
   ```
   NODE_ENV=production
   JWT_SECRET=genereaza-cu-node-vezi-mai-jos
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Generează JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Gata!** Railway îți dă un URL: `https://your-app.up.railway.app`

**Vezi detalii complete în [DEPLOYMENT.md](DEPLOYMENT.md)**

---

### Opțiunea 2: Testare Locală (Pentru Development) 💻

**Timp: 10 minute**

1. **Instalează PostgreSQL** (dacă nu ai):
   - Mac: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: https://www.postgresql.org/download/

2. **Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   nano .env  # editează cu credențialele tale
   ```

3. **Creează database**:
   ```bash
   createdb airbnb_utilities
   ```

4. **Rulează**:
   ```bash
   npm start
   ```

5. **Test**:
   ```bash
   curl http://localhost:3000/health
   ```

**Vezi detalii complete în [QUICK_START.md](QUICK_START.md)**

---

## 🎯 Ce face aplicația:

### ✅ Functionalități Backend Complete:

1. **Autentificare & Autorizare**:
   - Login cu JWT tokens (7 zile valabilitate)
   - Admin poate crea useri
   - Admin poate da acces pe proprietăți specifice
   - Useri văd doar proprietățile lor

2. **Gestiune Structură**:
   - Landlord-i (nume, email, telefon, cont bancar)
   - Proprietăți (adresă, landlord asociat)
   - Camere (nume, mp)
   - Contoare (comune sau individuale)

3. **Contoare Inteligente**:
   - **Contor Comun**: Un contor pentru toate camerele
     - Împărțire pe mp (recomandat)
     - Împărțire egală
     - Împărțire custom (%)
   - **Contor Individual**: Fiecare cameră are contor propriu

4. **Citiri & Calcule**:
   - Introduci indexi (anterior + curent)
   - Calcul automat cost pe fiecare cameră
   - Breakdown detaliat

5. **Facturi**:
   - Upload poză pe Cloudinary
   - Comparație automată cu citrile tale
   - Actualizare automată prețuri
   - Marcare ca verificat

6. **Dashboard & Rapoarte**:
   - Total pe landlord
   - Breakdown pe proprietate
   - Breakdown pe cameră
   - Statistici lunare

### 🔐 User Credentials Inițiale:

```
Username: admin
Password: admin123
```

⚠️ **Schimbă parola imediat după primul login!**

---

## 📚 Documentație Completă:

| Fișier | Descriere |
|--------|-----------|
| [README.md](README.md) | Documentație completă tehnică |
| [QUICK_START.md](QUICK_START.md) | Ghid rapid cu exemple API |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment pe Railway pas cu pas |

---

## 🔄 Următorii Pași:

### 1. Deploy Backend (5 min)
- [ ] Setup Cloudinary
- [ ] Deploy pe Railway
- [ ] Adaugă PostgreSQL
- [ ] Setează environment variables
- [ ] Test API

### 2. Schimbă Parola Admin (1 min)
```bash
curl -X POST https://your-app.up.railway.app/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"NewPassword123!"}'
```

### 3. Creează Useri
- Admin creează useri
- Admin dă acces pe proprietăți
- Userii se loghează și încep să lucreze

### 4. Construiește Frontend (Opțional)
- React/Vue/Angular/Next.js
- Conectează la API-ul tău
- Interfață user-friendly

---

## 🆘 Need Help?

### Probleme Comune:

**"Cannot connect to database"**
→ Verifică DATABASE_URL în environment variables

**"Cloudinary upload failed"**
→ Verifică credentials Cloudinary

**"Unauthorized"**
→ Token expirat, loghează-te din nou

**"Access denied to property"**
→ Admin trebuie să-ți dea acces

### Support:
- 📖 Citește documentația completă
- 🐛 Creează issue pe GitHub
- 💬 Contactează-ne

---

## 🎨 API Endpoints Principale:

```
POST   /api/auth/login                    ← Login
GET    /api/auth/me                       ← User curent
GET    /api/properties                    ← Proprietăți accesibile
GET    /api/rooms/property/:id            ← Camere proprietate
GET    /api/meters/property/:id           ← Contoare proprietate
POST   /api/readings                      ← Adaugă citire
POST   /api/bills                         ← Adaugă factură (+ imagine)
GET    /api/dashboard/monthly-by-landlord ← Dashboard
```

Vezi [QUICK_START.md](QUICK_START.md) pentru exemple complete cu curl!

---

## ✨ Features Premium:

- ✅ Multi-property management
- ✅ Shared & individual meters
- ✅ Area-based cost splitting
- ✅ User access control per property
- ✅ Cloudinary image storage
- ✅ Auto price updates
- ✅ Bill verification
- ✅ Monthly reports by landlord
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Ready for Railway deployment

---

## 🚀 GO LIVE NOW!

**Cel mai rapid mod să începi:**

1. Push pe GitHub
2. Deploy pe Railway (click, click, done!)
3. Test cu Postman
4. Invită useri
5. Start tracking utilities!

**Succes! 🎉**
