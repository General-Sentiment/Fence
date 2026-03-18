// Redirect homepage to subscriptions feed
if (location.pathname === "/" || location.pathname === "") {
  location.replace("/feed/subscriptions");
}

// Redirect any /shorts/ URL to the normal video player
if (location.pathname.startsWith("/shorts/")) {
  const videoId = location.pathname.split("/shorts/")[1].split(/[?#]/)[0];
  location.replace(`/watch?v=${videoId}`);
}

