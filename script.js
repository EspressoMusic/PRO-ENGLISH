const nav = document.querySelector(".nav");
const progressBar = document.querySelector(".scroll-progress");
const tiles = document.querySelectorAll(".tile");
const reveals = document.querySelectorAll(".reveal");
const themeToggle = document.getElementById("themeToggle");
const PREVIEW_WIDTH = 1280;
const MAX_IFRAME_LOADS = 2;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
let iframeQueue = [];
let activeIframeLoads = 0;
let resizeRaf = 0;

function setTheme(theme) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("picso-theme", isDark ? "dark" : "light");
}

themeToggle?.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
});

function splitHeroTitle() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = char;
      span.style.animationDelay = `${0.08 + i * 0.05}s`;
      el.appendChild(span);
    });
  });
}

splitHeroTitle();

function scalePreview(preview) {
  const iframe = preview?.querySelector("iframe");
  if (!iframe || !iframe.src) return;

  const scale = preview.clientWidth / PREVIEW_WIDTH;
  iframe.style.transform = `scale(${scale})`;
  iframe.style.height = `${preview.clientHeight / scale}px`;
}

function scaleVisiblePreviews() {
  document.querySelectorAll(".tile-preview.loaded").forEach(scalePreview);
}

function scheduleScale() {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(scaleVisiblePreviews);
}

function processIframeQueue() {
  while (activeIframeLoads < MAX_IFRAME_LOADS && iframeQueue.length) {
    const iframe = iframeQueue.shift();
    if (!iframe?.isConnected || iframe.src || !iframe.dataset.src) continue;

    activeIframeLoads++;
    const preview = iframe.closest(".tile-preview");

    const onDone = () => {
      activeIframeLoads--;
      processIframeQueue();
    };

    iframe.addEventListener(
      "load",
      () => {
        preview?.classList.add("loaded");
        scalePreview(preview);
        onDone();
      },
      { once: true }
    );

    iframe.addEventListener("error", onDone, { once: true });
    iframe.src = iframe.dataset.src;
  }
}

function requestIframeLoad(iframe) {
  if (iframe.src || iframeQueue.includes(iframe)) return;
  iframeQueue.push(iframe);
  processIframeQueue();
}

function releaseIframe(iframe) {
  const preview = iframe.closest(".tile-preview");
  iframe.removeAttribute("src");
  preview?.classList.remove("loaded");
  iframeQueue = iframeQueue.filter((item) => item !== iframe);
}

function onScroll() {
  const scrollY = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;
  nav.classList.toggle("visible", scrollY > 80);
  nav.classList.toggle("scrolled", scrollY > 80);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.dataset.index ? Math.min(parseInt(el.dataset.index, 10) * 40, 200) : 0;
      setTimeout(() => el.classList.add("visible"), delay);
      revealObserver.unobserve(el);
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
);

reveals.forEach((el) => revealObserver.observe(el));

const iframeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target;
      const rect = entry.boundingClientRect;
      const viewport = window.innerHeight;

      if (entry.isIntersecting) {
        requestIframeLoad(iframe);
        return;
      }

      const farAbove = rect.bottom < -viewport * 0.5;
      const farBelow = rect.top > viewport * 1.5;
      if ((farAbove || farBelow) && iframe.src) {
        releaseIframe(iframe);
      }
    });
  },
  { rootMargin: "100px 0px", threshold: 0.01 }
);

document.querySelectorAll(".tile-preview iframe").forEach((iframe) => {
  iframeObserver.observe(iframe);
});

tiles.forEach((tile) => {
  tile.addEventListener(
    "mousemove",
    (e) => {
      const rect = tile.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      tile.style.setProperty("--mouse-x", `${x}%`);
      tile.style.setProperty("--mouse-y", `${y}%`);

      const tiltX = clamp((e.clientY - rect.top - rect.height / 2) / 28, -4, 4);
      const tiltY = clamp((e.clientX - rect.left - rect.width / 2) / -28, -4, 4);
      tile.style.transform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
    },
    { passive: true }
  );

  tile.addEventListener("mouseleave", () => {
    tile.style.transform = "";
  });
});

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", scheduleScale, { passive: true });
window.addEventListener("load", () => {
  onScroll();
  scheduleScale();
});
