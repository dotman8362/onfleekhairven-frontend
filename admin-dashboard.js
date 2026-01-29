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

    const res = await fetch("https://onfleekhairven-backend.onrender.com/api/admin/bookings", {
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

    const res = await fetch(`https://onfleekhairven-backend.onrender.com/api/admin/bookings/${id}/confirm`, {
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
  const res = await fetch("https://onfleekhairven-backend.onrender.com/api/availability");
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
   const dates = flatpickrInstance.selectedDates.map(d => {
  // Convert to local YYYY-MM-DD string manually
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

  if (!dates.length) {
    alert("Please select at least one date");
    return;
  }

  try {
    const res = await fetch("https://onfleekhairven-backend.onrender.com/api/block-dates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // if you use auth
      },
      body: JSON.stringify({ dates }) // send array of dates
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to block dates");
      return;
    }

    availabilityInput._flatpickr.clear(); // clear selection
    loadBlockedDates(); // refresh blocked dates list
  } catch (err) {
    console.error(err);
    alert("Failed to block dates");
  }
});



async function removeBlockedDate(date) {
  await fetch(`https://onfleekhairven-backend.onrender.com/api/availability/${date}`, {
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



// Block Month button
const blockMonthBtn = document.getElementById("blockMonthBtn");
const blockMonthInput = document.getElementById("blockMonthInput");
const blockedMonthsList = document.getElementById("blockedMonthsList");
const monthEmptyState = document.getElementById("monthEmptyState");

// Add Block Month functionality
blockMonthBtn.addEventListener("click", async () => {
  const monthValue = blockMonthInput.value; // format YYYY-MM
  if (!monthValue) return Swal.fire("Error", "Please select a month", "error");

  const [year, month] = monthValue.split("-"); // split into year & month

  try {
    blockMonthBtn.disabled = true;
    blockMonthBtn.textContent = "Blocking...";

    const res = await fetch("https://onfleekhairven-backend.onrender.com/api/block-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      addBlockedMonthToUI(data.blocked);
      Swal.fire("Success", "Month blocked successfully", "success");
      blockMonthInput.value = "";
    } else {
      Swal.fire("Error", data.message || "Failed to block month", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Server error", "error");
  } finally {
    blockMonthBtn.disabled = false;
    blockMonthBtn.textContent = "Block Month";
  }
});

// Helper: add month to list with delete button
function addBlockedMonthToUI(blocked) {
  monthEmptyState.style.display = "none";

  const li = document.createElement("li");
  li.classList.add("flex", "justify-between", "items-center");

  const span = document.createElement("span");
  span.textContent = `${blocked.year}-${blocked.month}`;

  const btn = document.createElement("button");
  btn.textContent = "Unblock";
  btn.classList.add("px-2", "py-1", "text-xs", "bg-red-600", "rounded", "text-white");
  btn.addEventListener("click", () => unblockMonth(blocked._id, li));

  li.appendChild(span);
  li.appendChild(btn);
  blockedMonthsList.appendChild(li);
}

async function loadBlockedMonths() {
  try {
    const res = await fetch("https://onfleekhairven-backend.onrender.com/api/blocked-months");
    const months = await res.json();

    blockedMonthsList.innerHTML = "";

    if (months.length === 0) {
      monthEmptyState.style.display = "block";
    } else {
      monthEmptyState.style.display = "none";
      months.forEach((m) => addBlockedMonthToUI(m));
    }
  } catch (err) {
    console.error(err);
  }
}

// Call on page load
loadBlockedMonths();


const btn = document.createElement("button");
btn.textContent = "Unblock";
btn.classList.add("px-2", "py-1", "text-xs", "bg-red-600", "rounded", "text-white");
btn.addEventListener("click", () => unblockMonth(blocked._id, li));


async function unblockMonth(id, liElement) {
  try {
    const res = await fetch(`https://onfleekhairven-backend.onrender.com/api/unblock-month/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok && data.success) {
      liElement.remove(); // remove from UI
      if (!blockedMonthsList.hasChildNodes()) monthEmptyState.style.display = "block";
      Swal.fire("Success", "Month unblocked", "success");
    } else {
      Swal.fire("Error", data.message || "Failed to unblock month", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Server error", "error");
  }
}





const flatpickrInstance = flatpickr(availabilityInput, {
  mode: "multiple",      // allows multiple dates
  dateFormat: "Y-m-d",   // returns strings directly
  minDate: "today"
});



// Send `selectedDates` array to backend
