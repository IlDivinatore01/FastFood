# 🍔 FastFood - Online Restaurant Ordering Platform

A comprehensive full-stack web application for online food ordering, built with Node.js, MongoDB, Express.js, and vanilla JavaScript. This project implements a complete restaurant management and food delivery system supporting both customers and restaurant owners.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Frontend Structure](#frontend-structure)
- [Testing](#testing)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 👥 User Management
- **Dual User System**: Support for both customers and restaurant owners
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **Profile Management**: Complete user profile editing and management
- **Role-based Authorization**: Different interfaces and permissions for each user type

### 🏪 Restaurant Management
- **Restaurant Profiles**: Complete restaurant information management
- **Menu Management**: Add, edit, and remove dishes from restaurant menus
- **Business Hours**: Configure operating hours and availability
- **Image Upload**: Restaurant and dish image management

### 🛒 Order System
- **Shopping Cart**: Persistent cart with local storage
- **Order Tracking**: Complete order lifecycle management
- **Status Updates**: Real-time order status tracking (ordered → preparing → delivering → delivered)
- **Order History**: Complete order history for customers and restaurants

### 🚚 Delivery Management
- **Address Validation**: Delivery address management and validation
- **Distance Calculation**: Integration with mapping services for delivery costs
- **Special Instructions**: Custom delivery notes and requirements

### 🔍 Advanced Search
- **Restaurant Search**: Filter by name, location, and cuisine type
- **Dish Search**: Filter by category, price range, and ingredients
- **Allergen Support**: Filter dishes by allergen information

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, cors, express-rate-limit
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest, Supertest

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5
- **Architecture**: Modular SPA components
- **API Communication**: Fetch API
- **State Management**: localStorage for cart persistence

## 📁 Project Structure

FastFood/
├── backend/ # Backend Node.js application
│ ├── tests/ # Test files
│ │ ├── auth.integration.test.js
│ │ ├── dish.integration.test.js
│ │ ├── order.integration.test.js
│ │ ├── profile.integration.test.js
│ │ ├── restaurant.integration.test.js
│ │ └── user.model.test.js
│ ├── config/ # Configuration files
│ │ ├── api.yaml # OpenAPI specification
│ │ ├── db.js # Database connection
│ │ ├── swagger.js # Swagger configuration
│ │ └── swagger-output.json # Generated API docs
│ ├── controllers/ # Business logic controllers
│ │ ├── authController.js # Authentication logic
│ │ ├── dishController.js # Dish management
│ │ ├── orderController.js # Order processing
│ │ ├── restaurantController.js # Restaurant management
│ │ └── userController.js # User profile management
│ ├── middleware/ # Express middleware
│ │ ├── auth.js # Authentication middleware
│ │ ├── imgUpload.js # File upload handling
│ │ ├── onlyCustomers.js # Customer-only routes
│ │ ├── onlyOwners.js # Owner-only routes
│ │ └── setupCheck.js # Setup completion check
│ ├── models/ # Mongoose data models
│ │ ├── CustomerData.js # Customer profile data
│ │ ├── Dish.js # Dish/menu item model
│ │ ├── Order.js # Order model
│ │ ├── Restaurant.js # Restaurant model
│ │ └── User.js # User authentication model
│ ├── routes/ # Express routes
│ │ ├── apiRoutes.js # Main API endpoints
│ │ ├── authRoutes.js # Authentication routes
│ │ └── pagesRoutes.js # Page serving routes
│ ├── services/ # Business services
│ │ └── orderService.js # Order processing logic
│ ├── utils/ # Utility functions
│ │ ├── constants.js # Application constants
│ │ └── mealsImporter.js # Data seeding utility
│ ├── meals.json # Sample meal data
│ └── server.js # Main server application
├── frontend/ # Frontend web application
│ ├── css/ # Stylesheets
│ │ └── style.css # Custom application styles
│ ├── html/ # HTML templates
│ │ ├── addRestaurant.html # Restaurant setup page
│ │ ├── analytics.html # Business analytics dashboard
│ │ ├── cart.html # Shopping cart page
│ │ ├── checkout.html # Order checkout page
│ │ ├── editProfile.html # Profile editing page
│ │ ├── finalize.html # Customer setup completion
│ │ ├── homeCustomer.html # Customer dashboard
│ │ ├── homeOwner.html # Restaurant owner dashboard
│ │ ├── menuManager.html # Menu management interface
│ │ ├── profile.html # Profile display page
│ │ └── restaurantPage.html # Individual restaurant page
│ ├── js/ # JavaScript modules
│ │ ├── addRestaurant.js # Restaurant setup functionality
│ │ ├── analytics.js # Analytics dashboard
│ │ ├── api.js # API communication layer
│ │ ├── cart.js # Cart page functionality
│ │ ├── cartManager.js # Cart state management
│ │ ├── checkout.js # Checkout process
│ │ ├── components.js # Reusable UI components
│ │ ├── editProfile.js # Profile editing
│ │ ├── errorManager.js # Error handling system
│ │ ├── finalize.js # Customer onboarding
│ │ ├── homeCustomer.js # Customer dashboard
│ │ ├── homeOwner.js # Owner dashboard
│ │ ├── index.js # Application entry point
│ │ ├── layout.js # Common layout management
│ │ ├── login.js # Authentication handling
│ │ ├── menuManager.js # Menu management
│ │ ├── profile.js # Profile display
│ │ ├── restaurantPage.js # Restaurant page
│ │ └── uiUtils.js # UI utility functions
│ └── public/ # Static assets
│ ├── images/ # Image assets
│ │ ├── card.png # Payment card icon
│ │ └── default-restaurant.png # Default restaurant image
│ ├── favicon.ico # Website favicon
│ ├── index.html # Main landing page
│ ├── login.html # Login page
│ └── register.html # Registration page
├── .env # Environment variables
├── jest.config.js # Jest testing configuration
├── package.json # Node.js dependencies
└── relazione.pdf # Project documentation (Italian)

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**

git clone https://github.com/IlDivinatore01/FastFood.git
cd FastFood

2. **Install dependencies**

npm install

3. **Environment Configuration**
Create a `.env` file in the root directory:

NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fastfood
JWT_SECRET=your_jwt_secret_key_here

4. **Database Setup**
- Ensure MongoDB is running on your system
- The application will create the database automatically on first run

5. **Start the application**

npm start

6. **Access the application**
- Open your browser and navigate to `http://localhost:5000`
- The application will redirect to the login page

## 🎯 Usage

### For Customers

1. **Registration**: Create a customer account from the registration page
2. **Browse Restaurants**: Discover restaurants on the customer dashboard
3. **View Menus**: Browse restaurant menus and dish details
4. **Place Orders**: Add items to cart and proceed through checkout
5. **Track Orders**: Monitor order status in real-time
6. **Manage Profile**: Update personal information and preferences

### For Restaurant Owners

1. **Registration**: Create an owner account from the registration page
2. **Setup Restaurant**: Complete restaurant profile and business information
3. **Manage Menu**: Add, edit, and remove dishes from your menu
4. **Process Orders**: View incoming orders and update their status
5. **Analytics**: Monitor business performance and customer trends
6. **Profile Management**: Update restaurant information and settings

## 📚 API Documentation

The application includes comprehensive API documentation powered by Swagger/OpenAPI 3.0. Once the server is running, you can access the interactive API documentation at:

http://localhost:5000/api-docs

### Main API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `GET /auth/check` - Authentication status check

#### Restaurants
- `GET /api/restaurants` - List all restaurants
- `POST /api/restaurants` - Create new restaurant (owners only)
- `PUT /api/restaurants/:id` - Update restaurant (owners only)
- `GET /api/restaurants/:id` - Get restaurant details

#### Dishes
- `GET /api/dishes` - List dishes with filters
- `POST /api/dishes` - Create new dish (owners only)
- `PUT /api/dishes/:id` - Update dish (owners only)
- `DELETE /api/dishes/:id` - Delete dish (owners only)

#### Orders
- `POST /api/orders` - Create new order (customers only)
- `GET /api/orders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status (owners only)

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🗃 Database Schema

### Collections

#### Users

{
username: String (unique, required),
firstName: String (required),
lastName: String (required),
email: String (unique, required),
password: String (hashed, required),
type: String (enum: ['customer', 'owner']),
image: String (profile picture path),
active: Boolean (default: true)
}

#### Restaurants

{
name: String (required),
description: String (required),
address: String (required),
phone: String (required),
businessHours: String (required),
owner: ObjectId (ref: User, required),
image: String (restaurant image path),
isActive: Boolean (default: true)
}

#### Dishes

{
name: String (required),
description: String (required),
price: Number (required, min: 0),
category: String (required),
restaurant: ObjectId (ref: Restaurant, required),
ingredients: [String],
allergens: [String],
image: String (dish image path),
isAvailable: Boolean (default: true)
}

#### Orders

{
customer: ObjectId (ref: User, required),
restaurant: ObjectId (ref: Restaurant, required),
items: [{
dish: ObjectId (ref: Dish, required),
quantity: Number (required, min: 1),
price: Number (required)
}],
status: String (enum: ['ordinato', 'in preparazione', 'in consegna', 'consegnato']),
totalAmount: Number (required),
deliveryAddress: String (required),
specialInstructions: String,
estimatedDeliveryTime: Date,
actualDeliveryTime: Date
}

## 🎨 Frontend Structure

### Key JavaScript Modules

- **`api.js`**: Centralized API communication with error handling and loading states
- **`layout.js`**: Common navigation and layout management for authenticated pages
- **`components.js`**: Reusable UI components (cards, pagination, modals)
- **`cartManager.js`**: Shopping cart state management with localStorage persistence
- **`errorManager.js`**: Global error handling and user notification system

### HTML Pages

- **Public Pages**: `login.html`, `register.html`, `index.html`
- **Customer Pages**: `homeCustomer.html`, `cart.html`, `checkout.html`, `restaurantPage.html`
- **Owner Pages**: `homeOwner.html`, `menuManager.html`, `analytics.html`, `addRestaurant.html`
- **Shared Pages**: `profile.html`, `editProfile.html`, `finalize.html`

### CSS Architecture

The application uses Bootstrap 5 as the base CSS framework with custom overrides in `style.css` for:
- Brand-specific color schemes and styling
- Responsive design optimizations
- Custom animations and transitions
- Mobile-first responsive layouts

## 🧪 Testing

The project includes comprehensive testing coverage with Jest and Supertest:

### Run Tests

Run all tests

npm test
Run tests with coverage

npm run test:coverage
Run tests in watch mode

npm run test:watch

### Test Categories

- **Integration Tests**: Complete API endpoint testing
- **Unit Tests**: Individual model and utility function testing
- **Authentication Tests**: Security and session management testing
- **Database Tests**: Data persistence and validation testing

### Test Files
- `auth.integration.test.js`: Authentication flow testing
- `dish.integration.test.js`: Menu management testing
- `order.integration.test.js`: Order processing testing
- `restaurant.integration.test.js`: Restaurant management testing
- `profile.integration.test.js`: User profile testing
- `user.model.test.js`: User model validation testing

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management with HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Role-based Access**: Middleware protection for customer and owner-specific routes
- **Session Management**: Automatic token expiration and refresh

### Security Middleware
- **Helmet**: Secure HTTP headers configuration
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation for all user inputs
- **XSS Protection**: Content Security Policy implementation

### Data Protection
- **Schema Validation**: Mongoose schema validation for data integrity
- **Input Sanitization**: All user inputs are cleaned and validated
- **Error Handling**: Secure error messages without sensitive information exposure

## 🚀 Getting Started

### Quick Start for Development

1. **Install dependencies**:

npm install

2. **Set up environment variables**:

cp .env.example .env
Edit .env with your configuration

3. **Start MongoDB** (if running locally):

mongod

4. **Seed the database** (optional):

node /backend/utils/mealsImporter.js

5. **Start the development server**:

npm run dev

6. **Run tests**:

npm test

### Production Deployment

1. **Build for production**:

npm run build

2. **Start production server**:

npm start

3. **Environment Configuration**:
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Use strong JWT secret key
- Enable HTTPS in production

## 📖 API Documentation

### Authentication Endpoints

#### Register User

POST /auth/register
Content-Type: application/json

{
"username": "johndoe",
"firstName": "John",
"lastName": "Doe",
"email": "john@example.com",
"password": "securePassword123!",
"confirmPassword": "securePassword123!",
"type": "customer"
}

#### Login User

POST /auth/login
Content-Type: application/json

{
"username": "johndoe",
"password": "securePassword123!"
}

### Restaurant Endpoints

#### Get All Restaurants

GET /api/restaurants?page=1&limit=12&search=pizza

#### Create Restaurant (Owner Only)

POST /api/restaurants
Content-Type: application/json
Authorization: Bearer <token>

{
"name": "Mario's Pizza",
"description": "Authentic Italian pizza",
"address": "123 Main St, City",
"phone": "+1234567890",
"businessHours": "9:00 AM - 10:00 PM"
}

### Order Endpoints

#### Create Order (Customer Only)

POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
"restaurantId": "restaurant_id_here",
"items": [
{
"dishId": "dish_id_here",
"quantity": 2
}
],
"deliveryAddress": "456 Elm St, City",
"specialInstructions": "Extra sauce please"
}

## 🎨 Frontend Development

### Key JavaScript Classes

#### CartManager

// Global cart state management
const cartManager = new CartManager();

// Add item to cart
cartManager.addItem(dish, restaurant);

// Update item quantity
cartManager.updateQuantity(dishId, newQuantity);

// Get current cart
const cart = cartManager.getCart();

#### APIClient

// Centralized API communication
import { fetchApi } from './api.js';

// Make authenticated API calls
const data = await fetchApi('/api/restaurants', {
method: 'GET'
});

#### UIComponents

// Reusable UI components
import { createCard, renderPagination } from './components.js';

// Create restaurant card
const restaurantCard = createCard({
imageSrc: restaurant.image,
title: restaurant.name,
bodyText: restaurant.description,
onClick: () => viewRestaurant(restaurant._id)
});

## 🔧 Configuration

### Environment Variables

NODE_ENV=development # Environment (development/production)
PORT=5000 # Server port
MONGODB_URI=mongodb://localhost:27017/fastfood # Database connection
JWT_SECRET=your_secret_key # JWT signing key

### Database Configuration

The application connects to MongoDB using the connection string specified in the environment variables. The database configuration is handled in `backend/config/db.js`.

### Swagger Configuration

API documentation is automatically generated using Swagger. Configuration is in `backend/config/swagger.js`, and the generated documentation is available at `/api-docs`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code structure and naming conventions
- Add appropriate tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PRs
- Use meaningful commit messages

## 📝 License

This project is developed as part of the Web and Mobile Programming course (Programmazione Web e Mobile) A.A. 2025/2026. 

## 🙋‍♂️ Support

For questions or support regarding this project, please refer to the course materials or contact the course instructors.

## 🏗 Architecture Decisions

### Why Node.js and Express?
- **Rapid Development**: Quick setup and development with extensive ecosystem
- **JSON Native**: Perfect fit for REST APIs and MongoDB integration
- **Scalability**: Event-driven architecture suitable for I/O intensive operations
- **Community**: Large community and extensive middleware ecosystem

### Why MongoDB?
- **Flexibility**: Schema flexibility for rapid prototyping and iteration
- **JSON Documents**: Natural fit with JavaScript and REST APIs
- **Scalability**: Horizontal scaling capabilities for future growth
- **Aggregation**: Powerful query and aggregation pipeline for analytics

### Why Vanilla JavaScript?
- **Performance**: No framework overhead for better performance
- **Learning**: Better understanding of core web technologies
- **Control**: Fine-grained control over application behavior
- **Simplicity**: Reduced complexity and dependency management

## 🎯 Future Enhancements

- **Real-time Updates**: WebSocket integration for live order tracking
- **Payment Integration**: Stripe/PayPal integration for secure payments
- **Mobile App**: React Native or Flutter mobile application
- **Push Notifications**: Real-time notifications for order updates
- **Advanced Analytics**: Business intelligence dashboard for restaurant owners
- **Review System**: Customer rating and review functionality
- **Loyalty Program**: Customer rewards and loyalty point system
- **GPS Tracking**: Real-time delivery tracking with maps integration