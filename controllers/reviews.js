const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Prevent duplicate review by same user on the same listing
  const existingReview = await Review.findOne({
    _id: { $in: listing.reviews },
    author: req.user._id,
  });

  if (existingReview) {
    req.flash("error", "You have already submitted a review for this property!");
    return res.redirect(`/listings/${id}#reviews`);
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Thank you! Your review has been added.");
  res.redirect(`/listings/${id}#reviews`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted successfully!");
  res.redirect(`/listings/${id}#reviews`);
};

