const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const User = require("../models/user.js");

// Default coordinates for popular cities / fallback
const CITY_COORDINATES = {
  malibu: [-118.7798, 34.0259],
  "new york": [-74.006, 40.7128],
  aspen: [-106.8175, 39.1911],
  florence: [11.2558, 43.7696],
  paris: [2.3522, 48.8566],
  tokyo: [139.6917, 35.6895],
  london: [-0.1278, 51.5074],
  goa: [73.818, 15.2993],
  mumbai: [72.8777, 19.076],
  delhi: [77.1025, 28.7041],
  jaipur: [75.7873, 26.9124],
  bali: [115.1889, -8.4095],
  rome: [12.4964, 41.9028],
  barcelona: [2.1734, 41.3851],
  dubai: [55.2708, 25.2048],
  sydney: [151.2093, -33.8688],
  swiss: [8.2275, 46.8182],
  switzerland: [8.2275, 46.8182],
};

function getApproxCoordinates(location, country) {
  const query = `${location} ${country}`.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (query.includes(key)) {
      // Add slight jitter so multiple properties in same city don't stack directly
      const jitterLon = (Math.random() - 0.5) * 0.04;
      const jitterLat = (Math.random() - 0.5) * 0.04;
      return [coords[0] + jitterLon, coords[1] + jitterLat];
    }
  }
  // Default to central India / world coordinate
  return [77.209, 28.6139];
}

module.exports.index = async (req, res) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;
  const filter = {};

  if (category && category !== "all") {
    filter.category = category.toLowerCase();
  }

  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice && !isNaN(minPrice)) filter.price.$gte = Number(minPrice);
    if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sort === "price-asc") {
    sortOption = { price: 1 };
  } else if (sort === "price-desc") {
    sortOption = { price: -1 };
  } else if (sort === "newest") {
    sortOption = { createdAt: -1 };
  }

  const allListings = await Listing.find(filter)
    .populate("reviews")
    .populate("owner")
    .sort(sortOption);

  res.render("listings/index.ejs", {
    allListings,
    selectedCategory: category || "all",
    searchQuery: search || "",
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
    sort: sort || "newest",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  // Process uploaded images if any
  if (req.files && req.files.length > 0) {
    newListing.images = req.files.map((file) => ({
      url: file.path.startsWith("http")
        ? file.path
        : `/uploads/${file.filename}`,
      filename: file.filename || file.originalname,
    }));
    newListing.image = newListing.images[0].url;
  } else if (req.body.listing.image && req.body.listing.image.trim()) {
    // If URL is provided
    newListing.images = [
      {
        url: req.body.listing.image.trim(),
        filename: "listing_link",
      },
    ];
    newListing.image = req.body.listing.image.trim();
  }

  // Set geometry based on location/country
  const coords = getApproxCoordinates(
    newListing.location || "",
    newListing.country || ""
  );
  newListing.geometry = {
    type: "Point",
    coordinates: coords,
  };

  await newListing.save();
  req.flash("success", "New Listing created successfully!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }

  // Check if current user has saved to wishlist
  let isWishlisted = false;
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user && user.wishlist) {
      isWishlisted = user.wishlist.some((wId) => wId.equals(listing._id));
    }
  }

  // Fetch confirmed bookings for calendar display
  const activeBookings = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gte: new Date() },
  }).select("checkIn checkOut");

  res.render("listings/show.ejs", {
    listing,
    isWishlisted,
    bookedDates: JSON.stringify(activeBookings),
  });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.displayImage;
  // If cloudinary, generate reduced preview if possible
  if (originalImageUrl.includes("/upload/")) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  Object.assign(listing, req.body.listing);

  // If new images were uploaded, append or replace
  if (req.files && req.files.length > 0) {
    const newImgs = req.files.map((file) => ({
      url: file.path.startsWith("http")
        ? file.path
        : `/uploads/${file.filename}`,
      filename: file.filename || file.originalname,
    }));
    listing.images.push(...newImgs);
    listing.image = listing.images[0].url;
  } else if (req.body.listing.image && req.body.listing.image.trim()) {
    listing.images = [
      {
        url: req.body.listing.image.trim(),
        filename: "listing_link",
      },
    ];
    listing.image = req.body.listing.image.trim();
  }

  // Update geometry if location or country changed
  const coords = getApproxCoordinates(listing.location, listing.country);
  listing.geometry = {
    type: "Point",
    coordinates: coords,
  };

  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};

module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const index = user.wishlist.findIndex((wId) => wId.equals(id));
  let saved = false;

  if (index > -1) {
    user.wishlist.splice(index, 1);
    saved = false;
  } else {
    user.wishlist.push(id);
    saved = true;
  }

  await user.save();

  if (req.xhr || req.headers.accept?.includes("json")) {
    return res.json({
      success: true,
      saved,
      wishlistCount: user.wishlist.length,
    });
  }

  req.flash(
    "success",
    saved ? "Added to your wishlist!" : "Removed from your wishlist!"
  );
  res.redirect(req.headers.referer || `/listings/${id}`);
};

module.exports.myListings = async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id })
    .populate("reviews")
    .sort({ createdAt: -1 });

  res.render("listings/my-listings.ejs", { listings });
};

