// Initialize the map
const map = L.map("map").setView([46.680790058363776, 21.09654162212722], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add a marker for the specific restaurant
L.marker([46.680790058363776, 21.09654162212722])
  .addTo(map)
  .bindPopup("Specified Restaurant Location")
  .openPopup();

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

// Call findNearbyRestaurants with the provided coordinates
findNearbyRestaurants(46.680790058363776, 21.09654162212722);
