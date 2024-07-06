// Initialize the map
const map = L.map("map").setView([0, 0], 15); // Default center at (0, 0)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let userMarker = null; // Initialize userMarker variable
let placesService; // Initialize placesService variable

function initMap() {
  console.log("Google Maps API initialized");
  // Create a dummy div for PlacesService
  const mapDiv = document.createElement("div");
  document.body.appendChild(mapDiv);

  // Ensure google.maps.places is available
  if (google && google.maps && google.maps.places) {
    placesService = new google.maps.places.PlacesService(mapDiv);
    console.log("PlacesService initialized");
    // Now that everything is initialized, get the user's location
    getUserLocation();
  } else {
    console.error("Google Maps Places library not loaded");
    alert(
      "There was an error loading the map service. Please try refreshing the page."
    );
  }
}

// Make initMap globally accessible
window.initMap = initMap;

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
        alert("Unable to get your location. Using a default location.");
        // Use a default location (e.g., city center) if geolocation fails
        const defaultLat = 40.7128; // Example: New York City
        const defaultLon = -74.006;
        map.setView([defaultLat, defaultLon], 15);
        findNearbyRestaurants(defaultLat, defaultLon);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    alert(
      "Geolocation is not supported by your browser. Using a default location."
    );
    // Use a default location if geolocation is not supported
    const defaultLat = 40.7128; // Example: New York City
    const defaultLon = -74.006;
    map.setView([defaultLat, defaultLon], 15);
    findNearbyRestaurants(defaultLat, defaultLon);
  }
}

function findNearbyRestaurants(lat, lon) {
  if (!placesService) {
    console.error("PlacesService not initialized");
    // Retry initialization
    setTimeout(() => {
      initMap();
      findNearbyRestaurants(lat, lon);
    }, 2000); // Wait 2 seconds before retrying
    return;
  }

  const radius = document.getElementById("radius").value || 1000;
  const location = new google.maps.LatLng(lat, lon);

  const request = {
    location: location,
    radius: parseInt(radius),
    type: ["restaurant"],
  };

  console.log("Sending request to Places API:", request);

  placesService.nearbySearch(request, (results, status) => {
    console.log("Places API response status:", status);
    console.log("Places API results:", results);
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      displayRestaurants(results);
    } else {
      console.error("Error fetching restaurants:", status);
      alert("Error fetching nearby restaurants. Please try again later.");
    }
  });
}

function displayRestaurants(restaurants) {
  console.log("Displaying restaurants:", restaurants);
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<h2>Nearby Restaurants:</h2>";

  if (!restaurants || restaurants.length === 0) {
    console.log("No restaurants found");
    resultsDiv.innerHTML += "<p>No restaurants found in the area.</p>";
    return;
  }

  console.log(`Found ${restaurants.length} restaurants`);

  restaurants.forEach((restaurant, index) => {
    console.log(`Processing restaurant ${index + 1}:`, restaurant.name);
    const lat = restaurant.geometry.location.lat();
    const lon = restaurant.geometry.location.lng();
    const name = restaurant.name;

    L.marker([lat, lon]).addTo(map).bindPopup(name);

    const restaurantDiv = document.createElement("div");
    restaurantDiv.className = "restaurant-info";

    restaurantDiv.innerHTML = `
      <h3>${name}</h3>
      <img src="${
        restaurant.photos && restaurant.photos[0]
          ? restaurant.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })
          : "placeholder.jpg"
      }" alt="${name}">
      <p>Rating: ${restaurant.rating ? restaurant.rating + "/5" : "N/A"}</p>
      <p>Type: ${restaurant.types ? restaurant.types.join(", ") : "N/A"}</p>
      <p>${restaurant.vicinity || "Address not available"}</p>
    `;

    resultsDiv.appendChild(restaurantDiv);

    // Fetch additional details
    const request = {
      placeId: restaurant.place_id,
      fields: ["review", "website"],
    };

    placesService.getDetails(request, (place, status) => {
      console.log(`Details for ${name}:`, status, place);
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        if (place.website) {
          restaurantDiv.innerHTML += `<p><a href="${place.website}" target="_blank">Website</a></p>`;
        }
        if (place.reviews && place.reviews.length > 0) {
          const review = place.reviews[0];
          restaurantDiv.innerHTML += `
            <h4>Recent Review</h4>
            <p>"${review.text.substring(0, 100)}..."</p>
            <p>- ${review.author_name}</p>
          `;
        }
      }
    });
  });
}

// Function to initiate search with user's current location
function searchNearbyRestaurants() {
  getUserLocation();
}

// Function to update the displayed radius value
function updateRadiusValue() {
  const radiusValue = document.getElementById("radius").value;
  document.getElementById("radiusValue").textContent = radiusValue;
}

// The initMap function will be called by the Google Maps API once it's loaded
