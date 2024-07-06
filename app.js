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
        map.setView([lat, lon], 15);
        L.marker([lat, lon]).addTo(map).bindPopup("You are here").openPopup();
        findNearbyRestaurants(lat, lon);
      },
      function (error) {
        console.error("Error getting location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
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

  fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  )
    .then((response) => response.json())
    .then((data) => {
      displayRestaurants(data.elements);
    })
    .catch((error) => console.error("Error fetching restaurants:", error));
}

// Display restaurants on the map
function displayRestaurants(restaurants) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<h2>Nearby Restaurants:</h2>";

  restaurants.forEach((restaurant) => {
    const lat = restaurant.lat || restaurant.center.lat;
    const lon = restaurant.lon || restaurant.center.lon;
    const name = restaurant.tags.name || "Unnamed restaurant";

    L.marker([lat, lon]).addTo(map).bindPopup(name);
    resultsDiv.innerHTML += `<p>${name}</p>`;
  });
}

// Call getUserLocation when the page loads
getUserLocation();
