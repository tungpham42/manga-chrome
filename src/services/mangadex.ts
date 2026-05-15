import axios from "axios";

const API_BASE = "https://api.mangadex.org";
const AUTH_URL =
  "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || "";
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET || "";

export const mangadexApi = axios.create({
  baseURL: API_BASE,
});

// Interceptor to attach token to requests
mangadexApi.interceptors.request.use((config) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["mdToken"], (result) => {
      if (result.mdToken) {
        config.headers.Authorization = `Bearer ${result.mdToken}`;
      }
      resolve(config);
    });
  });
});

export const authenticate = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);

  try {
    const response = await axios.post(AUTH_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = response.data;
    await chrome.storage.local.set({ mdToken: access_token });
    return access_token;
  } catch (error) {
    console.warn(
      "Client authentication failed. Falling back to public API access.",
      error,
    );
    return null;
  }
};

export const getLatestChapters = async () => {
  const response = await mangadexApi.get("/chapter", {
    params: {
      limit: 20,
      translatedLanguage: ["en"],
      includes: ["manga"],
      "order[readableAt]": "desc",
    },
  });
  return response.data.data;
};

export const searchManga = async (title: string) => {
  const response = await mangadexApi.get("/manga", {
    params: {
      title,
      limit: 20,
      "order[relevance]": "desc",
      includes: ["cover_art"],
    },
  });
  return response.data.data;
};

export const getMangaFeed = async (mangaId: string) => {
  const response = await mangadexApi.get(`/manga/${mangaId}/feed`, {
    params: {
      translatedLanguage: ["en"],
      "order[chapter]": "desc",
      limit: 100,
    },
  });
  return response.data.data;
};

// Fixed to ensure images are routed through standard ports
export const getChapterPages = async (chapterId: string) => {
  const response = await mangadexApi.get(`/at-home/server/${chapterId}`, {
    params: { forcePort443: true }, // Crucial fix for blocked image nodes
  });
  const { baseUrl, chapter } = response.data;
  return chapter.data.map(
    (filename: string) => `${baseUrl}/data/${chapter.hash}/${filename}`,
  );
};
