const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "The listing you are trying to book does not exist!");
    return res.redirect("/listings");
  }

  // Prevent host from booking their own listing
  if (listing.owner && listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing!");
    return res.redirect(`/listings/${id}`);
  }

  const { checkIn, checkOut, guests, specialRequests } = req.body.booking;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    req.flash("error", "Please provide valid check-in and check-out dates.");
    return res.redirect(`/listings/${id}`);
  }

  if (inDate < today) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  if (outDate <= inDate) {
    req.flash("error", "Check-out date must be after check-in date.");
    return res.redirect(`/listings/${id}`);
  }

  const diffTime = Math.abs(outDate - inDate);
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (nights < 1) {
    req.flash("error", "Stay duration must be at least 1 night.");
    return res.redirect(`/listings/${id}`);
  }

  // Check for overlapping confirmed bookings
  const overlappingBooking = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    $or: [
      {
        checkIn: { $lt: outDate },
        checkOut: { $gt: inDate },
      },
    ],
  });

  if (overlappingBooking) {
    req.flash(
      "error",
      "Selected dates are already booked! Please select another date range."
    );
    return res.redirect(`/listings/${id}`);
  }

  // Calculate pricing
  const pricePerNight = listing.price;
  const subtotal = pricePerNight * nights;
  const cleaningFee = 500;
  const serviceFee = Math.round(subtotal * 0.08);
  const taxes = Math.round((subtotal + serviceFee) * 0.12);
  const totalPrice = subtotal + cleaningFee + serviceFee + taxes;

  const newBooking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn: inDate,
    checkOut: outDate,
    guests: Number(guests) || 1,
    nights,
    pricePerNight,
    cleaningFee,
    serviceFee,
    taxes,
    totalPrice,
    status: "confirmed",
    paymentMethod: "Demo Instant Checkout (Card/UPI)",
    paymentStatus: "demo_paid",
    specialRequests: specialRequests || "",
  });

  await newBooking.save();

  req.flash(
    "success",
    "Booking confirmed! Your stay at " +
      listing.title +
      " is successfully booked."
  );
  res.redirect(`/bookings/${newBooking._id}`);
};

module.exports.index = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: "listing",
      populate: {
        path: "owner",
      },
    })
    .sort({ checkIn: -1 });

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.checkOut) >= now
  );
  const past = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.checkOut) < now
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  res.render("bookings/index.ejs", { bookings, upcoming, past, cancelled });
};

module.exports.show = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate({
      path: "listing",
      populate: {
        path: "owner",
      },
    })
    .populate("user");

  if (!booking) {
    req.flash("error", "Booking reservation not found!");
    return res.redirect("/bookings");
  }

  // Check authorization: booking owner or listing owner or admin
  const isBooker = booking.user.equals(req.user._id);
  const isHost =
    booking.listing &&
    booking.listing.owner &&
    booking.listing.owner.equals(req.user._id);

  if (!isBooker && !isHost && req.user.role !== "admin") {
    req.flash("error", "You are not authorized to view this reservation!");
    return res.redirect("/bookings");
  }

  res.render("bookings/show.ejs", { booking, isHost });
};

module.exports.cancel = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings");
  }

  const isBooker = booking.user.equals(req.user._id);
  const isHost =
    booking.listing &&
    booking.listing.owner &&
    booking.listing.owner.equals(req.user._id);

  if (!isBooker && !isHost && req.user.role !== "admin") {
    req.flash("error", "You do not have permission to cancel this booking!");
    return res.redirect("/bookings");
  }

  if (booking.status === "cancelled") {
    req.flash("error", "This booking is already cancelled.");
    return res.redirect(`/bookings/${id}`);
  }

  booking.status = "cancelled";
  booking.paymentStatus = "refunded";
  await booking.save();

  req.flash(
    "success",
    "Booking has been successfully cancelled and refunded according to policy."
  );
  res.redirect(`/bookings/${id}`);
};

