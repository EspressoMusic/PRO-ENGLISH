const nav = document.querySelector(".nav");
const progressBar = document.querySelector(".scroll-progress");
const shapes = document.querySelectorAll(".shape");
const tiles = document.querySelectorAll(".tile");
const reveals = document.querySelectorAll(".reveal");
const themeToggle = document.getElementById("themeToggle");
const PREVIEW_WIDTH = 1280;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function setTheme(theme) {
  const isDark = theme === "dark";

  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  localStorage.setItem("picso-theme", isDark ? "dark" : "light");
}

function initThemeToggle() {
  themeToggle?.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
  });
}

initThemeToggle();

function splitHeroTitle() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = char;
      span.style.animationDelay = `${0.08 + i * 0.07}s`;
      el.appendChild(span);
    });
  });
}

function initHeroParallax() {
  const hero = document.getElementById("hero");
  if (!hero) return;

  const watermark = hero.querySelector(".hero-watermark");
  const ringWrap = hero.querySelector(".hero-ring-wrap");

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (watermark) {
      watermark.style.transform = `translateY(calc(-50% + ${y * 20}px)) translateX(${x * 24}px)`;
    }
    if (ringWrap) {
      ringWrap.style.transform = `translate(${x * 18}px, ${y * 18}px)`;
    }
  });

  hero.addEventListener("mouseleave", () => {
    if (watermark) watermark.style.transform = "";
    if (ringWrap) ringWrap.style.transform = "";
  });
}

splitHeroTitle();
initHeroParallax();

function scalePreviews() {
  document.querySelectorAll(".tile-preview").forEach((preview) => {
    const iframe = preview.querySelector("iframe");
    if (!iframe) return;

    const scale = preview.clientWidth / PREVIEW_WIDTH;
    iframe.style.transform = `scale(${scale})`;
    iframe.style.height = `${preview.clientHeight / scale}px`;
  });
}

function onScroll() {
  const scrollY = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;
  nav.classList.toggle("visible", scrollY > 80);
  nav.classList.toggle("scrolled", scrollY > 80);

  shapes.forEach((shape, i) => {
    const speed = (i + 1) * 0.04;
    shape.style.transform = `translateY(${scrollY * speed}px) rotate(${scrollY * 0.02 * (i + 1)}deg)`;
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const delay = el.dataset.index ? parseInt(el.dataset.index, 10) * 60 : 0;

      setTimeout(() => el.classList.add("visible"), delay);
      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

reveals.forEach((el) => revealObserver.observe(el));

const iframeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const iframe = entry.target;
      const preview = iframe.closest(".tile-preview");
      if (!iframe.src && iframe.dataset.src) {
        iframe.src = iframe.dataset.src;
        iframe.addEventListener("load", () => {
          preview?.classList.add("loaded");
          scalePreviews();
        });
      }
      iframeObserver.unobserve(iframe);
    });
  },
  { rootMargin: "120px" }
);

document.querySelectorAll(".tile-preview iframe").forEach((iframe) => {
  iframeObserver.observe(iframe);
});

tiles.forEach((tile) => {
  tile.addEventListener("mousemove", (e) => {
    const rect = tile.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    tile.style.setProperty("--mouse-x", `${x}%`);
    tile.style.setProperty("--mouse-y", `${y}%`);

    const tiltX = clamp((e.clientY - rect.top - rect.height / 2) / 24, -6, 6);
    const tiltY = clamp((e.clientX - rect.left - rect.width / 2) / -24, -6, 6);
    tile.style.transform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
  });

  tile.addEventListener("mouseleave", () => {
    tile.style.transform = "";
  });
});

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", scalePreviews);
window.addEventListener("load", () => {
  onScroll();
  scalePreviews();
});

document.body.animate(
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 500, easing: "ease-out", fill: "forwards" }
);
