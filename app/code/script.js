// Default sounds array
const defaultSounds = [
    { id: "def-1", name: "Vine Boom", file: "sounds/vine-boom.mp3", category: "memes", color: "red" },
    { id: "def-2", name: "Bruh", file: "sounds/bruh.mp3", category: "memes", color: "blue" },
    { id: "def-3", name: "Level Up", file: "sounds/level-up.mp3", category: "games", color: "green" },
    { id: "def-4", name: "Error Sound", file: "sounds/error.mp3", category: "effects", color: "yellow" },
    { id: "def-5", name: "Airhorn", file: "sounds/airhorn.mp3", category: "memes", color: "purple" }
];

let customSounds = JSON.parse(localStorage.getItem("selectsound_custom_sounds")) || [];
let activeAudios = [];
let currentCategory = "all";

// DOM Elements
const soundGrid = document.getElementById("soundGrid");
const searchInput = document.getElementById("searchInput");
const catButtons = document.querySelectorAll(".cat-btn");
const stopAllBtn = document.getElementById("stopAllBtn");
const toggleUploadBtn = document.getElementById("toggleUploadBtn");
const uploadPanel = document.getElementById("uploadPanel");
const uploadForm = document.getElementById("uploadForm");

// Merge default and custom sounds
function getAllSounds() {
    return [...defaultSounds, ...customSounds];
}

// Render dynamic sound buttons
function renderSounds(filteredSounds) {
    soundGrid.innerHTML = "";

    if (filteredSounds.length === 0) {
        soundGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No sounds found.</p>`;
        return;
    }

    filteredSounds.forEach(sound => {
        const card = document.createElement("div");
        card.className = "sound-card";

        // Add delete button if custom sound
        if (sound.isCustom) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerHTML = "&times;";
            deleteBtn.title = "Delete sound";
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteCustomSound(sound.id);
            });
            card.appendChild(deleteBtn);
        }

        const button = document.createElement("button");
        button.className = `instant-btn ${sound.color}`;
        button.setAttribute("aria-label", `Play ${sound.name}`);

        const title = document.createElement("span");
        title.className = "sound-title";
        title.textContent = sound.name;

        button.addEventListener("click", () => playSound(sound.file, button));

        card.appendChild(button);
        card.appendChild(title);
        soundGrid.appendChild(card);
    });
}

// Play audio handler
function playSound(audioSrc, buttonEl) {
    const audio = new Audio(audioSrc);
    
    buttonEl.classList.add("playing");
    activeAudios.push(audio);

    audio.play().catch(err => {
        console.warn(`Could not play sound. Make sure file exists or data URL is valid.`, err);
    });

    audio.onended = () => {
        buttonEl.classList.remove("playing");
        activeAudios = activeAudios.filter(a => a !== audio);
    };
}

// Delete custom sound
function deleteCustomSound(id) {
    customSounds = customSounds.filter(s => s.id !== id);
    localStorage.setItem("selectsound_custom_sounds", JSON.stringify(customSounds));
    filterSounds();
}

// Convert uploaded file to Base64 String
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Form Upload Handler
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("soundName").value.trim();
    const category = document.getElementById("soundCategory").value;
    const color = document.getElementById("soundColor").value;
    const fileInput = document.getElementById("audioFile");
    const file = fileInput.files[0];

    if (!file) return;

    try {
        const base64Audio = await fileToBase64(file);

        const newSound = {
            id: "custom-" + Date.now(),
            name,
            category,
            color,
            file: base64Audio,
            isCustom: true
        };

        customSounds.push(newSound);
        localStorage.setItem("selectsound_custom_sounds", JSON.stringify(customSounds));

        uploadForm.reset();
        uploadPanel.classList.add("hidden");
        filterSounds();
    } catch (err) {
        alert("Failed to process audio file or browser LocalStorage limit was reached (~5MB). Try a smaller audio clip.");
        console.error(err);
    }
});

// Toggle Upload Panel
toggleUploadBtn.addEventListener("click", () => {
    uploadPanel.classList.toggle("hidden");
});

// Stop all playing audio
stopAllBtn.addEventListener("click", () => {
    activeAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    activeAudios = [];
    document.querySelectorAll(".instant-btn").forEach(btn => btn.classList.remove("playing"));
});

// Filter by search & category
function filterSounds() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const allSounds = getAllSounds();

    const filtered = allSounds.filter(sound => {
        const matchesSearch = sound.name.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === "all" || sound.category === currentCategory;
        return matchesSearch && matchesCategory;
    });

    renderSounds(filtered);
}

// Event listeners
searchInput.addEventListener("input", filterSounds);

catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        catButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        filterSounds();
    });
});

// Initial load
filterSounds();
