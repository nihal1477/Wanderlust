if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "../.env" });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");

const MONGO_URL =
  process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

const CATEGORIES = [
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
];

const ALL_AMENITIES = [
  "Wifi",
  "Air conditioning",
  "Kitchen",
  "Free parking",
  "Dedicated workspace",
  "Pool",
  "TV",
  "Pet friendly",
  "Washing machine",
  "Balcony",
  "BBQ grill",
  "Smoke alarm",
];

function determineCategory(item, index) {
  const text = `${item.title} ${item.description} ${item.location}`.toLowerCase();
  if (text.includes("beach") || text.includes("ocean") || text.includes("sea"))
    return "beachfront";
  if (text.includes("mountain") || text.includes("cabin") || text.includes("ski"))
    return "mountains";
  if (text.includes("loft") || text.includes("downtown") || text.includes("city"))
    return "iconic-cities";
  if (text.includes("villa") || text.includes("historic") || text.includes("castle"))
    return "castles";
  if (text.includes("pool") || text.includes("luxury")) return "pools";
  if (text.includes("camp") || text.includes("tent") || text.includes("treehouse"))
    return "camping";
  if (text.includes("farm") || text.includes("countryside") || text.includes("vineyard"))
    return "farms";
  if (text.includes("arctic") || text.includes("snow") || text.includes("chalet"))
    return "arctic";
  if (text.includes("lake") || text.includes("boat")) return "boats";
  return CATEGORIES[index % CATEGORIES.length];
}

const CITY_COORDINATES = {
  malibu: [-118.7798, 34.0259],
  "new york": [-74.006, 40.7128],
  aspen: [-106.8175, 39.1911],
  florence: [11.2558, 43.7696],
  portland: [-122.6784, 45.5152],
  cancun: [-86.8515, 21.1619],
  boston: [-71.0589, 42.3601],
  tokyo: [139.6917, 35.6895],
  paris: [2.3522, 48.8566],
  london: [-0.1278, 51.5074],
  rome: [12.4964, 41.9028],
  bali: [115.1889, -8.4095],
  delhi: [77.1025, 28.7041],
  jaipur: [75.7873, 26.9124],
  goa: [73.818, 15.2993],
  dubai: [55.2708, 25.2048],
};

function getCoordinates(location, country) {
  const query = `${location} ${country}`.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (query.includes(key)) {
      const jitterLon = (Math.random() - 0.5) * 0.04;
      const jitterLat = (Math.random() - 0.5) * 0.04;
      return [coords[0] + jitterLon, coords[1] + jitterLat];
    }
  }
  return [77.209 + (Math.random() - 0.5) * 2, 28.6139 + (Math.random() - 0.5) * 2];
}

async function initDB() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to MongoDB for initialization...");

  // Clean existing data
  await Listing.deleteMany({});
  await Review.deleteMany({});
  await Booking.deleteMany({});
  console.log("Cleared existing listings, reviews, and bookings.");

  // Ensure Demo Host User
  let demoHost = await User.findOne({ username: "demohost" });
  if (!demoHost) {
    const hostUser = new User({
      username: "demohost",
      email: "host@wanderlust.com",
      name: "Sophia Martinez (Superhost)",
      role: "host",
      avatar: {
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        filename: "host_avatar",
      },
      bio: "Hospitality professional and passionate traveler hosting curated stays around the world.",
      phone: "+1 (555) 321-9876",
    });
    demoHost = await User.register(hostUser, "password123");
    console.log("Created demo host user: demohost / password123");
  }

  // Ensure Demo Guest/Traveler User
  let traveler = await User.findOne({ username: "traveler" });
  if (!traveler) {
    const guestUser = new User({
      username: "traveler",
      email: "traveler@wanderlust.com",
      name: "Alex Johnson",
      role: "user",
      avatar: {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        filename: "guest_avatar",
      },
      bio: "Avid explorer, photographer and architecture enthusiast.",
      phone: "+1 (555) 789-1234",
    });
    traveler = await User.register(guestUser, "password123");
    console.log("Created demo traveler user: traveler / password123");
  }

  // Process Listings
  const preparedListings = initData.data.map((obj, idx) => {
    const imgUrl =
      typeof obj.image === "object" && obj.image.url
        ? obj.image.url
        : typeof obj.image === "string"
        ? obj.image
        : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

    const category = determineCategory(obj, idx);
    const coords = getCoordinates(obj.location, obj.country);

    // Pick 4-6 realistic amenities
    const shuffledAmenities = [...ALL_AMENITIES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    return {
      title: obj.title,
      description: obj.description,
      image: imgUrl,
      images: [
        {
          url: imgUrl,
          filename: "listing_seed_image",
        },
      ],
      price: obj.price,
      location: obj.location,
      country: obj.country,
      category: category,
      amenities: shuffledAmenities,
      geometry: {
        type: "Point",
        coordinates: coords,
      },
      owner: demoHost._id,
      reviews: [],
    };
  });

  const insertedListings = await Listing.insertMany(preparedListings);
  console.log(`Inserted ${insertedListings.length} listings into database.`);

  // Add sample reviews to the first 10 listings
  const sampleComments = [
    "Absolutely breathtaking views and pristine amenities! Will definitely return.",
    "Such a peaceful and cozy stay. The host was incredibly responsive and helpful.",
    "Perfect location close to everything yet very quiet and comfortable. Highly recommended!",
    "Exceeded all our expectations! Spotless rooms, fast Wi-Fi, and charming decor.",
    "A wonderful experience for our family getaway. 5 stars all the way!",
  ];

  for (let i = 0; i < Math.min(10, insertedListings.length); i++) {
    const listing = insertedListings[i];
    const review = new Review({
      comment: sampleComments[i % sampleComments.length],
      rating: 4 + (i % 2), // 4 or 5 stars
      author: traveler._id,
      createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3),
    });
    await review.save();
    listing.reviews.push(review._id);
    await listing.save();
  }

  console.log("Attached sample reviews and ratings to initial listings.");
  console.log("Database initialization completed successfully!");
  await mongoose.connection.close();
}

initDB().catch((err) => {
  console.error("Database seeding failed:", err);
  process.exit(1);
});
