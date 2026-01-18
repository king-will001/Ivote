// utils/apiSimulator.js
// This file simulates API calls for client-side development without a real backend.
// News endpoints call the real API so posts persist.

// Import images so the bundler can process them
import argentinaFlag from '../assets/argentina-flag.jpg';
import cameroonFlag from '../assets/cameroon-flag.png';
import shutterstockFlag from '../assets/shutterstock-flag.webp';
import innocent from '../assets/innocent.jpg';
import candidate1 from '../assets/candidate1.webp';
import candidate2 from '../assets/candidate2.jpg';
import candidate3 from '../assets/candidate3.jpg';
import candidate4 from '../assets/candidate4.jpg';
import candidate5 from '../assets/candidate5.jpg';
import candidate6 from '../assets/candidate6.jpg';
import candidate7 from '../assets/candidate7.jpg';

const parsedDelay = Number(process.env.REACT_APP_SIMULATED_DELAY_MS);
const SIMULATED_DELAY_MS = Number.isFinite(parsedDelay) ? parsedDelay : 0;
const simulateDelay = (ms = SIMULATED_DELAY_MS) => (
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve()
);
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const NEWS_CATEGORIES = ["Tech", "Health", "Education"];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    return stored?.token || null;
  } catch (error) {
    return null;
  }
};

const normalizeNewsCategory = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = NEWS_CATEGORIES.find(
    (category) => category.toLowerCase() === trimmed.toLowerCase()
  );
  return match || trimmed;
};

const normalizeSearchValue = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : "";
};

const buildNewsSearchText = (post) => (
  [
    post?.title,
    post?.content,
    post?.author,
    post?.category,
    post?.description,
    post?.summary,
    post?.body,
    post?.sourceUrl,
    post?.mediaUrl,
  ]
    .map(normalizeSearchValue)
    .filter(Boolean)
    .join(" ")
);

const normalizeNewsItem = (post) => {
  if (!post) return post;
  return {
    ...post,
    id: post.id || post._id || post.sourceUrl || post.url || post.title,
    date: post.date || post.createdAt,
    category: normalizeNewsCategory(post.category),
    searchText: buildNewsSearchText(post),
  };
};

const normalizeElectionTimes = (election) => {
  if (!election) return election;
  const startTime = election.startTime ?? election.startDate ?? null;
  const endTime = election.endTime ?? election.endDate ?? null;
  const date = election.date ?? (startTime ? String(startTime).split('T')[0] : null);
  return { ...election, startTime, endTime, date };
};

const defaultThumbnail = shutterstockFlag;
const apiUploadsPrefix = `${API_BASE_URL}/uploads/`;

const normalizeThumbnail = (value, fallbackThumbnail) => {
  if (typeof value !== "string" || !value.trim()) {
    return fallbackThumbnail || null;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("http")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  if (trimmed.startsWith(apiUploadsPrefix)) {
    return trimmed;
  }
  return trimmed;
};

const normalizeElection = (election, fallbackThumbnail = defaultThumbnail) => {
  if (!election) return election;
  const normalized = normalizeElectionTimes(election);
  return {
    ...normalized,
    id: normalized.id || normalized._id,
    thumbnail: normalizeThumbnail(normalized.thumbnail, fallbackThumbnail),
  };
};

const normalizeCandidate = (candidate) => {
  if (!candidate) return candidate;
  const fullName =
    candidate.fullName ||
    [candidate.firstName, candidate.lastName].filter(Boolean).join(" ").trim();
  const normalizedImage = normalizeThumbnail(candidate.image, candidate.image || null);
  return {
    ...candidate,
    id: candidate.id || candidate._id,
    fullName,
    voteCount: candidate.voteCount ?? candidate.votesCount ?? 0,
    image: normalizedImage,
  };
};

const buildElectionPayload = (election) => {
  if (!election || typeof election !== "object") return {};
  const { thumbnail, id, _id, candidates, voters, ...payload } = election;
  if (typeof thumbnail === "string" && thumbnail.trim()) {
    payload.thumbnail = thumbnail.trim();
  }
  return payload;
};

const isMongoId = (value) => (
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value)
);

let electionsData = [
  {
    id: "e1",
    title: "Argentina Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: argentinaFlag,
    candidates: ["c1", "c2", "c8"],
    voters: [],
    startTime: "2025-01-01T08:00",
    endTime: "2025-01-31T18:00",
    date: "2025-01-01",
  },
  {
    id: "e2",
    title: "Cameroon Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: cameroonFlag,
    candidates: ["c5", "c6", "c7"],
    voters: [],
    startTime: "2025-02-15T09:00",
    endTime: "2025-03-15T17:00",
    date: "2025-02-15",
  },
  {
    id: "e3",
    title: "Honduras Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: shutterstockFlag,
    candidates: ["c3", "c4"],
    voters: [],
    startTime: "2025-04-01T10:00",
    endTime: "2025-04-30T16:00",
    date: "2025-04-01",
  },
];

let candidatesData = [
  {
    id: "c1",
    fullName: "Ngwa Innocent",
    image: innocent,
    motto: "Unity and Progress for All",
    voteCount: 230,
    election: "e1",
  },
  {
    id: "c2",
    fullName: "Nshom Ciara",
    image: candidate2,
    motto: "A Voice for the People",
    voteCount: 130,
    election: "e1",
  },
  {
    id: "c3",
    fullName: "Boseh Iwill",
    image: candidate3,
    motto: "Transparency and Growth",
    voteCount: 4030,
    election: "e3",
  },
  {
    id: "c4",
    fullName: "Ngwa Nelson",
    image: candidate4,
    motto: "A Better Tomorrow",
    voteCount: 430,
    election: "e3",
  },
  {
    id: "c5",
    fullName: "Berrynun Kum",
    image: candidate5,
    motto: "Power to the Youth",
    voteCount: 260,
    election: "e2",
  },
  {
    id: "c6",
    fullName: "Kudi Prisca",
    image: candidate6,
    motto: "Together We Can",
    voteCount: 330,
    election: "e2",
  },
  {
    id: "c7",
    fullName: "Cho Stephane Cho",
    image: candidate7,
    motto: "Fairness. Equality. Future.",
    voteCount: 130,
    election: "e2",
  },
  {
    id: "c8",
    fullName: "Mbang Mac-joel",
    image: candidate1,
    motto: "Unity in Diversity",
    voteCount: 10,
    election: "e1",
  },
];

let votersData = [
  {
    id: "v1",
    fullName: "Ernest Achiever",
    email: "achiever@gmail.com",
    password: "1234e",
    isAdmin: false,
    votedElections: ["e2"],
  },
  {
    id: "v2",
    fullName: "Ndanm Boseh Prince-will",
    email: "nbanmbosehprincewill@gmail.com",
    password: "1234e",
    isAdmin: true,
    votedElections: ["e1", "e2"],
  },
  {
    id: "v3",
    fullName: "Innocent Ibo",
    email: "innocent@gmail.com",
    password: "1234e",
    isAdmin: false,
    votedElections: ["e1", "e2"],
  },
  {
    id: "v4",
    fullName: "Mokon Lucas",
    email: "lucas@gmail.com",
    password: "1234e",
    isAdmin: false,
    votedElections: ["e2"],
  },
  {
    id: "v5",
    fullName: "Chochu Renie",
    email: "chochu@gmail.com",
    password: "1234e",
    isAdmin: false,
    votedElections: ["e3", "e1"],
  },
];

export const fetchNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to load news feed" };
    }

    const items = Array.isArray(payload.news) ? payload.news.map(normalizeNewsItem) : [];
    return { success: true, data: items };
  } catch (error) {
    return { success: false, message: error.message || "Failed to load news feed" };
  }
};

export const createNews = async (newPost) => {
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(newPost),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to create news post" };
    }

    return { success: true, data: normalizeNewsItem(payload.post) };
  } catch (error) {
    return { success: false, message: error.message || "Failed to create news post" };
  }
};

export const fetchNewsById = async (postId) => {
  if (!postId) {
    return { success: false, message: "News post ID is required." };
  }
  const response = await fetchNews();
  if (!response.success) {
    return response;
  }
  const match = response.data.find((post) => String(post.id) === String(postId));
  if (!match) {
    return { success: false, message: "News post not found." };
  }
  return { success: true, data: match };
};

export const deleteNews = async (postId) => {
  if (!postId) {
    return { success: false, message: "News post ID is required." };
  }
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/news/${postId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to delete news post" };
    }

    return { success: true, data: payload };
  } catch (error) {
    return { success: false, message: error.message || "Failed to delete news post" };
  }
};

// ==============================
// Existing API logic remains below
// ==============================

export const fetchElections = async () => {
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/elections`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to fetch elections" };
    }

    const items = Array.isArray(payload.elections) ? payload.elections : [];
    return { success: true, data: items.map((election) => normalizeElection(election)) };
  } catch (error) {
    console.error("Error fetching elections:", error);
    return { success: false, message: "Failed to fetch elections. Make sure the backend server is running." };
  }
};

export const fetchElectionById = async (id) => {
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/elections/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Election not found" };
    }

    const election = payload.election;
    const normalizedElection = normalizeElection(election);
    const electionCandidates = Array.isArray(election?.candidates)
      ? election.candidates.map(normalizeCandidate)
      : [];
    return {
      success: true,
      data: {
        ...normalizedElection,
        candidates: electionCandidates,
      },
    };
  } catch (error) {
    console.error("Error fetching election:", error);
    return { success: false, message: "Failed to fetch election. Make sure the backend server is running." };
  }
};

export const createElection = async (newElection) => {
  try {
    const token = getStoredToken();
    const payload = buildElectionPayload(newElection);
    const response = await fetch(`${API_BASE_URL}/api/elections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: result.message || "Failed to create election" };
    }

    const normalizedElection = normalizeElection(result.election, newElection?.thumbnail);
    const electionWithId = {
      ...normalizedElection,
      candidates: normalizedElection?.candidates || [],
      voters: normalizedElection?.voters || [],
    };
    electionsData.push(electionWithId);
    return { success: true, data: electionWithId };
  } catch (error) {
    return { success: false, message: error.message || "Failed to create election" };
  }
};

export const updateElection = async (updatedElection) => {
  const normalizedUpdate = normalizeElectionTimes(updatedElection);
  const electionId = String(normalizedUpdate?.id || "");

  if (isMongoId(electionId)) {
    try {
      const token = getStoredToken();
      const payload = buildElectionPayload(normalizedUpdate);
      const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, message: result.message || "Failed to update election" };
      }

      const normalizedElection = normalizeElection(result.election, updatedElection?.thumbnail);
      const index = electionsData.findIndex(e => String(e.id) === String(normalizedElection?.id));
      if (index !== -1) {
        electionsData[index] = normalizeElectionTimes({
          ...electionsData[index],
          ...normalizedElection,
        });
      }
      return { success: true, data: normalizedElection };
    } catch (error) {
      return { success: false, message: error.message || "Failed to update election" };
    }
  }

  await simulateDelay();
  const index = electionsData.findIndex(e => e.id === normalizedUpdate.id);
  if (index !== -1) {
    electionsData[index] = normalizeElectionTimes({
      ...electionsData[index],
      ...normalizedUpdate,
    });
    return { success: true, data: electionsData[index] };
  }
  return { success: false, message: "Election not found" };
};

export const deleteElection = async (id) => {
  await simulateDelay();
  const initialLength = electionsData.length;
  electionsData = electionsData.filter(e => e.id !== id);
  if (electionsData.length < initialLength) {
    candidatesData = candidatesData.filter(c => c.election !== id);
    return { success: true, message: "Election deleted successfully" };
  }
  return { success: false, message: "Election not found" };
};

export const fetchCandidates = async (electionId = null) => {
  if (electionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}/candidates`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, message: payload.message || "Failed to fetch candidates" };
      }

      const items = Array.isArray(payload.candidates) ? payload.candidates : [];
      return { success: true, data: items.map(normalizeCandidate) };
    } catch (error) {
      console.error("Error fetching candidates:", error);
      return { success: false, message: "Failed to fetch candidates. Make sure the backend server is running." };
    }
  }
  return { success: false, message: "Election ID is required" };
};

export const fetchVoters = async (electionId) => {
  if (!electionId) {
    return { success: false, message: "Election ID is required." };
  }
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}/voters`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to fetch voters" };
    }

    const items = Array.isArray(payload.voters) ? payload.voters : [];
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching voters:", error);
    return { success: false, message: "Failed to fetch voters. Make sure the backend server is running." };
  }
};

export const createCandidate = async (newCandidate) => {
  const electionId = String(newCandidate?.election || "");
  if (isMongoId(electionId)) {
    try {
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...newCandidate, election: electionId }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, message: result.message || "Failed to add candidate" };
      }

      const normalizedCandidate = normalizeCandidate(result.candidate || result.data || result);
      if (normalizedCandidate) {
        const exists = candidatesData.find(c => String(c.id) === String(normalizedCandidate.id));
        if (!exists) {
          candidatesData.push(normalizedCandidate);
        }
        const electionIndex = electionsData.findIndex(e => String(e.id) === String(electionId));
        if (electionIndex !== -1) {
          const currentCandidates = Array.isArray(electionsData[electionIndex].candidates)
            ? electionsData[electionIndex].candidates
            : [];
          if (!currentCandidates.includes(normalizedCandidate.id)) {
            electionsData[electionIndex].candidates = [...currentCandidates, normalizedCandidate.id];
          }
        }
      }
      return { success: true, data: normalizedCandidate };
    } catch (error) {
      return { success: false, message: error.message || "Failed to add candidate" };
    }
  }

  await simulateDelay();
  const id = `c${candidatesData.length + 1}`;
  const candidateWithId = normalizeCandidate({ ...newCandidate, id, voteCount: 0 });
  candidatesData.push(candidateWithId);
  const electionIndex = electionsData.findIndex(e => e.id === newCandidate.election);
  if (electionIndex !== -1) {
    const currentCandidates = Array.isArray(electionsData[electionIndex].candidates)
      ? electionsData[electionIndex].candidates
      : [];
    electionsData[electionIndex].candidates = [...currentCandidates, id];
  }
  return { success: true, data: candidateWithId };
};

export const castVote = async (electionId, candidateId, voterId) => {
  if (isMongoId(electionId)) {
    try {
      const token = getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ candidateId, voterId }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, message: payload.message || "Failed to cast vote" };
      }

      const normalizedCandidate = normalizeCandidate(payload.candidate || payload.data?.candidate || payload.vote?.candidate);
      if (normalizedCandidate) {
        const index = candidatesData.findIndex(c => String(c.id) === String(normalizedCandidate.id));
        if (index !== -1) {
          candidatesData[index] = { ...candidatesData[index], ...normalizedCandidate };
        }
      }

      return { success: true, data: payload.vote || payload.data || payload };
    } catch (error) {
      return { success: false, message: error.message || "Failed to cast vote" };
    }
  }

  await simulateDelay();
  const election = electionsData.find(e => e.id === electionId);
  if (!election) {
    return { success: false, message: "Election not found" };
  }

  const normalizedElection = normalizeElectionTimes(election);
  if (normalizedElection.startTime && normalizedElection.endTime) {
    const start = new Date(normalizedElection.startTime);
    const end = new Date(normalizedElection.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const now = new Date();
      if (now < start) {
        return { success: false, message: "Voting has not started yet." };
      }
      if (now > end) {
        return { success: false, message: "Voting has ended." };
      }
    }
  }

  const voter = votersData.find(v => v.id === voterId);
  if (!voter) {
    return { success: false, message: "Voter not found" };
  }
  if (voter.votedElections.includes(electionId)) {
    return { success: false, message: "You have already voted in this election." };
  }

  const candidate = candidatesData.find(c => c.id === candidateId && c.election === electionId);
  if (!candidate) {
    return { success: false, message: "Candidate not found in this election." };
  }

  candidate.voteCount += 1;
  voter.votedElections.push(electionId);

  return { success: true, message: "Vote cast successfully!" };
};

export const fetchResults = async () => {
  try {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE_URL}/api/elections`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, message: payload.message || "Failed to fetch results" };
    }

    const items = Array.isArray(payload.elections) ? payload.elections : [];
    const results = items.map((election) => {
      const normalizedElection = normalizeElection(election);
      const candidates = Array.isArray(election?.candidates)
        ? election.candidates.map(normalizeCandidate)
        : [];
      const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount ?? 0), 0);
      return {
        id: normalizedElection.id,
        title: normalizedElection.title,
        thumbnail: normalizedElection.thumbnail,
        totalVotes,
        candidates,
        startTime: normalizedElection.startTime,
        endTime: normalizedElection.endTime,
      };
    });

    return { success: true, data: results };
  } catch (error) {
    await simulateDelay();
    const results = electionsData.map(election => {
      const electionCandidates = candidatesData.filter(c => election.candidates.includes(c.id));
      const totalVotes = electionCandidates.reduce((sum, c) => sum + c.voteCount, 0);
      return {
        id: election.id,
        title: election.title,
        thumbnail: election.thumbnail,
        totalVotes,
        candidates: electionCandidates.map(c => ({
          id: c.id,
          fullName: c.fullName,
          image: c.image,
          voteCount: c.voteCount,
          percentage: totalVotes > 0 ? (c.voteCount / totalVotes) * 100 : 0,
        })),
        startTime: election.startTime,
        endTime: election.endTime,
      };
    });
    return { success: true, data: results };
  }
};

export const loginUser = async (email, password) => {
  await simulateDelay();
  const user = votersData.find(v => v.email === email && v.password === password);
  if (user) {
    return { success: true, data: { ...user, token: "mock-jwt-token" } };
  }
  return { success: false, message: "Invalid credentials" };
};

export const registerUser = async (newUser) => {
  await simulateDelay();
  const existingUser = votersData.find(v => v.email === newUser.email);
  if (existingUser) {
    return { success: false, message: "User with this email already exists" };
  }
  const id = `v${votersData.length + 1}`;
  const userWithId = { ...newUser, id, isAdmin: false, votedElections: [] };
  votersData.push(userWithId);
  return { success: true, data: userWithId };
};
// ===== Analytics APIs =====

export const fetchDashboardStats = async () => {
  const token = getStoredToken();
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch dashboard stats" };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, message: error.message };
  }
};

export const fetchElectionStats = async (electionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/elections/${electionId}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch election stats" };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching election stats:", error);
    return { success: false, message: error.message };
  }
};

export const fetchLiveResults = async (electionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics/elections/${electionId}/live-results`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch live results" };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching live results:", error);
    return { success: false, message: error.message };
  }
};