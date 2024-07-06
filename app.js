// Initialize the map
const map = L.map("map").setView([0, 0], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Get user's location
function getUserLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("User location:", lat, lon);
        map.setView([lat, lon], 15);
        L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
        findNearbyRestaurants(lat, lon);
      },
      function (error) {
        console.error("Error getting location:", error);
        alert(
          "Unable to get your location. Please check your browser settings."
        );
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    alert("Geolocation is not supported by your browser.");
  }
}

// Find nearby restaurants using Overpass API
function findNearbyRestaurants(lat, lon) {
  const radius = 1000; // 1km radius
  const query = `
    [out:json];
    (
      node["amenity"="restaurant"](around:${radius},${lat},${lon});
      way["amenity"="restaurant"](around:${radius},${lat},${lon});
      relation["amenity"="restaurant"](around:${radius},${lat},${lon});
    );
    out center;
    `;

  console.log("Querying Overpass API...");
  fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Overpass API response:", data);
      if (data.elements && data.elements.length > 0) {
        displayRestaurants(data.elements);
      } else {
        console.log("No restaurants found nearby.");
        alert("No restaurants found nearby. Try increasing the search radius.");
      }
    })
    .catch((error) => {
      console.error("Error fetching restaurants:", error);
      alert("Error fetching nearby restaurants. Please try again later.");
    });
}

// Display restaurants on the map
function displayRestaurants(restaurants) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<h2>Nearby Restaurants:</h2>";

  console.log("Displaying restaurants:", restaurants);
  restaurants.forEach((restaurant) => {
    const lat = restaurant.lat || (restaurant.center && restaurant.center.lat);
    const lon = restaurant.lon || (restaurant.center && restaurant.center.lon);
    const name = restaurant.tags.name || "Unnamed restaurant";

    if (lat && lon) {
      L.marker([lat, lon]).addTo(map).bindPopup(name);
      resultsDiv.innerHTML += `<p>${name}</p>`;
    } else {
      console.warn("Invalid coordinates for restaurant:", restaurant);
    }
  });

  if (resultsDiv.innerHTML === "<h2>Nearby Restaurants:</h2>") {
    resultsDiv.innerHTML += "<p>No valid restaurants found.</p>";
  }
}

// Call getUserLocation when the page loads
getUserLocation();
