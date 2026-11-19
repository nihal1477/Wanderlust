const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const listingController = require("../controllers/listings.js");
const {
  isLoggedIn,
  isOwner,
  validateListing,
} = require("../middleware.js");
const { upload } = require("../cloudConfig.js");

// My Listings page (placed before /:id)
router.get("/my-listings", isLoggedIn, wrapAsync(listingController.myListings));

// New Listing form (placed before /:id)
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Index & Create
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("listing[images]", 5),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// Show, Update & Delete
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("listing[images]", 5),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

// Wishlist toggle
router.post("/:id/wishlist", isLoggedIn, wrapAsync(listingController.toggleWishlist));

module.exports = router;

