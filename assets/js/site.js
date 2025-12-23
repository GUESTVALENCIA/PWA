// Core navigation and listing rendering for the base template.
const accommodations = [
  {
    id: "mendez-nunez-47",
    title: "Méndez Núñez, 47 - Puerto",
    details: "4 hab - hasta 8 huéspedes",
    price: 125,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["4 habitaciones independientes", "Cocina compartida equipada", "Check-in autónomo"],
    amenities: ["WiFi 600Mb", "Aire acondicionado", "Lavadora"]
  },
  {
    id: "apartamento-betera",
    title: "Apartamento en Bétera",
    details: "3 hab - hasta 6 huéspedes",
    price: 95,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["3 habitaciones con armarios", "Cocina totalmente equipada", "Parking gratuito"],
    amenities: ["WiFi 600Mb", "Parking", "Terraza"]
  },
  {
    id: "villa-altea-hills",
    title: "Villa de Lujo en Altea Hills",
    details: "5 hab - hasta 10 huéspedes",
    price: 450,
    image: "https://images.unsplash.com/photo-1613553423758-d7335211d43a?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1613553423758-d7335211d43a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Piscina privada con vistas al mar", "5 dormitorios con baño", "Jardín y barbacoa"],
    amenities: ["Piscina privada", "Vistas al mar", "Barbacoa"]
  },
  {
    id: "duplex-montanejos",
    title: "Dúplex en Montanejos",
    details: "2 hab - hasta 5 huéspedes",
    price: 110,
    image: "https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1594563703937-fdc640497dcd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Entorno natural privilegiado", "Chimenea de leña", "Terraza con vistas"],
    amenities: ["Chimenea", "Terraza", "Naturaleza"]
  },
  {
    id: "atico-mar",
    title: "Ático con Vistas al Mar",
    details: "2 hab - hasta 4 huéspedes",
    price: 180,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Terraza privada con vistas", "Jacuzzi en terraza", "Ideal para parejas"],
    amenities: ["Terraza privada", "Jacuzzi", "Vistas al mar"]
  },
  {
    id: "loft-ruzafa",
    title: "Loft Moderno en Ruzafa",
    details: "1 hab - hasta 3 huéspedes",
    price: 130,
    image: "https://images.unsplash.com/photo-1617132024938-9365f8e5a4d0?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1617132024938-9365f8e5a4d0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560185010-281a89c9e8b1?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Diseño moderno y minimalista", "Corazón de Ruzafa", "Ideal para nómadas digitales"],
    amenities: ["Diseño moderno", "Ruzafa", "Espacio de trabajo"]
  },
  {
    id: "cabana-montana",
    title: "Cabaña en la Montaña",
    details: "1 hab - hasta 2 huéspedes",
    price: 90,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Aislamiento total en naturaleza", "Cabaña de madera rústica", "Perfecta para desconectar"],
    amenities: ["Rústico", "Tranquilidad", "Naturaleza"]
  },
  {
    id: "piso-carmen",
    title: "Piso Histórico en El Carmen",
    details: "3 hab - hasta 6 huéspedes",
    price: 150,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Edificio histórico siglo XVIII", "Techos con vigas de madera", "Corazón del Carmen"],
    amenities: ["Histórico", "Encanto", "Centro histórico"]
  },
  {
    id: "chalet-piscina",
    title: "Chalet con Piscina Privada",
    details: "4 hab - hasta 8 huéspedes",
    price: 280,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80"
    ],
    highlights: ["Piscina privada climatizada", "Amplio jardín con barbacoa", "Ideal para familias"],
    amenities: ["Piscina privada", "Jardín", "Barbacoa"]
  }
];

function createCard(listing) {
  return `<article class="property-card bg-white rounded-3xl shadow-sm border overflow-hidden">
    <a href="#${listing.id}" class="nav-link block">
      <img loading="lazy" src="${listing.image}" alt="${listing.title}" class="w-full h-56 object-cover">
      <div class="p-5">
        <h3 class="font-bold text-lg">${listing.title}</h3>
        <div class="flex justify-between items-center mt-2">
          <span class="text-sm text-slate-600">${listing.details}</span>
          <span class="font-bold text-lg text-blue-600">EUR ${listing.price}<span class="text-sm font-normal">/noche</span></span>
        </div>
      </div>
    </a>
  </article>`;
}

function createDetailPage(listing) {
  return `<section id="${listing.id}-page" class="page pt-20">
    <div class="max-w-7xl mx-auto px-6 py-10">
      <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div class="md:flex">
          <div class="md:w-2/3 p-6">
            <h1 class="text-2xl font-bold">${listing.title}</h1>
            <p class="text-slate-600 mt-1">${listing.details}</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
              ${listing.images.map((img, i) => `<img loading="lazy" src="${img}" alt="Vista ${i + 1}" class="w-full h-40 object-cover rounded-lg cursor-pointer gallery-image" data-listing-id="${listing.id}" data-index="${i}">`).join("")}
            </div>
            <div class="mt-6">
              <h2 class="font-bold mb-2">Aspectos destacados</h2>
              <ul class="text-slate-600 space-y-1">${listing.highlights.map(h => `<li>- ${h}</li>`).join("")}</ul>
            </div>
            <div class="mt-4">
              <h2 class="font-bold mb-2">Incluye</h2>
              <div class="flex flex-wrap gap-2">${listing.amenities.map(a => `<span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">${a}</span>`).join("")}</div>
            </div>
          </div>
          <div class="md:w-1/3 bg-slate-50 p-6 border-l">
            <h2 class="text-xl font-bold">Reserva</h2>
            <p class="text-slate-600 mt-1">EUR ${listing.price} por noche</p>
            <form class="mt-4 space-y-3">
              <input type="date" class="w-full rounded-lg border p-3">
              <input type="date" class="w-full rounded-lg border p-3">
              <select class="w-full rounded-lg border p-3">
                <option>1 huésped</option>
                <option selected>2 huéspedes</option>
                <option>3+ huéspedes</option>
              </select>
              <button type="button" class="w-full btn-primary py-3 rounded-lg font-bold booking-btn">Reservar ahora</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function navigate() {
  const hash = location.hash.slice(1) || "home";
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

  if (hash === "login" || hash === "register") {
    document.getElementById("auth-page").classList.add("active");
    document.getElementById("login-form").classList.toggle("hidden", hash !== "login");
    document.getElementById("register-form").classList.toggle("hidden", hash !== "register");
  } else {
    const page = document.getElementById(`${hash}-page`);
    if (page) page.classList.add("active");
    else document.getElementById("home-page").classList.add("active");
  }

  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const featuredGrid = document.getElementById("featured-grid");
  const listingsGrid = document.getElementById("listings-grid");
  const detailContainer = document.getElementById("accommodation-pages");
  const heroInput = document.getElementById("hero-media-input");
  const heroVideo = document.querySelector(".hero-video");
  const heroSection = document.querySelector(".hero-section");

  accommodations.forEach((listing, index) => {
    const card = createCard(listing);
    if (index < 6) featuredGrid.innerHTML += card;
    listingsGrid.innerHTML += card;
    detailContainer.innerHTML += createDetailPage(listing);
  });

  if (heroInput && heroVideo && heroSection) {
    heroInput.addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const source = heroVideo.querySelector("source");

      if (file.type.startsWith("video/")) {
        if (source) {
          source.src = url;
        } else {
          heroVideo.src = url;
        }
        heroVideo.style.display = "block";
        heroSection.style.backgroundImage = "";
        heroVideo.load();
        heroVideo.play().catch(() => {});
        return;
      }

      if (file.type.startsWith("image/")) {
        heroSection.style.backgroundImage = `url("${url}")`;
        heroVideo.pause();
        heroVideo.style.display = "none";
      }
    });
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      event.preventDefault();
      const target = new URL(link.href).hash;
      if (location.hash !== target) location.hash = target;
      else navigate();
    });
  });

  window.addEventListener("hashchange", navigate);
  navigate();

  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox.querySelector(".lightbox-image");
  const lbCounter = lightbox.querySelector(".lightbox-counter");
  let currentImages = [];
  let currentIdx = 0;

  document.body.addEventListener("click", event => {
    if (event.target.classList.contains("gallery-image")) {
      const listingId = event.target.dataset.listingId;
      const listing = accommodations.find(item => item.id === listingId);
      if (listing) {
        currentImages = listing.images;
        currentIdx = parseInt(event.target.dataset.index, 10);
        showImage();
        lightbox.classList.add("show");
      }
    }

    if (event.target.classList.contains("lightbox-close")) lightbox.classList.remove("show");
    if (event.target.classList.contains("lightbox-prev")) {
      currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
      showImage();
    }
    if (event.target.classList.contains("lightbox-next")) {
      currentIdx = (currentIdx + 1) % currentImages.length;
      showImage();
    }
    if (event.target.classList.contains("booking-btn")) {
      alert("Reserva confirmada. Recibirás un email con los detalles.");
    }
  });

  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("show")) return;
    if (event.key === "Escape") lightbox.classList.remove("show");
    if (event.key === "ArrowRight") {
      currentIdx = (currentIdx + 1) % currentImages.length;
      showImage();
    }
    if (event.key === "ArrowLeft") {
      currentIdx = (currentIdx - 1 + currentImages.length) % currentImages.length;
      showImage();
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  }

  function showImage() {
    lbImg.src = currentImages[currentIdx];
    lbCounter.textContent = `${currentIdx + 1} / ${currentImages.length}`;
  }
});
