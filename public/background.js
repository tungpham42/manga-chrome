// Check for updates every 30 minutes
chrome.alarms.create("mangaUpdateCheck", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "mangaUpdateCheck") {
    checkForNewChapters();
  }
});

async function checkForNewChapters() {
  chrome.storage.local.get(["mdToken", "lastCheck"], async (result) => {
    try {
      // Fetch global latest chapters (English)
      // Note: We inject the token if it exists, but this endpoint is public
      const headers = result.mdToken
        ? { Authorization: `Bearer ${result.mdToken}` }
        : {};

      const response = await fetch(
        "https://api.mangadex.org/chapter?limit=5&translatedLanguage[]=en&order[readableAt]=desc",
        { headers },
      );

      const data = await response.json();
      const latestChapters = data.data;

      if (latestChapters && latestChapters.length > 0) {
        const latestChapterId = latestChapters[0].id;

        // Compare against last check to prevent duplicate push notifications
        if (result.lastCheck !== latestChapterId) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "logo192.png", // Ensure this file exists in your public folder
            title: "New Manga Chapters Available!",
            message: `New chapters have just been released on MangaDex.`,
          });

          // Update last check to the most recent chapter ID
          chrome.storage.local.set({ lastCheck: latestChapterId });
        }
      }
    } catch (error) {
      console.error("Error fetching updates in background:", error);
    }
  });
}
