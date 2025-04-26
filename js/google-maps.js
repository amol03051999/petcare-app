let map;
let service;
let userPosition;

window.initMap = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      map = new google.maps.Map(document.getElementById("map"), {
        center: userPosition,
        zoom: 14,
      });

      new google.maps.Marker({
        position: userPosition,
        map,
        title: "You are here",
      });

      searchVets();

      const searchInput = document.getElementById("clinicSearch");
      const openNowCheckbox = document.getElementById("openNowFilter");

      searchInput.addEventListener("input", () => {
        const term = searchInput.value.trim();
        if (term.length > 2) {
          searchVetsByText(term);
        } else {
          searchVets();
        }
      });

      openNowCheckbox.addEventListener("change", () => {
        const term = searchInput.value.trim();
        if (term.length > 2) {
          searchVetsByText(term);
        } else {
          searchVets();
        }
      });
    }, () => {
      console.warn("Location denied. Loading mock vet list.");
      loadMockVets();
    });
  } else {
    alert("Geolocation is not supported.");
    loadMockVets();
  }
};

function searchVets() {
  const request = {
    location: userPosition,
    radius: '5000',
    type: ['veterinary_care']
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      applyFilters(results);
    }
  });
}

function searchVetsByText(city) {
  const query = `veterinary clinics in ${city}`;
  const request = {
    query,
    fields: ['name', 'geometry', 'vicinity', 'opening_hours'],
  };

  service = new google.maps.places.PlacesService(map);
  service.textSearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      applyFilters(results);
      map.setCenter(results[0].geometry.location);
    }
  });
}

function applyFilters(results) {
  const searchTerm = document.getElementById("clinicSearch").value.toLowerCase();
  const openOnly = document.getElementById("openNowFilter").checked;

  const filtered = results.filter((place) => {
    const matchesName = place.name.toLowerCase().includes(searchTerm);
    const matchesAddress = (place.vicinity || "").toLowerCase().includes(searchTerm);
    const matchesOpen = !openOnly || (place.opening_hours && place.opening_hours.open_now);
    return (matchesName || matchesAddress) && matchesOpen;
  });

  displayClinics(filtered);
}

function displayClinics(clinics) {
  const list = document.getElementById("clinicList");
  list.innerHTML = "";

  clinics.forEach((place) => {
    const address = place.vicinity || "Address unavailable";
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name,
    });

    list.innerHTML += `
      <li>
        <strong>${place.name}</strong><br/>
        ${address}<br/>
        ${place.opening_hours?.open_now ? "<em>Open now</em><br/>" : ""}
        <a href="${mapsLink}" target="_blank" class="get-directions">Get Directions</a>
      </li>
    `;
  });
}

function loadMockVets() {
  const mockVets = [
    {
      name: "City Paws Emergency Vet",
      address: "123 Bark Lane, Petville",
      phone: "(555) 123-4567",
      open24: true,
    },
    {
      name: "All Creatures ER Clinic",
      address: "789 Tail Rd, Animal City",
      phone: "(555) 987-6543",
      open24: false,
    },
    {
      name: "Rapid Response Vet Center",
      address: "456 Meow St, Dogtown",
      phone: "(555) 555-2020",
      open24: true,
    },
  ];

  const list = document.getElementById("clinicList");
  list.innerHTML = "";

  mockVets.forEach((clinic) => {
    list.innerHTML += `
      <li>
        <strong>${clinic.name}</strong><br/>
        ${clinic.address}<br/>
        Phone: <a href="tel:${clinic.phone.replace(/\D/g, "")}">${clinic.phone}</a><br/>
        ${clinic.open24 ? "<em>Open 24/7</em>" : "Check hours"}
      </li>
    `;
  });
}