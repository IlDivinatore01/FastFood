# 🍔 FastFood - Food Delivery Platform

Professional food delivery web application with dual interfaces for customers and restaurant owners.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap)](https://getbootstrap.com/)

**Live Demo:** [fastfood.simonemiglio.eu](https://fastfood.simonemiglio.eu)

> 📌 **Primary Repository:** [Forgejo](https://forgejo.it/simonemiglio/FastFood)  
> 🪞 **Mirrors:** [GitHub](https://github.com/IlDivinatore01/FastFood) • [GitLab](https://gitlab.com/simonemiglio/FastFood) • [Codeberg](https://codeberg.org/simonemiglio/FastFood)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)

---

## ✨ Features

### 👤 For Customers
| Feature | Description |
|---------|-------------|
| **Restaurant Discovery** | Search by name, category, cuisine |
| **Smart Search** | Filter dishes by ingredients, allergens, price |
| **Cart System** | Real-time total calculation |
| **Order Tracking** | Live status: Ordered → Preparing → Delivering → Delivered |
| **User Profiles** | Saved addresses, order history |

### 🏪 For Restaurant Owners
| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Sales, popular dishes, order volume |
| **Menu Manager** | CRUD operations for dishes with images |
| **Order Management** | Accept/reject, update status in real-time |
| **Business Profile** | Hours, description, cover image |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js + Express 5 | REST API server |
| **Database** | MongoDB Atlas | Data persistence |
| **Auth** | JWT + Bcrypt | Secure authentication |
| **Frontend** | Vanilla JS + Bootstrap 5 | Responsive UI |
| **Security** | Helmet, CORS, Rate Limiting | API protection |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works)

### Step 1: Clone & Install

```bash
git clone https://forgejo.it/simonemiglio/FastFood.git
cd FastFood
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
nano .env   # Edit with your values
```

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_USER` | MongoDB Atlas username | `admin` |
| `MONGO_PASSWORD` | MongoDB Atlas password | `your_password` |
| `MONGO_CLUSTER` | Cluster address | `cluster0.xxxxx.mongodb.net` |
| `JWT_SECRET` | Auth secret key | `openssl rand -hex 32` |
| `PORT` | Server port | `3000` |

### Step 3: Run

```bash
# Start server
npm start

# Or with nodemon (dev)
npm run dev
```

**Open:** http://localhost:3000

### Alternative: Local MongoDB

```bash
# Start MongoDB container
podman run -d --name mongo -p 27017:27017 mongo:6

# In .env, use:
# MONGO_URI=mongodb://localhost:27017/fastfood
```

---

## 📁 Project Structure

```
FastFood/
├── backend/                 # Server-side logic
│   ├── config/              # Database & app config
│   │   └── db.js            # MongoDB connection
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   └── restaurantController.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT verification
│   │   └── imgUpload.js     # Multer config
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── Dish.js
│   │   └── Order.js
│   ├── routes/              # API route definitions
│   └── server.js            # Entry point
│
├── frontend/                # Client-side
│   ├── css/                 # Stylesheets
│   ├── js/                  # Application scripts
│   │   ├── api.js           # API client
│   │   ├── auth.js          # Auth handlers
│   │   └── cart.js          # Cart logic
│   ├── html/                # Page templates
│   │   ├── homeCustomer.html
│   │   ├── homeOwner.html
│   │   └── ...
│   └── public/              # Static assets
│       ├── images/
│       ├── landing.html
│       └── index.html
│
├── .env.example             # Environment template
├── package.json
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

### Full `.env` Reference

```env
# ===========================================
# MongoDB Atlas Connection
# ===========================================
MONGO_USER=your_username
MONGO_PASSWORD=your_password
MONGO_CLUSTER=cluster0.xxxxx.mongodb.net

# ===========================================
# Application Settings
# ===========================================
PORT=3000
NODE_ENV=production
JWT_SECRET=your_super_secret_key
ALLOWED_ORIGINS=https://fastfood.yourdomain.com
```

### Generate JWT Secret

```bash
openssl rand -hex 32
```

---

## 📖 API Documentation

Full interactive docs available at `/api-docs` (Swagger UI).

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new user |
| `POST` | `/auth/login` | Login (returns JWT) |
| `GET` | `/api/nearby` | List nearby restaurants |
| `GET` | `/api/dishes` | List dishes for menu |
| `POST` | `/api/order` | Place order |
| `PUT` | `/api/order/update` | Advance order in queue |

### Authentication

All protected endpoints require:
```
Cookie: token=<jwt_token>
```

---

## 🚢 Deployment

### Standalone (Node.js)

```bash
npm install --production
NODE_ENV=production node backend/server.js
```

### With Podman

```bash
# Build image
podman build -t fastfood .

# Run container
podman run -d \
  --name fastfood \
  -p 3000:3000 \
  --env-file .env \
  fastfood
```

### Full Infrastructure

For production deployment with Caddy reverse proxy and auto-start, see the [Homelab](https://forgejo.it/simonemiglio/Homelab) repository.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests use **Jest** + **Supertest** for API testing.

---

## 📊 Database Schema

### Collections

| Collection | Description |
|------------|-------------|
| `users` | Customer & owner accounts |
| `restaurants` | Restaurant profiles |
| `dishes` | Menu items |
| `orders` | Order history |

### Relationships

```
User (owner) ──┬── Restaurant ──── Dish
               │
User (customer) ──── Order ──── [Dish references]
```

---

## 📄 License

ISC License

---

**Created by [Simone Miglio](https://simonemiglio.eu)** 🇮🇹

*Developed for Web and Mobile Programming course (A.A. 2025/2026)*