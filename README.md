# EthioMarket — Agricultural Technology Marketplace Platform

**EthioMarket** is a full-stack agricultural exchange engineered specifically for Ethiopia. It connects **Farmers/Producers**, **Wholesale & Commercial Buyers**, **Transporters**, and **Platform Administrators** on a single unified platform with tailored, role-specific workspaces and workflows.

---

## 🌟 Key Product Features

1. **Role-Based Workspaces & Contexts**:
   - **Farmer Workspace (`/dashboard/farmer`)**: Farm revenue analytics, produce listing management (ETB pricing, units in Quintals/KG/Crates/Sacks, crop varieties), incoming buyer orders, and real-time quotation negotiation drawers.
   - **Buyer Procurement (`/dashboard/buyer`)**: Wholesale procurement tracking, active orders with transporter dispatch milestones, quote counter-offers, and supplier directory.
   - **Transporter Logistics (`/dashboard/transporter`)**: Fleet registration (Isuzu, FSR, Pickups), browse available regional cargo delivery jobs (e.g. Meki to Addis Ababa, Bishoftu to Merkato), claim haulage jobs, and record live tracking progression (Picked Up → In Transit → Delivered).
   - **Platform Administration (`/dashboard/admin`)**: Real-time GMV and order volume charts (Recharts), seller & farmer KYC verification approvals, account status control, and tamper-evident audit logs.

2. **Marketplace & Price Discovery (`/marketplace`)**:
   - Filter by produce category (Vegetables, Grains & Cereals, Specialty Coffee, Fruits, Pulses & Oilseeds, Spices & Honey).
   - Filter by Ethiopian administrative regions (Oromia, Amhara, Sidama, SNNPR, Addis Ababa, Tigray, Dire Dawa).
   - Support for Ethiopian measurement units: **Quintal (100kg)**, **Kilogram (kg)**, **Crate**, **Sack**, **Metric Ton**.
   - Dual action flow: **Request Bulk Quote & Negotiate** or **Direct Checkout (Buy Now)** with Cash-on-Delivery, Telebirr, and CBE Birr payment options.

3. **1-Click Demo Evaluation Switcher**:
   - The top navigation bar includes an instant role switcher allowing anyone to test all 4 role experiences seamlessly without repeatedly logging in and out.
   - Pre-seeded realistic demo accounts:
     - **Farmer**: `farmer@ethiomarket.et` (Abebe Bikila · Rift Valley Organic Agro)
     - **Buyer**: `buyer@ethiomarket.et` (Almaz Kebede · Addis Fresh Produce Supply)
     - **Transporter**: `transporter@ethiomarket.et` (Kebede Tessema · Abyssinia Fast Cargo)
     - **Admin**: `admin@ethiomarket.et` (Dan Eail · Platform Operations)
     - Password for all demo accounts: `Password123!`

4. **Bilingual Ready**:
   - Interactive language toggle in the header supporting **English** and **Amharic (አማርኛ)**.

---

## 🏗️ Architecture & Technology Stack

```
ETHIOMARKET/
├── client/                      # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProductCard, Modals
│   │   ├── context/            # AuthContext (RBAC), LanguageContext (EN/AM)
│   │   ├── pages/              # HomePage, Marketplace, ProductDetail, Dashboards
│   │   ├── services/           # api.js client
│   │   └── index.css           # Deep agricultural green & warm off-white design system
├── server/                      # Node.js + Express REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models: User, Role, Quotes, Orders, Deliveries
│   │   └── seed.js             # Realistic Ethiopian produce & users seed data
│   ├── src/
│   │   ├── config/             # DB & env configuration
│   │   ├── middleware/         # authenticate.js, authorize.js (RBAC), errorHandler.js
│   │   ├── modules/            # auth, products, categories, quotes, orders, deliveries, admin
│   │   ├── tests/              # api.test.js automated test suite
│   │   ├── app.js
│   │   └── server.js           # Express + Socket.IO real-time server
└── package.json                 # Unified workspace scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)

### 2. Quick Setup & Start
Run both the frontend and backend with pre-seeded data:

```bash
# 1. Install dependencies
npm --prefix server install
npm --prefix client install

# 2. Setup database schema & seed Ethiopian agricultural data
npm --prefix server run prisma:push
npm --prefix server run prisma:seed

# 3. Start Backend Server (runs on http://localhost:5000)
npm --prefix server run dev

# 4. In a separate terminal, start Frontend (runs on http://localhost:5173)
npm --prefix client run dev
```

Visit **http://localhost:5173** to view the live platform.

---

## 🧪 Running Automated Tests

Run the backend integration test suite verifying authentication, RBAC, quote negotiations, atomic order generation, and delivery claiming:

```bash