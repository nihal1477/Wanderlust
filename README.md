# Wanderlust - Modern Airbnb-Inspired Vacation Rental Platform

Wanderlust is a full-featured, responsive, production-quality accommodation booking web application inspired by Airbnb. Built with Node.js, Express, MongoDB/Mongoose, and EJS, Wanderlust enables users to explore curated vacation stays across the globe, book reservations with real-time price calculation and date conflict validation, write property reviews with 5-star ratings, save stays to wishlists, and host their own spaces.

---

## Key Features

### 1. User Authentication & Authorization
- **Registration & Login**: Secure credential management powered by `passport` and `passport-local-mongoose`.
- **Role-Based Access**: Role permissions for standard travelers, superhosts, and administrators.
- **Protected Routes & Middleware**:
  - `isLoggedIn`: Guard against unauthenticated actions with session redirect memory.
  - `isOwner`: Only listing creators can edit or delete their properties.
  - `isReviewAuthor`: Only review authors can remove their feedback.
- **User Profile Management**: Update avatar, bio, name, and phone with activity statistics.

### 2. Comprehensive Listings Management
- **Explore Stays**: Browse all available properties with high-resolution imagery and nightly pricing.
- **Interactive Search & Multi-Criteria Filtering**:
  - Search by destination, city, or property name.
  - Filter by category (Trending, Beachfront, Mountains, Iconic Cities, Castles, Pools, Camping, Farms, Arctic, etc.).
  - Price range filtering (minimum and maximum nightly rates).
  - Sorting options: Newest, Price (Low to High), Price (High to Low).
- **Dynamic Tax Display**: Airbnb-style tax toggle switch that updates all displayed rates with an 18% GST calculation in real time.
- **Detailed Property Show Page**:
  - Image galleries and collage.
  - Host info and Superhost badges.
  - Curated amenities with icons (Wifi, Pool, Kitchen, Workspace, AC, Parking, etc.).
  - Free cancellation and WanderCover guest protection guarantees.
- **Hosting / Property Creation**:
  - Form validation on both client (Bootstrap) and server (Joi schemas).
  - Multi-image file uploads with automatic local disk or Cloudinary storage.
  - Fallback image URL support.
  - Custom amenity selections.

### 3. Smart Booking & Reservation Engine
- **Availability Validation**: Prevents overlapping bookings for the same listing.
- **Date Range Picker**: Client-side validation ensuring valid check-in and check-out dates.
- **Real-Time Cost Breakdown**: Live computation of nights, base rate, cleaning fee, service fee, and estimated taxes.
- **Demo Checkout Mode**: Clear and functional booking flow with instant confirmation and reservation code generation.
- **Reservation Management**:
  - "My Trips & Bookings" page with tabs for Upcoming, Completed, and Cancelled stays.
  - Printable confirmation receipts with reservation IDs.
  - One-click cancellation with automated status and refund updates.

### 4. Reviews & 5-Star Ratings
- **Interactive Star Rating**: Hover and click 5-star input.
- **Average Rating Calculation**: Dynamic virtual calculation displayed on cards and details.
- **Duplicate Review Guard**: Prevents multiple reviews by the same user on a single property.
- **Author Deletion**: Clean cascade deletion when listings or reviews are removed.

### 5. Interactive OpenStreetMap / Leaflet Maps
- Embeds interactive Leaflet maps with custom marker pins and popup cards for every listing based on location coordinates. No external paid API keys required.

### 6. Wishlist / Favorites System
- AJAX-powered wishlist heart button allowing users to save and unsave properties seamlessly without page reload.
- Dedicated "My Wishlist" view.

### 7. Dual Image Upload System (Cloudinary + Local Disk Fallback)
- **Zero-Crash Cloud Config**: If Cloudinary credentials (`CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`) are configured in `.env`, uploads are stored in Cloudinary. If missing or placeholder, uploads automatically fall back to local storage in `public/uploads/`.

---

## Technology Stack

- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM (v9)
- **Template Engine**: EJS with `ejs-mate` layouts and partials
- **Styling**: Bootstrap 5.3, FontAwesome 6, Plus Jakarta Sans, custom CSS
- **Validation**: Joi (server-side) & Bootstrap 5 (client-side)
- **Authentication**: Passport.js, Passport-Local, Passport-Local-Mongoose
- **Session & Flash**: `express-session`, `connect-flash`
- **File Uploads**: `multer`, `cloudinary`, `multer-storage-cloudinary`
- **Mapping**: Leaflet.js with OpenStreetMap

---

## Project Structure

```text
MAJOR-PROJECT/
├── controllers/
│   ├── bookings.js         # Booking reservation logic & availability
│   ├── listings.js         # Listing CRUD, filters, search, wishlist
│   ├── reviews.js          # Review creation and deletion
│   └── users.js            # Authentication, registration, profiles
├── init/
│   ├── data.js             # Initial seed dataset (30 properties)
│   └── index.js            # Database seeding script
├── models/
│   ├── booking.js          # Booking Mongoose schema
│   ├── listing.js          # Listing Mongoose schema with virtuals & hooks
│   ├── review.js           # Review Mongoose schema
│   └── user.js             # User schema with passport-local-mongoose
├── public/
│   ├── css/
│   │   └── style.css       # Airbnb-style modern UI stylesheet
│   ├── js/
│   │   └── script.js       # Form validation, tax toggle, wishlist AJAX
│   └── uploads/            # Local image upload storage directory
├── routes/
│   ├── bookings.js         # Booking routes
│   ├── listings.js         # Listing routes
│   ├── reviews.js          # Review routes (nested with mergeParams)
│   └── users.js            # User auth and profile routes
├── utils/
│   ├── ExpressError.js     # Custom error handling class
│   └── wrapAsync.js        # Async route wrapper
├── views/
│   ├── bookings/
│   │   ├── index.js        # My bookings (Upcoming, Past, Cancelled)
│   │   └── show.ejs        # Printable booking confirmation & receipt
│   ├── includes/
│   │   ├── flash.ejs       # Success & error dismissible alerts
│   │   ├── footer.ejs      # Modern multi-column footer
│   │   └── navbar.ejs      # Airbnb navigation & search bar
│   ├── layouts/
│   │   └── boilerplate.ejs # Master layout template
│   ├── listings/
│   │   ├── edit.ejs        # Edit listing form
│   │   ├── index.ejs       # Explore stays, category bar, filter modal
│   │   ├── my-listings.ejs # Host management view
│   │   ├── new.ejs         # Create new listing form
│   │   └── show.ejs        # Listing details, map, reviews, booking widget
│   ├── pages/
│   │   ├── privacy.ejs     # Privacy policy
│   │   └── terms.ejs       # Terms of service
│   ├── users/
│   │   ├── login.ejs       # User login page
│   │   ├── profile.ejs     # User profile and stats
│   │   ├── signup.ejs      # User registration page
│   │   └── wishlist.ejs    # Saved listings page
│   └── error.ejs           # Custom 404 and 500 error page
├── app.js                  # Main Express application entrypoint
├── cloudConfig.js          # Cloudinary / Local Multer storage configuration
├── middleware.js           # Auth & validation middleware functions
├── schema.js               # Joi validation schemas
├── package.json            # Node.js dependencies and scripts
└── .env.example            # Environment variables template
```

---

## Installation & Setup Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB installed and running locally, or a MongoDB Atlas connection URI

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
PORT=8080
NODE_ENV=development
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust
SECRET=wanderlust_super_secret_session_key_12345

# Optional: Cloudinary credentials (leave blank to use local uploads)
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
```

### 3. Seed Database
Initialize the database with 29 curated properties, demo users, categories, coordinates, and reviews:
```bash
npm run seed
```

### 4. Start the Application
```bash
npm start
```
The server will start on `http://localhost:8080`.

---

## Demo Accounts

For immediate testing, two pre-configured demo accounts are provided:

| Role | Username | Password | Email |
| :--- | :--- | :--- | :--- |
| **Superhost** | `demohost` | `password123` | `host@wanderlust.com` |
| **Traveler** | `traveler` | `password123` | `traveler@wanderlust.com` |

---

## API & Route Reference

### Listings
- `GET /listings` - Explore all listings (supports `search`, `category`, `minPrice`, `maxPrice`, `sort`)
- `GET /listings/new` - Render new listing form *(requires login)*
- `POST /listings` - Create a listing with images *(requires login)*
- `GET /listings/:id` - Show listing details, reviews, map, and booking widget
- `GET /listings/:id/edit` - Render edit form *(requires owner)*
- `PUT /listings/:id` - Update listing *(requires owner)*
- `DELETE /listings/:id` - Delete listing and cascade reviews *(requires owner)*
- `GET /listings/my-listings` - Show listings owned by current user *(requires login)*
- `POST /listings/:id/wishlist` - Toggle wishlist status *(requires login)*

### Bookings
- `POST /listings/:id/bookings` - Create a booking reservation with availability check *(requires login)*
- `GET /bookings` - View user's upcoming, past, and cancelled reservations *(requires login)*
- `GET /bookings/:id` - View booking confirmation and printable receipt *(requires owner or host)*
- `POST /bookings/:id/cancel` - Cancel a confirmed booking *(requires owner or host)*

### Reviews
- `POST /listings/:id/reviews` - Add review with 1-5 rating *(requires login)*
- `DELETE /listings/:id/reviews/:reviewId` - Delete review *(requires review author)*

### Users & Auth
- `GET /signup` & `POST /signup` - Register a new user
- `GET /login` & `POST /login` - Log in with local strategy
- `GET /logout` - Log out session
- `GET /profile` & `PUT /profile` - View and edit account profile
- `GET /wishlist` - View user's saved properties

