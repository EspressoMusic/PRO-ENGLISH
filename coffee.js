const hero = document.getElementById("hero");
const card = document.querySelector(".product-card");
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function parallax(e) {
  const { clientX, clientY } = e;
  const { innerWidth, innerHeight } = window;
  const x = (clientX / innerWidth - 0.5) * 2;
  const y = (clientY / innerHeight - 0.5) * 2;

  if (card) {
    card.style.transform = `translateY(-4px) rotateY(${x * 8}deg) rotateX(${y * -6}deg)`;
  }

  if (leftPanel) {
    leftPanel.style.backgroundPosition = `${50 + x * 2}% ${50 + y * 2}%`;
  }

  if (rightPanel) {
    rightPanel.style.backgroundPosition = `${50 - x * 6}% ${50 - y * 6}%`;
  }
}

function cleanupParallax() {
  if (card) {
    card.style.transform = "";
  }
  if (rightPanel) {
    rightPanel.style.backgroundPosition = "";
  }
}

hero?.addEventListener("mousemove", parallax);
hero?.addEventListener("mouseleave", cleanupParallax);

// Reveal animation on load.
window.addEventListener("load", () => {
  document.body.animate(
    [
      { opacity: 0, transform: "scale(1.01)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
});
