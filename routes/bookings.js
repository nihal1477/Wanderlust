const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn, validateBooking } = require("../middleware.js");

// List all user bookings
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.index));

// Show specific booking / confirmation receipt
router.get("/bookings/:id", isLoggedIn, wrapAsync(bookingController.show));

// Cancel a booking
router.post("/bookings/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancel));

// Create booking for a listing
router.post(
  "/listings/:id/bookings",
  isLoggedIn,
  validateBooking,
  wrapAsync(bookingController.createBooking)
);

module.exports = router;

