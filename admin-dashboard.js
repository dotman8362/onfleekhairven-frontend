  function showSection(section) {
    const bookings = document.getElementById("bookingsSection");
    const availability = document.getElementById("availabilitySection");

    if (section === "bookings") {
      bookings.classList.remove("hidden");
      availability.classList.add("hidden");
    } else {
      availability.classList.remove("hidden");
      bookings.classList.add("hidden");
    }
  }

  // Default view
  showSection("bookings");



const token = localStorage.getItem("adminToken");


// Redirect if not logged in
if (!token) {
  window.location.href = "admin-login.html";
}

const bookingTable = document.getElementById("bookingTable");
const logoutBtn = document.getElementById("logoutBtn");

const availabilityInput = document.getElementById("availabilityDate");
const blockDateBtn = document.getElementById("blockDateBtn");
const blockedDatesList = document.getElementById("blockedDatesList");

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  window.location.href = "admin-login.html";
});


/* -------------------------
   BOOKINGS
-------------------------- */

// const bookingTable = document.getElementById("bookingTable");
const spinner = document.getElementById("loadingSpinner");

async function loadBookings() {
  try {
    spinner.classList.remove("hidden");

    const res = await fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const bookings = await res.json();
    bookingTable.innerHTML = "";
    spinner.classList.add("hidden");

    bookings.forEach(booking => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td class="px-4 py-3">${booking.fullName}</td>
        <td class="px-4 py-3">${booking.serviceName}</td>
        <td class="px-4 py-3">${booking.date}</td>
        <td class="px-4 py-3">${booking.time}</td>
        <td class="px-4 py-3">£${booking.price}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs ${
            booking.status === "confirmed"
              ? "bg-green-100 text-green-600"
              : "bg-yellow-100 text-yellow-600"
          }">
            ${booking.status}
          </span>
        </td>
        <td class="px-4 py-3 text-right">
          ${
            booking.status === "pending"
              ? `<button onclick="confirmPayment('${booking._id}')"
                  class="text-indigo-600 hover:underline text-sm">
                  Confirm Payment
                </button>`
              : `<span class="text-gray-400 text-xs">Confirmed</span>`
          }
        </td>
      `;

      bookingTable.appendChild(tr);
    });

  } catch (error) {
    spinner.classList.add("hidden");
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Failed to load bookings",
    });
  }
}


async function confirmPayment(id) {
  try {
    spinner.classList.remove("hidden");

    const res = await fetch(`/api/admin/bookings/${id}/confirm`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    spinner.classList.add("hidden");

    if (!res.ok) throw new Error();

    Swal.fire({
      icon: "success",
      title: "Confirmed!",
      text: "Booking confirmed & email sent.",
      timer: 1800,
      showConfirmButton: false
    });

    loadBookings();
  } catch {
    spinner.classList.add("hidden");
    Swal.fire({
      icon: "error",
      title: "Failed",
      text: "Could not confirm booking",
    });
  }
}

/* -------------------------
   AVAILABILITY (BLOCK DATES)
-------------------------- */

async function loadBlockedDates() {
  const res = await fetch("/api/availability");
  const data = await res.json();

  blockedDatesList.innerHTML = "";

  if (!data.length) {
    blockedDatesList.innerHTML =
      `<li class="text-gray-400 text-xs">No blocked dates</li>`;
    return;
  }

  data.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "flex justify-between items-center bg-gray-100 rounded-lg px-3 py-2";

    li.innerHTML = `
      <span>${item}</span>
      <button
        class="text-xs text-red-500 hover:underline"
        onclick="removeBlockedDate('${item}')"
      >
        Remove
      </button>
    `;

    blockedDatesList.appendChild(li);
  });
}


blockDateBtn.addEventListener("click", async () => {
  const date = availabilityInput.value;

  if (!date) {
    alert("Please select a date");
    return;
  }

  try {
    const res = await fetch("/api/availability/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date })
 // <-- correct format
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to block date");
      return;
    }

    availabilityInput.value = "";
    loadBlockedDates();
  } catch (err) {
    alert("Failed to block date");
  }
});


async function removeBlockedDate(date) {
  await fetch(`/api/availability/${date}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
  loadBlockedDates();
}


/* -------------------------
   INITIAL LOAD
-------------------------- */

loadBookings();
loadBlockedDates();
