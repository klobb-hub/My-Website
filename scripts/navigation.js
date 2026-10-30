const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector(".main-navigation");

if (menuToggle && mainNavigation) {
  // Open and close the menu
  menuToggle.addEventListener("click", () => {
    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu"
    );

    mainNavigation.classList.toggle("is-open", !isOpen);
  });

  // Close the menu after selecting a link
  mainNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNavigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute(
        "aria-label",
        "Open navigation menu"
      );
    });
  });

  // Reset the menu when resizing back to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      mainNavigation.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute(
        "aria-label",
        "Open navigation menu"
      );
    }
  });
}
