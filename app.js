// Initialize the map
const map = L.map("map").setView([0, 0], 15); // Default center at (0, 0)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let userMarker = null; // Initialize userMarker variable

// Function to get user's current location
function getUserLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);

        // Remove previous "you are here" marker if exists
        if (userMarker) {
          map.removeLayer(userMarker);
        }

        // Add new "you are here" marker
        const redIcon = L.icon({
          iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        userMarker = L.marker([latitude, longitude], { icon: redIcon })
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();

        findNearbyRestaurants(latitude, longitude);
      },
      (error) => {
        console.error("Error getting user location:", error);
        alert(
          "Error getting your location. Please allow location access and try again."
        );
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// Function to find nearby restaurants using Overpass API
function findNearbyRestaurants(lat, lon) {
  const radius = document.getElementById("radius").value || 1000; // Default radius 1000 meters
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

// Function to display restaurants on the map
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

// Function to initiate search with user's current location
function searchNearbyRestaurants() {
  getUserLocation();
}

// Call getUserLocation() to start
getUserLocation();
