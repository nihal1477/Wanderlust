const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const userController = require("../controllers/users.js");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

// Signup
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// Login
router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

// Logout
router.get("/logout", userController.logout);

// User Profile
router
  .route("/profile")
  .get(isLoggedIn, wrapAsync(userController.profile))
  .put(isLoggedIn, wrapAsync(userController.updateProfile));

// Wishlist
router.get("/wishlist", isLoggedIn, wrapAsync(userController.wishlist));

module.exports = router;

