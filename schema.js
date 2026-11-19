const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required().messages({
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),
    description: Joi.string().required().messages({
      "string.empty": "Description is required",
      "any.required": "Description is required",
    }),
    location: Joi.string().required().messages({
      "string.empty": "Location is required",
      "any.required": "Location is required",
    }),
    country: Joi.string().required().messages({
      "string.empty": "Country is required",
      "any.required": "Country is required",
    }),
    price: Joi.number().min(0).required().messages({
      "number.min": "Price cannot be negative",
      "any.required": "Price is required",
    }),
    category: Joi.string()
      .valid(
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
        "luxury"
      )
      .default("trending"),
    amenities: Joi.alternatives()
      .try(Joi.array().items(Joi.string()), Joi.string())
      .optional(),
    image: Joi.string().allow("", null).optional(),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required().messages({
      "number.min": "Rating must be at least 1 star",
      "number.max": "Rating cannot exceed 5 stars",
      "any.required": "Please provide a rating",
    }),
    comment: Joi.string().trim().min(3).required().messages({
      "string.empty": "Review comment cannot be empty",
      "string.min": "Review comment must be at least 3 characters long",
      "any.required": "Review comment is required",
    }),
  }).required(),
});

module.exports.bookingSchema = Joi.object({
  booking: Joi.object({
    checkIn: Joi.date().iso().required().messages({
      "any.required": "Check-in date is required",
    }),
    checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required().messages({
      "date.greater": "Check-out date must be after check-in date",
      "any.required": "Check-out date is required",
    }),
    guests: Joi.number().min(1).max(20).required().messages({
      "number.min": "At least 1 guest is required",
      "number.max": "Maximum 20 guests allowed",
      "any.required": "Number of guests is required",
    }),
    specialRequests: Joi.string().allow("", null).max(500).optional(),
  }).required(),
});
