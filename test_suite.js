const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {};
    if (options.cookie) {
      defaultHeaders["Cookie"] = options.cookie;
    }
    if (options.body && options.headers && options.headers["Content-Type"]) {
      defaultHeaders["Content-Type"] = options.headers["Content-Type"];
      defaultHeaders["Content-Length"] = Buffer.byteLength(options.body);
    }

    const req = http.request(
      `http://localhost:8080${path}`,
      {
        method: options.method || "GET",
        headers: { ...defaultHeaders, ...options.headers },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE INTEGRATION TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // Test 1: Root redirect
    const resRoot = await request("/");
    assert(resRoot.statusCode === 302 && resRoot.headers.location === "/listings", "GET / redirects to /listings");

    // Test 2: Explore Listings Page
    const resListings = await request("/listings");
    assert(resListings.statusCode === 200, "GET /listings returns 200");
    assert(resListings.body.includes("wanderlust"), "GET /listings contains brand text");
    assert(resListings.body.includes("property-card"), "GET /listings contains property cards");

    // Test 3: Category Filter
    const resBeach = await request("/listings?category=beachfront");
    assert(resBeach.statusCode === 200, "GET /listings?category=beachfront returns 200");

    // Test 4: Search Filter
    const resSearch = await request("/listings?search=Malibu");
    assert(resSearch.statusCode === 200 && resSearch.body.includes("Malibu"), "GET /listings?search=Malibu finds Malibu stay");

    // Test 5: Unauthenticated protected route
    const resNewUnauth = await request("/listings/new");
    assert(resNewUnauth.statusCode === 302 && resNewUnauth.headers.location === "/login", "GET /listings/new redirects to /login when unauthenticated");

    // Test 6: Static Pages
    const resPrivacy = await request("/privacy");
    assert(resPrivacy.statusCode === 200 && resPrivacy.body.includes("Privacy Policy"), "GET /privacy renders Privacy Policy");
    const resTerms = await request("/terms");
    assert(resTerms.statusCode === 200 && resTerms.body.includes("Terms of Service"), "GET /terms renders Terms of Service");

    // Test 7: 404 Error Handler
    const res404 = await request("/non-existent-route-404");
    assert(res404.statusCode === 404 && res404.body.includes("404"), "GET /non-existent returns 404 with custom error page");

    // Test 8: Login Flow with Superhost
    const loginData = "username=demohost&password=password123";
    const resLogin = await request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: loginData,
    });
    assert(resLogin.statusCode === 302, "POST /login returns 302 redirect");
    const rawCookies = resLogin.headers["set-cookie"];
    assert(rawCookies && rawCookies.length > 0, "POST /login returns session cookie");
    const sessionCookie = rawCookies ? rawCookies[0].split(";")[0] : "";

    // Test 9: Authenticated Access with Session Cookie
    const resNewAuth = await request("/listings/new", { cookie: sessionCookie });
    assert(resNewAuth.statusCode === 200 && resNewAuth.body.includes("Host your home on Wanderlust"), "GET /listings/new returns 200 when authenticated");

    const resMyListings = await request("/listings/my-listings", { cookie: sessionCookie });
    assert(resMyListings.statusCode === 200 && resMyListings.body.includes("My Hosted Listings"), "GET /listings/my-listings returns 200");

    const resProfile = await request("/profile", { cookie: sessionCookie });
    assert(resProfile.statusCode === 200 && resProfile.body.includes("demohost"), "GET /profile renders user profile");

    // Test 10: Show Page & Map & Details
    const match = resListings.body.match(/\/listings\/([a-f0-9]{24})/);
    assert(match && match[1], "Found valid listing ID from explore page");
    const sampleListingId = match ? match[1] : null;

    if (sampleListingId) {
      const resShow = await request(`/listings/${sampleListingId}`, { cookie: sessionCookie });
      assert(resShow.statusCode === 200 && resShow.body.includes("booking-widget-card"), "GET /listings/:id renders show page with booking widget");
      assert(resShow.body.includes("id=\"map\""), "GET /listings/:id contains map element");

      // Test 11: Wishlist AJAX Toggle
      const resWishlist = await request(`/listings/${sampleListingId}/wishlist`, {
        method: "POST",
        cookie: sessionCookie,
        headers: { "Accept": "application/json" }
      });
      assert(resWishlist.statusCode === 200, "POST /listings/:id/wishlist returns 200 JSON");
      const wishData = JSON.parse(resWishlist.body);
      assert(typeof wishData.saved === "boolean", `Wishlist saved status is boolean: ${wishData.saved}`);
    }

    // Test 12: Booking Flow with Traveler Account
    const travelerLoginData = "username=traveler&password=password123";
    const resTravelerLogin = await request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: travelerLoginData,
    });
    const travelerCookies = resTravelerLogin.headers["set-cookie"];
    const travelerSession = travelerCookies ? travelerCookies[0].split(";")[0] : "";

    if (sampleListingId && travelerSession) {
      // Future dates for booking
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 10);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 14);

      const checkInStr = tomorrow.toISOString().split("T")[0];
      const checkOutStr = dayAfter.toISOString().split("T")[0];

      const bookingBody = `booking%5BcheckIn%5D=${checkInStr}&booking%5BcheckOut%5D=${checkOutStr}&booking%5Bguests%5D=2&booking%5BspecialRequests%5D=Late+arrival`;

      const resBook = await request(`/listings/${sampleListingId}/bookings`, {
        method: "POST",
        cookie: travelerSession,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bookingBody,
      });

      assert(resBook.statusCode === 302 && resBook.headers.location.startsWith("/bookings/"), "POST /listings/:id/bookings successfully creates reservation and redirects to receipt");
      const bookingUrl = resBook.headers.location;

      // View Booking Confirmation
      const resReceipt = await request(bookingUrl, { cookie: travelerSession });
      assert(resReceipt.statusCode === 200 && resReceipt.body.includes("Reservation Confirmed"), "GET /bookings/:id renders confirmation receipt");

      // Test Overlapping Booking Prevention
      const resOverlap = await request(`/listings/${sampleListingId}/bookings`, {
        method: "POST",
        cookie: travelerSession,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bookingBody,
      });
      assert(resOverlap.statusCode === 302 && resOverlap.headers.location.includes(`/listings/${sampleListingId}`), "Duplicate / overlapping booking date is prevented");

      // Test My Bookings Page
      const resMyBookings = await request("/bookings", { cookie: travelerSession });
      assert(resMyBookings.statusCode === 200 && resMyBookings.body.includes("My Trips & Reservations"), "GET /bookings lists traveler trips");
    }

    console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

