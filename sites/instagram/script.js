// Redirect homepage to following feed
if (location.pathname === "/" && !location.search.includes("variant=following")) {
  location.replace("/?variant=following");
}

// Hide "Suggested for you" sections
function hideSuggested() {
  document.querySelectorAll("span, h2, h3, div").forEach((el) => {
    if (el.textContent.trim() === "Suggested for you") {
      const section = el.closest("article")?.nextElementSibling || el.closest("div[style]");
      if (section) section.style.display = "none";
      el.closest("div")?.parentElement?.style.setProperty("display", "none");
    }
  });
}

const observer = new MutationObserver(hideSuggested);
observer.observe(document.body, { childList: true, subtree: true });
hideSuggested();
