/**
 * Wanderlust Client-Side Scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // 1. Bootstrap Form Validation Starter
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });

  // 2. Dynamic Tax Display Toggle
  const taxSwitch = document.getElementById("taxSwitch");
  const taxSwitchMobile = document.getElementById("taxSwitchMobile");
  const taxInfoElements = document.querySelectorAll(".tax-info");
  const basePriceElements = document.querySelectorAll(".base-price");

  function toggleTaxes(show) {
    taxInfoElements.forEach((el) => {
      if (show) {
        el.classList.remove("d-none");
      } else {
        el.classList.add("d-none");
      }
    });

    basePriceElements.forEach((el) => {
      if (show) {
        el.classList.add("d-none");
      } else {
        el.classList.remove("d-none");
      }
    });

    if (taxSwitch) taxSwitch.checked = show;
    if (taxSwitchMobile) taxSwitchMobile.checked = show;
  }

  if (taxSwitch) {
    taxSwitch.addEventListener("change", (e) => {
      toggleTaxes(e.target.checked);
    });
  }

  if (taxSwitchMobile) {
    taxSwitchMobile.addEventListener("change", (e) => {
      toggleTaxes(e.target.checked);
    });
  }

  // 3. Wishlist AJAX Toggle Handler
  const wishlistButtons = document.querySelectorAll(".wishlist-btn[data-listing-id], .wishlist-btn-show[data-listing-id]");

  wishlistButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const listingId = btn.getAttribute("data-listing-id");
      if (!listingId) return;

      try {
        const response = await fetch(`/listings/${listingId}/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const heartIcon = btn.querySelector("i");
          const labelSpan = btn.querySelector("span");

          if (data.saved) {
            btn.classList.add("active");
            if (heartIcon) {
              heartIcon.classList.remove("fa-regular");
              heartIcon.classList.add("fa-solid", "text-danger");
            }
            if (labelSpan) labelSpan.textContent = "Saved";
          } else {
            btn.classList.remove("active");
            if (heartIcon) {
              heartIcon.classList.remove("fa-solid", "text-danger");
              heartIcon.classList.add("fa-regular");
            }
            if (labelSpan) labelSpan.textContent = "Save";
          }

          // Pulse animation
          btn.animate(
            [
              { transform: "scale(1)" },
              { transform: "scale(1.25)" },
              { transform: "scale(1)" },
            ],
            { duration: 250 }
          );
        }
      } catch (err) {
        console.error("Failed to update wishlist:", err);
      }
    });
  });

  // 4. Auto-dismiss alerts after 5 seconds
  const autoAlerts = document.querySelectorAll(".alert-dismissible");
  autoAlerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 5000);
  });
});
