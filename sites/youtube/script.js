// Redirect homepage to subscriptions and shorts to normal player.
// YouTube is a SPA, so we watch for client-side navigations too.
function checkRedirects() {
  if (location.pathname === "/" || location.pathname === "") {
    location.replace("/feed/subscriptions");
  } else if (location.pathname.startsWith("/shorts/")) {
    const videoId = location.pathname.split("/shorts/")[1].split(/[?#]/)[0];
    location.replace(`/watch?v=${videoId}`);
  }
}

checkRedirects();

// YouTube fires yt-navigate-finish on SPA navigations
document.addEventListener("yt-navigate-finish", checkRedirects);

