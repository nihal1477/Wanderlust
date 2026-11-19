const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body;
    const newUser = new User({
      email,
      username,
      name: name || username,
    });

    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash(
        "success",
        `Welcome to Wanderlust, ${registeredUser.username}! Explore amazing stays around the world.`
      );
      const redirectUrl = res.locals.redirectUrl || "/listings";
      res.redirect(redirectUrl);
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome back, ${req.user.username}!`);
  const redirectUrl = res.locals.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You have been logged out successfully. Safe travels!");
    res.redirect("/listings");
  });
};

module.exports.profile = async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  const listingCount = await Listing.countDocuments({ owner: req.user._id });
  const bookingCount = await Booking.countDocuments({ user: req.user._id });
  const reviewCount = await Review.countDocuments({ author: req.user._id });

  res.render("users/profile.ejs", {
    user,
    stats: { listingCount, bookingCount, reviewCount },
  });
};

module.exports.updateProfile = async (req, res) => {
  const { name, bio, phone, avatarUrl } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name.trim();
  if (bio) user.bio = bio.trim();
  if (phone) user.phone = phone.trim();
  if (avatarUrl && avatarUrl.trim()) {
    user.avatar = {
      url: avatarUrl.trim(),
      filename: "user_avatar",
    };
  }

  await user.save();
  req.flash("success", "Profile updated successfully!");
  res.redirect("/profile");
};

module.exports.wishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    populate: [{ path: "reviews" }, { path: "owner" }],
  });

  res.render("users/wishlist.ejs", { wishlist: user.wishlist || [] });
};

