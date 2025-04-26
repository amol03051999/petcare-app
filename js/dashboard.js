// 🛎️ Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// 🛎️ Initialize Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBzFAQGxX63FJsS5jAYGJM5xAybtddJNDQ",
  authDomain: "petapp-751c5.firebaseapp.com",
  projectId: "petapp-751c5",
  storageBucket: "petapp-751c5.firebasestorage.app",
  messagingSenderId: "185829692971",
  appId: "1:185829692971:web:2d1853fd7a95f4dfffbc6e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 🛎️ Setup Global DOM Elements

const userNameEl = document.getElementById("userName");
const petCards = document.getElementById("petCards");
const petSelector = document.getElementById("petSelector");
const reminderList = document.getElementById("reminderList");
const reminderForm = document.getElementById("reminderForm");
const reminderTitle = document.getElementById("reminderTitle");
const reminderDateTime = document.getElementById("reminderDateTime");
const reminderNotes = document.getElementById("reminderNotes");
const activityForm = document.getElementById("activityForm");
const activityList = document.getElementById("activityList");
const logoutBtn = document.getElementById("logoutBtn");
const appointmentForm = document.getElementById("appointmentForm");
const clinicName = document.getElementById("clinicName");
const appointmentDateTime = document.getElementById("appointmentDateTime");
const appointmentNotes = document.getElementById("appointmentNotes");
const appointmentList = document.getElementById("appointmentList");
const appointmentReminder = document.getElementById("appointmentReminder");
const healthForm = document.getElementById("healthForm");
const healthList = document.getElementById("healthList");
const healthDate = document.getElementById("healthDate");
const healthSymptom = document.getElementById("healthSymptom");
const healthNotes = document.getElementById("healthNotes");
const insuranceForm = document.getElementById("insuranceForm");
const provider = document.getElementById("provider");
const policyNumber = document.getElementById("policyNumber");
const emergencyContact = document.getElementById("emergencyContact");
const insuranceDoc = document.getElementById("insuranceDoc");
const insuranceNotes = document.getElementById("insuranceNotes");
const insuranceDisplay = document.getElementById("insuranceDisplay");
const mealForm = document.getElementById("mealForm");
const mealType = document.getElementById("mealType");
const mealTime = document.getElementById("mealTime");
const mealNotes = document.getElementById("mealNotes");
const mealList = document.getElementById("mealList");
const vaccineForm = document.getElementById("vaccineForm");
const vaccineName = document.getElementById("vaccineName");
const vaccineDate = document.getElementById("vaccineDate");
const vaccineNotes = document.getElementById("vaccineNotes");
const vaccineList = document.getElementById("vaccineList");
const vaccineReminder = document.getElementById("vaccineReminder");
const weightList = document.getElementById("weightList");

let selectedPetId = null;
let selectedPetName = null;

// Tab switching script for sidebar navigation
const sidebarLinks = document.querySelectorAll('.sidebar nav a[data-section]');
const sections = document.querySelectorAll('.content-section');


sidebarLinks.forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();

    const sectionId = link.getAttribute('data-section'); // ✅ This line must be first

    // ✅ NOW this works:
    if (sectionId === 'careTips' && auth.currentUser && selectedPetId) {
      const docRef = doc(db, "pets", selectedPetId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const pet = docSnap.data();
        loadCareTips({ name: pet.name, breed: pet.breed, age: pet.age });
      }
    }

    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(section => {
      section.classList.toggle('active', section.id === sectionId);
    });

    if (sectionId === 'vaccination' && auth.currentUser && selectedPetId) {
      loadVaccinations(auth.currentUser.uid, selectedPetId);
    }
    if (sectionId === 'weight' && auth.currentUser && selectedPetId) {
      loadWeightData(auth.currentUser.uid, selectedPetId);
    }
    if (sectionId === 'insurance' && auth.currentUser && selectedPetId) {
      loadInsurance(auth.currentUser.uid, selectedPetId);
    }
    if (sectionId === "summary" && auth.currentUser) {
      loadSummary(auth.currentUser.uid);
    }
  });
});



// Optional: Set default tab on load
window.addEventListener('DOMContentLoaded', () => {
  const storedPetId = localStorage.getItem("selectedPetId");
  if (!storedPetId) {
    const defaultTab = document.querySelector('.sidebar nav a[data-section]');
    if (defaultTab) defaultTab.click();
  }
});
let suppressReminders = true;
setTimeout(() => suppressReminders = false, 3000);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userNameEl.textContent = user.email.split("@")[0];
    await loadPets(user.uid);

    const storedPetId = localStorage.getItem("selectedPetId");
    const storedPetName = localStorage.getItem("selectedPetName");

    if (storedPetId && storedPetName) {
     

      selectPet(storedPetId, storedPetName);

      // Optional scroll
      // Automatically load vaccinations if vaccination tab is already active
const activeTab = document.querySelector(".sidebar nav a.active");
if (activeTab && activeTab.getAttribute("data-section") === "vaccination") {
  loadVaccinations(user.uid, storedPetId);
}
    }
  } else {
    window.location.href = "login.html";
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}



async function loadSummary(uid) {
  const summaryContent = document.getElementById("summaryContent");
  summaryContent.innerHTML = "<p>Loading summary...</p>";

  const petsSnapshot = await getDocs(query(collection(db, "pets"), where("ownerId", "==", uid)));
  const petSummaries = [];

  for (const petDoc of petsSnapshot.docs) {
    const petId = petDoc.id;
    const pet = petDoc.data();

    const [activities, reminders, appointments, weights, vaccinations] = await Promise.all([
      getDocs(query(collection(db, "activities"), where("userId", "==", uid), where("petId", "==", petId))),
      getDocs(query(collection(db, "reminders"), where("userId", "==", uid), where("petId", "==", petId))),
      getDocs(query(collection(db, "appointments"), where("userId", "==", uid), where("petId", "==", petId))),
      getDocs(query(collection(db, "weights"), where("userId", "==", uid), where("petId", "==", petId))),
      getDocs(query(collection(db, "vaccinations"), where("userId", "==", uid), where("petId", "==", petId)))
    ]);



    petSummaries.push({
      name: pet.name,
      image: pet.image || 'https://via.placeholder.com/150',
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      activities: activities.size,
      reminders: reminders.size,
      appointments: appointments.size,
      weights: weights.size,
      vaccinations: vaccinations.size
    });
  }

  summaryContent.innerHTML = petSummaries.map(pet => `
    <div class="card" style="border: 1px solid #ccc; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
      <img src="${pet.image}" alt="${pet.name}" style="width: 100%; max-width: 200px; border-radius: 6px;">
      <h3>${pet.name}</h3>
      <p><strong>Breed:</strong> ${pet.breed}</p>
      <p><strong>Age:</strong> ${pet.age}</p>
      <p><strong>Weight:</strong> ${pet.weight} kg</p>
      <ul>
        <li>📋 Activities: ${pet.activities}</li>
        <li>🔔 Reminders: ${pet.reminders}</li>
        <li>🏥 Appointments: ${pet.appointments}</li>
        <li>⚖️ Weight Entries: ${pet.weights}</li>
        <li>💉 Vaccinations/Medications: ${pet.vaccinations}</li>
      </ul>
    </div>
  `).join("");
}

window.addPet = async () => {
  const name = prompt("Pet's name:");
  const breed = prompt("Breed:");
  const age = prompt("Age:");
  const weight = prompt("Weight (kg):");
  const image = prompt("Image URL (optional):", "https://via.placeholder.com/150");
  const user = auth.currentUser;
  if (!user || !name || !breed || !age || !weight) return;
  await addDoc(collection(db, "pets"), {
    ownerId: user.uid,
    name,
    breed,
    age,
    weight,
    image
  });
  loadPets(user.uid);
};

async function loadPets(uid) {
  const q = query(collection(db, "pets"), where("ownerId", "==", uid));
  const snapshot = await getDocs(q);
  petCards.innerHTML = "";
  petSelector.innerHTML = "<option value=''>-- Select Pet --</option>";
  snapshot.forEach((docSnap) => {
    const pet = docSnap.data();
    const petId = docSnap.id;
    const petCard = document.createElement("div");
    petCard.className = "card";
    petCard.setAttribute("data-id", petId);
    petCard.innerHTML = `
    <img src="${pet.image || 'https://via.placeholder.com/150'}" alt="${pet.name}" style="width:100%; border-radius: 6px; margin-bottom: 0.5rem;">
    <h3>${pet.name}</h3>
    <p>Breed: ${pet.breed}</p>
    <p>Age: ${pet.age}</p>
    <p>Weight: ${pet.weight} kg</p>
    <button onclick="editPet('${petId}')">✏️ Edit</button>
    <button onclick="deletePet('${petId}')">🗑️ Delete</button>
  `;
  
    petCard.addEventListener("click", () => {
      selectPet(petId, pet.name);
    });
    petCards.appendChild(petCard);

    const option = document.createElement("option");
    option.value = petId;
    option.textContent = pet.name;
    petSelector.appendChild(option);
  });

  petSelector.addEventListener("change", () => {
    const selectedOption = petSelector.options[petSelector.selectedIndex];
    selectPet(petSelector.value, selectedOption.text);
  });
}

window.editPet = async (petId) => {
  const docRef = doc(db, "pets", petId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const pet = docSnap.data();
  const name = prompt("Edit name:", pet.name);
  const breed = prompt("Edit breed:", pet.breed);
  const age = prompt("Edit age:", pet.age);
  const weight = prompt("Edit weight (kg):", pet.weight);
  const image = prompt("Edit image URL:", pet.image || "");

  if (!name || !breed || !age || !weight) return;

  await updateDoc(docRef, {
    name,
    breed,
    age,
    weight,
    image
  });

  loadPets(auth.currentUser.uid);
};

window.deletePet = async (petId) => {
  if (!confirm("Are you sure you want to delete this pet?")) return;

  await deleteDoc(doc(db, "pets", petId));
  localStorage.removeItem("selectedPetId");
  localStorage.removeItem("selectedPetName");
  selectedPetId = null;
  selectedPetName = null;

  loadPets(auth.currentUser.uid);
};

function selectPet(petId, petName) {
  selectedPetId = petId;
  selectedPetName = petName;

  localStorage.setItem("selectedPetId", petId);
  localStorage.setItem("selectedPetName", petName);

  document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
  const selectedCard = document.querySelector(`.card[data-id='${petId}']`);
  if (selectedCard) selectedCard.classList.add("selected");

  petSelector.value = petId;
  updatePetLabel();

  const user = auth.currentUser;
  if (user) {
    loadActivities(user.uid, petId);
    loadReminders(user.uid, petId);
    loadAppointments(user.uid, petId);
    loadWeightData(user.uid, petId);
    loadHealthLogs(user.uid, petId);
    loadInsurance(user.uid, petId);
    loadMeals(user.uid, petId);
    loadEmergencyVets(petId);
    loadVaccinations(user.uid, petId);
    loadSummary(user.uid);
    loadCareTips(pet);
    checkReminders(petId); // ✅ Immediately checks reminders once pet is selected


  }

  document.getElementById("activityForm").scrollIntoView({ behavior: "smooth" });
}

function updatePetLabel() {
  const label = document.getElementById("selectedPetLabel");
  if (selectedPetId && selectedPetName) {
    label.textContent = `Tracking activities for: ${selectedPetName}`;
  } else {
    label.textContent = "Please select a pet to track activities.";
  }
}

activityForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const activityName = document.getElementById("activityName").value;
  const activityTime = document.getElementById("activityTime").value;
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;
  await addDoc(collection(db, "activities"), {
    userId: user.uid,
    petId: selectedPetId,
    name: activityName,
    time: activityTime
  });
  activityForm.reset();
  loadActivities(user.uid, selectedPetId);
});

async function loadActivities(uid, petId) {
  const q = query(collection(db, "activities"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);
  activityList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const a = docSnap.data();
    activityList.innerHTML += `
      <li>
        ${a.name} at ${new Date(a.time).toLocaleString()}
        <button onclick="deleteDoc(doc(db, 'activities', '${docSnap.id}')).then(() => loadActivities('${uid}', '${petId}'))">Delete</button>
      </li>`;
  });
}

reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;
  const [date, time] = reminderDateTime.value.split("T");
  await addDoc(collection(db, "reminders"), {
    userId: user.uid,
    petId: selectedPetId,
    title: reminderTitle.value,
    date: date,
    time: time,
    notes: reminderNotes.value
  });
  reminderForm.reset();
  loadReminders(user.uid, selectedPetId);
});

async function loadReminders(uid, petId) {
  const q = query(collection(db, "reminders"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);
  reminderList.innerHTML = "";
  if (snapshot.empty) {
    reminderList.innerHTML = "<li>No reminders yet for this pet.</li>";
    return;
  }
  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    reminderList.innerHTML += `
      <li>
        <strong>${r.title}</strong> on ${r.date} at ${r.time}
        ${r.notes ? `<em>(${r.notes})</em>` : ""}
        <button onclick="editReminder('${docSnap.id}', '${r.title}', '${r.date}', '${r.time}', '${r.notes || ''}')">Edit</button>
        <button onclick="deleteReminder('${docSnap.id}')">Delete</button>
      </li>`;
  });
}

window.editReminder = async (id, title, date, time, notes) => {
  const newTitle = prompt("Edit title:", title);
  const newDateTime = prompt("Edit date and time (yyyy-mm-ddThh:mm):", `${date}T${time}`);
  const newNotes = prompt("Edit notes:", notes);
  if (!newTitle || !newDateTime) return;
  const [newDate, newTime] = newDateTime.split("T");
  await updateDoc(doc(db, "reminders", id), {
    title: newTitle,
    date: newDate,
    time: newTime,
    notes: newNotes
  });
  loadReminders(auth.currentUser.uid, selectedPetId);
};

window.deleteReminder = async (id) => {
  await deleteDoc(doc(db, "reminders", id));
  loadReminders(auth.currentUser.uid, selectedPetId);
};

appointmentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;
  const [date, time] = appointmentDateTime.value.split("T");
  await addDoc(collection(db, "appointments"), {
    userId: user.uid,
    petId: selectedPetId,
    clinic: clinicName.value,
    date,
    time,
    notes: appointmentNotes.value,
    reminder: appointmentReminder.checked
  });
  
  appointmentForm.reset();
  loadAppointments(user.uid, selectedPetId);
});

async function loadAppointments(uid, petId) {
    const q = query(collection(db, "appointments"), where("userId", "==", uid), where("petId", "==", petId));
    const snapshot = await getDocs(q);
    appointmentList.innerHTML = "";
  
    if (snapshot.empty) {
      appointmentList.innerHTML = "<li>No vet appointments yet.</li>";
      return;
    }
  
    const today = new Date();
    snapshot.forEach(docSnap => {
      const a = docSnap.data();
      const appointmentDate = new Date(`${a.date}T${a.time}`);
      const daysLeft = Math.floor((appointmentDate - today) / (1000 * 60 * 60 * 24));
  
      const reminderTag = a.reminder && daysLeft <= 1
        ? daysLeft === 1
          ? `<strong style='color:orange'>(Reminder: Tomorrow)</strong>`
          : `<strong style='color:red'>(Today!)</strong>`
        : "";
  
      appointmentList.innerHTML += `
        <li>
          <strong>${a.clinic}</strong> on ${a.date} at ${a.time}
          ${a.notes ? `<em>(${a.notes})</em>` : ""}
          ${reminderTag}
          <button onclick="editAppointment('${docSnap.id}', '${a.clinic}', '${a.date}', '${a.time}', '${a.notes || ''}', ${a.reminder})">Edit</button>
          <button onclick="deleteAppointment('${docSnap.id}')">Delete</button>
        </li>`;
    });
  }
  window.editAppointment = async (id, clinic, date, time, notes, reminder) => {
    const newClinic = prompt("Edit clinic:", clinic);
    const newDateTime = prompt("Edit date and time (yyyy-mm-ddThh:mm):", `${date}T${time}`);
    const newNotes = prompt("Edit notes:", notes);
    const newReminder = confirm("Enable reminder for this appointment?");
    if (!newClinic || !newDateTime) return;
    const [newDate, newTime] = newDateTime.split("T");
    await updateDoc(doc(db, "appointments", id), {
      clinic: newClinic,
      date: newDate,
      time: newTime,
      notes: newNotes,
      reminder: newReminder
    });
    loadAppointments(auth.currentUser.uid, selectedPetId);
  };

window.deleteAppointment = async (id) => {
  await deleteDoc(doc(db, "appointments", id));
  loadAppointments(auth.currentUser.uid, selectedPetId);
};

const weightChartCanvas = document.getElementById("weightChart");
let weightChart;

async function loadWeightData(uid, petId) {
  const q = query(collection(db, "weights"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);

  const dates = [];
  const weights = [];
  const entries = [];

  if (snapshot.empty) {
    if (weightChart) weightChart.destroy();
    weightList.innerHTML = "<li>No weight entries yet.</li>";
    return;
  }

  snapshot.forEach(docSnap => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

  entries.forEach(entry => {
    const date = new Date(entry.timestamp.seconds * 1000);
    dates.push(date.toLocaleDateString());
    weights.push(entry.weight);
  });

  if (weightChart) weightChart.destroy();
  weightChart = new Chart(weightChartCanvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Weight (kg)',
        data: weights,
        fill: false,
        borderColor: '#b22222',
        backgroundColor: '#b22222',
        borderWidth: 2,
        tension: 0.3,
        pointStyle: 'circle',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Weight Monitoring Over Time',
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  });

  // Show editable list
  weightList.innerHTML = "";
  entries.slice().reverse().forEach(entry => {
    const dateStr = new Date(entry.timestamp.seconds * 1000).toLocaleString();
    weightList.innerHTML += `
      <li>
        ${entry.weight} kg on ${dateStr}
        <button onclick="editWeightEntry('${entry.id}', ${entry.weight}, '${new Date(entry.timestamp.seconds * 1000).toISOString()}')">✏️ Edit</button>
        <button onclick="deleteWeightEntry('${entry.id}')">🗑️ Delete</button>
      </li>`;
  });
}



window.logWeightEntry = async () => {
  const weightValue = document.getElementById("weightInput").value;
  const dateTimeValue = document.getElementById("weightDateTime").value;

  if (!weightValue || !selectedPetId || !dateTimeValue) {
    return alert("Please select a pet and enter both date and weight.");
  }

  const dateObj = new Date(dateTimeValue);

  await addDoc(collection(db, "weights"), {
    userId: auth.currentUser.uid,
    petId: selectedPetId,
    weight: parseFloat(weightValue),
    timestamp: dateObj
  });

  // Clear fields
  document.getElementById("weightInput").value = "";
  document.getElementById("weightDateTime").value = "";

  loadWeightData(auth.currentUser.uid, selectedPetId);
};

healthForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;

  await addDoc(collection(db, "health_logs"), {
    userId: user.uid,
    petId: selectedPetId,
    date: new Date(healthDate.value),
    symptom: healthSymptom.value,
    notes: healthNotes.value
  });

  healthForm.reset();
  loadHealthLogs(user.uid, selectedPetId);
});

async function loadHealthLogs(uid, petId) {
  const q = query(collection(db, "health_logs"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);
  healthList.innerHTML = "";

  const entries = [];
  snapshot.forEach(docSnap => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });

  entries.sort((a, b) => b.date.seconds - a.date.seconds);

  entries.forEach(entry => {
    const dateStr = new Date(entry.date.seconds * 1000).toLocaleString();
    healthList.innerHTML += `
      <li>
        <strong>${entry.symptom}</strong> <br/>
        <small>${dateStr}</small> <br/>
        ${entry.notes ? `<em>${entry.notes}</em>` : ""}
      </li>
    `;
  });
}
insuranceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;

  await setDoc(doc(db, "insurance", `${user.uid}_${selectedPetId}`), {
    userId: user.uid,
    petId: selectedPetId,
    provider: provider.value,
    policyNumber: policyNumber.value,
    emergencyContact: emergencyContact.value,
    document: insuranceDoc.value,
    notes: insuranceNotes.value,
    updatedAt: new Date()
  });

  insuranceForm.reset();
  loadInsurance(user.uid, selectedPetId);
});
async function loadInsurance(uid, petId) {
  const docRef = doc(db, "insurance", `${uid}_${petId}`);
  const docSnap = await getDoc(docRef);
  insuranceDisplay.innerHTML = "";

  if (docSnap.exists()) {
    const data = docSnap.data();
    insuranceDisplay.innerHTML = `
      <p><strong>Provider:</strong> ${data.provider}</p>
      <p><strong>Policy #:</strong> ${data.policyNumber}</p>
      <p><strong>Emergency Contact:</strong> ${data.emergencyContact}</p>
      ${data.document ? `<p><a href="${data.document}" target="_blank">View Document</a></p>` : ""}
      ${data.notes ? `<p><em>${data.notes}</em></p>` : ""}
      <button onclick="editInsurance()">✏️ Edit</button>
      <button onclick="deleteInsurance()">🗑️ Delete</button>
    `;
  } else {
    insuranceDisplay.innerHTML = `<p>No insurance info saved.</p>`;
  }
}

window.editInsurance = async () => {
  const docRef = doc(db, "insurance", `${auth.currentUser.uid}_${selectedPetId}`);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  provider.value = data.provider;
  policyNumber.value = data.policyNumber;
  emergencyContact.value = data.emergencyContact;
  insuranceDoc.value = data.document;
  insuranceNotes.value = data.notes;
};

window.deleteInsurance = async () => {
  await deleteDoc(doc(db, "insurance", `${auth.currentUser.uid}_${selectedPetId}`));
  insuranceDisplay.innerHTML = "<p>Insurance info deleted.</p>";
};


mealForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;

  await addDoc(collection(db, "meals"), {
    userId: user.uid,
    petId: selectedPetId,
    type: mealType.value,
    time: new Date(mealTime.value),
    notes: mealNotes.value
  });

  mealForm.reset();
  loadMeals(user.uid, selectedPetId);
});

async function loadMeals(uid, petId) {
  const q = query(collection(db, "meals"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);
  mealList.innerHTML = "";

  const entries = [];
  snapshot.forEach(docSnap => entries.push(docSnap.data()));
  entries.sort((a, b) => b.time.seconds - a.time.seconds);

  entries.forEach(entry => {
    const dateStr = new Date(entry.time.seconds * 1000).toLocaleString();
    mealList.innerHTML += `
      <li>
        <strong>${entry.type}</strong> – ${dateStr}<br/>
        ${entry.notes ? `<em>${entry.notes}</em>` : ""}
      </li>`;
  });
}
vaccineForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;

  if (vaccineForm.dataset.editingId) {
    // Edit mode
    const docRef = doc(db, "vaccinations", vaccineForm.dataset.editingId);
    await updateDoc(docRef, {
      name: vaccineName.value,
      date: new Date(vaccineDate.value),
      notes: vaccineNotes.value,
      reminder: vaccineReminder.value ? new Date(vaccineReminder.value) : null,
    });
    vaccineForm.removeAttribute("data-editing-id");
  } else {
    // Add new
    await addDoc(collection(db, "vaccinations"), {
      userId: user.uid,
      petId: selectedPetId,
      name: vaccineName.value,
      date: new Date(vaccineDate.value),
      notes: vaccineNotes.value,
      reminder: vaccineReminder.value ? new Date(vaccineReminder.value) : null,
      createdAt: new Date()
    });
  }

  vaccineForm.reset();
  loadVaccinations(user.uid, selectedPetId);
});

async function loadVaccinations(uid, petId) {
  const q = query(collection(db, "vaccinations"), where("userId", "==", uid), where("petId", "==", petId));
  const snapshot = await getDocs(q);
  vaccineList.innerHTML = "";

  const entries = [];
  snapshot.forEach(docSnap => {
    entries.push({ id: docSnap.id, ...docSnap.data() });
  });
  entries.sort((a, b) => b.date.seconds - a.date.seconds);

  entries.forEach(entry => {
    const dateStr = new Date(entry.date.seconds * 1000).toLocaleString();
    const reminderStr = entry.reminder ? `⏰ Reminder: ${new Date(entry.reminder.seconds * 1000).toLocaleString()}` : "";
    vaccineList.innerHTML += `
      <li>
        <strong>${entry.name}</strong> – ${dateStr}<br/>
        ${entry.notes ? `<em>${entry.notes}</em><br/>` : ""}
        ${reminderStr}<br/>
        <button onclick="editVaccine('${entry.id}')">✏️ Edit</button>
        <button onclick="deleteVaccine('${entry.id}')">🗑️ Delete</button>
      </li>
    `;
  });
}

window.editVaccine = async (id) => {
  const docRef = doc(db, "vaccinations", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    vaccineForm.dataset.editingId = id;
    vaccineName.value = data.name;
    vaccineDate.value = new Date(data.date.seconds * 1000).toISOString().slice(0, 16);
    vaccineNotes.value = data.notes || "";
    vaccineReminder.value = data.reminder ? new Date(data.reminder.seconds * 1000).toISOString().slice(0, 16) : "";
  }
};

window.deleteVaccine = async (id) => {
  if (confirm("Are you sure you want to delete this record?")) {
    await deleteDoc(doc(db, "vaccinations", id));
    loadVaccinations(auth.currentUser.uid, selectedPetId);
  }
};


function loadCareTips(pet) {
  const tipsContainer = document.getElementById("tipsContainer");
  if (!pet) {
    tipsContainer.innerHTML = "<p>No pet selected.</p>";
    return;
  }

  const breed = pet.breed.toLowerCase();
  const age = parseInt(pet.age);
  let tips = [];

  // Example tips based on breed and age
  if (breed.includes("retriever")) {
    tips.push("Retrievers need regular brushing to prevent matting.");
    tips.push("They are highly energetic — aim for 2 walks per day.");
  } else if (breed.includes("beagle")) {
    tips.push("Beagles love sniffing — try puzzle feeders or sniff walks.");
    tips.push("Watch out for ear infections. Clean ears weekly.");
  } else {
    tips.push("Make sure to provide 30–60 minutes of exercise daily.");
  }

  if (age < 2) {
    tips.push("Young dogs need puppy-safe food and early socialization.");
  } else if (age > 8) {
    tips.push("Senior dogs benefit from joint supplements and softer food.");
  }

  // Add seasonal care
  tips.push("🌞 Summer Tip: Avoid walks during midday heat.");
  tips.push("❄️ Winter Tip: Wipe paws after snowy walks to avoid salt burn.");

  tipsContainer.innerHTML = `
    <h3>Tips for ${pet.name} (${pet.breed}, age ${pet.age})</h3>
    <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
  `;
}



const homeLink = document.getElementById("homeLink");
if (homeLink) {
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    const petsTab = document.querySelector(".sidebar nav a[data-section='pets']");
    if (petsTab) petsTab.click();
  });
}



// 🛎️ Create a popup banner div for showing inside dashboard
// ✅ Create popup banner element in DOM
const popupBanner = document.createElement("div");
popupBanner.id = "popupBanner";
popupBanner.style.position = "fixed";
popupBanner.style.top = "20px";
popupBanner.style.right = "20px";
popupBanner.style.background = "#4caf50";
popupBanner.style.color = "white";
popupBanner.style.padding = "12px 20px";
popupBanner.style.borderRadius = "8px";
popupBanner.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.3)";
popupBanner.style.zIndex = 10000;
popupBanner.style.display = "none";
popupBanner.style.fontSize = "1rem";
document.body.appendChild(popupBanner);

// Function to show popup message inside the page
function showPopupBanner(message) {
  popupBanner.textContent = message;
  popupBanner.style.display = "block";
  setTimeout(() => {
    popupBanner.style.display = "none";
  }, 5000);
}

// ✅ Request Notification Permission
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// ✅ Start Checking Reminders Every Minute
setInterval(checkReminders, 60000);


function sendReminderNotification(title, datetime = "") {
  const message = `${title} at ${datetime}`;
  if (Notification.permission === "granted") {
    new Notification("🐾 PetCare Reminder", { body: message });
  }
  showPopupBanner(message);
}

async function checkReminders() {
  const user = auth.currentUser;
  if (!user || !selectedPetId) return;

  const snapshot = await getDocs(
    query(
      collection(db, "reminders"),
      where("userId", "==", user.uid),
      where("petId", "==", selectedPetId)
    )
  );

  const now = new Date();
  console.log("Checking reminders at:", now.toISOString());

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.date || !data.time) return;

    const reminderTime = new Date(`${data.date}T${data.time}`);
    const diff = reminderTime - now;

    const formattedDateTime = reminderTime.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    console.log(`Reminder "${data.title}" time: ${formattedDateTime} | Diff: ${diff}ms`);

    if (diff <= 0 && diff > -60000) {
      sendReminderNotification(`Reminder now: ${data.title}`, formattedDateTime);
    } else if (diff > 0 && diff <= 3600000) {
      sendReminderNotification(`Upcoming: ${data.title}`, formattedDateTime);
    }
  });
}
