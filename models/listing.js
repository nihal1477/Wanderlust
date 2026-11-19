const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          default: DEFAULT_IMAGE,
        },
        filename: {
          type: String,
          default: "listingimage",
        },
      },
    ],
    // Keep single image field for backwards compatibility
    image: {
      type: String,
      default: DEFAULT_IMAGE,
      set: (v) => (v === "" || !v ? DEFAULT_IMAGE : v),
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "trending",
        "rooms",
        "iconic-cities",
        "mountains",
        "castles",
        "pools",
        "camping",
        "farms",
        "arctic",
        "beachfront",
        "domes",
        "boats",
        "luxury",
      ],
      default: "trending",
      lowercase: true,
    },
    amenities: {
      type: [String],
      default: ["Wifi", "Air conditioning", "Kitchen"],
    },
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.209, 28.6139],
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting the main display image URL
listingSchema.virtual("displayImage").get(function () {
  if (this.images && this.images.length > 0 && this.images[0].url) {
    return this.images[0].url;
  }
  if (this.image) {
    return this.image;
  }
  return DEFAULT_IMAGE;
});

// Virtual for calculating average rating
listingSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const rated = this.reviews.filter(
    (r) => r && typeof r.rating === "number" && !isNaN(r.rating)
  );
  if (rated.length === 0) return 0;
  const sum = rated.reduce((acc, curr) => acc + curr.rating, 0);
  return Number((sum / rated.length).toFixed(1));
});

// Middleware to clean up reviews when listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing && listing.reviews && listing.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
