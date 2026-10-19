const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js-ready");

// The portrait selector only previews the image in this browser. It never uploads it.
const photoTrigger = document.querySelector("#photo-trigger");
const photoInput = document.querySelector("#photo-input");
const portraitImage = document.querySelector("#portrait-image");
const photoPlaceholder = document.querySelector("#photo-placeholder");
const photoWindow = document.querySelector("#photo-window");
const PHOTO_KEY = "ego-personal-site-photo-v1";

function showPortrait(dataUrl) {
  portraitImage.src = dataUrl;
  portraitImage.hidden = false;
  photoPlaceholder.hidden = true;
}

try {
  const savedPortrait = localStorage.getItem(PHOTO_KEY);
  if (savedPortrait) showPortrait(savedPortrait);
} catch {
  // Private browsing settings may disable local storage; the current-session preview still works.
}

photoTrigger?.addEventListener("click", () => photoInput?.click());
photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  if (file.size > 1_500_000) {
    announce("Please choose a photo under 1.5 MB.");
    photoInput.value = "";
    return;
  }
  const dataUrl = await readAsDataUrl(file);
  showPortrait(dataUrl);
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { /* Keep the preview for this visit. */ }
  photoTrigger?.classList.add("photo-changed");
  window.setTimeout(() => photoTrigger?.classList.remove("photo-changed"), 700);
});

photoWindow?.addEventListener("dragover", (event) => {
  event.preventDefault();
  photoWindow.classList.add("is-drop-target");
});
photoWindow?.addEventListener("dragleave", () => photoWindow.classList.remove("is-drop-target"));
photoWindow?.addEventListener("drop", async (event) => {
  event.preventDefault();
  photoWindow.classList.remove("is-drop-target");
  const file = event.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  if (file.size > 1_500_000) return announce("Please choose a photo under 1.5 MB.");
  const dataUrl = await readAsDataUrl(file);
  showPortrait(dataUrl);
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { /* Keep the preview for this visit. */ }
});

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }
}, { threshold: 0.14, rootMargin: "0px 0px -28px 0px" });

document.querySelectorAll(".reveal").forEach((element) => {
  element.style.setProperty("--delay", `${Number(element.dataset.delay || 0)}ms`);
  revealObserver.observe(element);
});

const pathObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }
}, { threshold: 0.28 });
document.querySelectorAll(".dream-path").forEach((element) => pathObserver.observe(element));

const progressBar = document.querySelector("#scroll-progress-bar");
let scrollTicking = false;
function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  document.querySelectorAll("[data-parallax]").forEach((element) => {
    const speed = Number(element.dataset.parallax || 0);
    const offset = (window.scrollY - element.getBoundingClientRect().top - window.scrollY) * speed;
    element.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
  });
  scrollTicking = false;
}
window.addEventListener("scroll", () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollProgress);
}, { passive: true });
updateScrollProgress();

const navLinks = [...document.querySelectorAll(".nav-link")];
const navSections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
}, { rootMargin: "-22% 0px -55% 0px", threshold: [0, .15, .35, .6] });
navSections.forEach((section) => sectionObserver.observe(section));

const menuButton = document.querySelector("#nav-toggle");
const mainNav = document.querySelector("#main-nav");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mainNav?.classList.toggle("is-open", open);
});
navLinks.forEach((link) => link.addEventListener("click", () => {
  mainNav?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "Open menu");
}));

if (!motionReduced && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      const strength = card.dataset.tilt === "small" ? 4 : 7;
      card.style.setProperty("--tilt-x", `${(-y * strength).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * strength).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

document.querySelectorAll(".doodle-sticker, .interest-card").forEach((element) => {
  element.addEventListener("click", (event) => makeSparkles(event.clientX, event.clientY));
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      const rect = element.getBoundingClientRect();
      makeSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  });
});

function makeSparkles(x, y) {
  const layer = document.querySelector("#sparkle-layer");
  if (!layer) return;
  for (let index = 0; index < 6; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle-pop";
    sparkle.textContent = index % 2 ? "✦" : "♡";
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.setProperty("--dx", `${Math.cos(index * Math.PI / 3) * 42}px`);
    sparkle.style.setProperty("--dy", `${Math.sin(index * Math.PI / 3) * 42}px`);
    layer.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 900);
  }
}

const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");
const contactSubmit = contactForm?.querySelector('button[type="submit"]');

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const formData = new FormData(contactForm);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website"),
  };
  if (contactSubmit) contactSubmit.disabled = true;
  if (contactStatus) {
    contactStatus.classList.remove("is-error");
    contactStatus.textContent = "Sending your note…";
  }
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "I couldn’t send that just now. Please try again.");
    contactForm.reset();
    if (contactStatus) contactStatus.textContent = result.message || "Thank you — your note is on its way.";
  } catch (error) {
    if (contactStatus) {
      contactStatus.classList.add("is-error");
      contactStatus.textContent = error.message || "I couldn’t send that just now. Please try again.";
    }
  } finally {
    if (contactSubmit) contactSubmit.disabled = false;
  }
});

document.querySelector("#year").textContent = String(new Date().getFullYear());

let announcementTimer;
function announce(message) {
  const status = document.querySelector("#photo-status");
  if (status) status.textContent = message;
  window.clearTimeout(announcementTimer);
  announcementTimer = window.setTimeout(() => {
    if (status) status.textContent = "Your photo stays in this browser.";
  }, 2600);
}
