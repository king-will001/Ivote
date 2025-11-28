// utils/apiSimulator.js
// This file simulates API calls for client-side development without a real backend.

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

const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let electionsData = [
  {
    id: "e1",
    title: "Argentina Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: argentinaFlag,
    candidates: ["c1", "c2", "c8"],
    voters: [],
    startDate: "2025-01-01T08:00",
    endDate: "2025-01-31T18:00",
  },
  {
    id: "e2",
    title: "Cameroon Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: cameroonFlag,
    candidates: ["c5", "c6", "c7"],
    voters: [],
    startDate: "2025-02-15T09:00",
    endDate: "2025-03-15T17:00",
  },
  {
    id: "e3",
    title: "Honduras Presidential Elections 2025",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: shutterstockFlag,
    candidates: ["c3", "c4"],
    voters: [],
    startDate: "2025-04-01T10:00",
    endDate: "2025-04-30T16:00",
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

// ✅ Updated news section with media support
let newsDB = [
  {
    id: 1,
    title: "Important Update: New Voting Security Features",
    content:
      "We're excited to announce enhanced security features for our e-voting platform. These updates include two-factor authentication, improved encryption, and real-time vote verification.",
    author: "System Admin",
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    mediaType: "embed",
    mediaUrl: "https://www.youtube.com/watch?v=w3_0x6oaDmI",
  },
  {
    id: 2,
    title: "Election Day Guidelines",
    content:
      "Please review these important guidelines for the upcoming election day. Make sure to have your voter ID ready and verify your registration status before voting.",
    author: "Election Officer",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Official Voting Process Documentation",
    content:
      "Access our comprehensive guide on the voting process, including step-by-step instructions and frequently asked questions.",
    author: "Documentation Team",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    mediaType: "embed",
    mediaUrl: "https://www.electoralcommission.org",
  },
  {
    id: 4,
    title: "Meet the Candidates Series",
    content:
      "Watch our exclusive interviews with all presidential candidates as they share their visions and plans for the future.",
    author: "Media Team",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    mediaType: "embed",
    mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: 5,
    title: "Voter Registration Statistics",
    content:
      "We've achieved a record-breaking number of registered voters this year! Check out the detailed statistics and demographic breakdown.",
    author: "Analytics Department",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "System Maintenance Notice",
    content:
      "The e-voting platform will undergo scheduled maintenance this weekend. Service will be temporarily unavailable from Saturday 2 AM to 4 AM.",
    author: "Tech Support",
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    mediaType: null,
    mediaUrl: null,
  }
];

export const fetchNews = async () => {
  await simulateDelay(500);
  return { success: true, data: newsDB.sort((a, b) => new Date(b.date) - new Date(a.date)) };
};

export const createNews = async (newPost) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const post = {
        id: Date.now(),
        ...newPost,
        date: new Date().toISOString(),
      };
      newsDB = [post, ...newsDB];
      resolve({ success: true, data: post });
    }, 500);
  });
};

// ==============================
// Existing API logic remains below
// ==============================

export const fetchElections = async () => {
  await simulateDelay(500);
  return { success: true, data: electionsData };
};

export const fetchElectionById = async (id) => {
  await simulateDelay(500);
  const election = electionsData.find(e => e.id === id);
  if (election) {
    const electionCandidates = candidatesData.filter(c => election.candidates.includes(c.id));
    return { success: true, data: { ...election, candidates: electionCandidates } };
  }
  return { success: false, message: "Election not found" };
};

export const createElection = async (newElection) => {
  await simulateDelay(500);
  const id = `e${electionsData.length + 1}`;
  const electionWithId = { ...newElection, id, candidates: [], voters: [] };
  electionsData.push(electionWithId);
  return { success: true, data: electionWithId };
};

export const updateElection = async (updatedElection) => {
  await simulateDelay(500);
  const index = electionsData.findIndex(e => e.id === updatedElection.id);
  if (index !== -1) {
    electionsData[index] = { ...electionsData[index], ...updatedElection };
    return { success: true, data: electionsData[index] };
  }
  return { success: false, message: "Election not found" };
};

export const deleteElection = async (id) => {
  await simulateDelay(500);
  const initialLength = electionsData.length;
  electionsData = electionsData.filter(e => e.id !== id);
  if (electionsData.length < initialLength) {
    candidatesData = candidatesData.filter(c => c.election !== id);
    return { success: true, message: "Election deleted successfully" };
  }
  return { success: false, message: "Election not found" };
};

export const fetchCandidates = async (electionId = null) => {
  await simulateDelay(500);
  if (electionId) {
    return { success: true, data: candidatesData.filter(c => c.election === electionId) };
  }
  return { success: true, data: candidatesData };
};

export const fetchVoters = async (electionId) => {
  await simulateDelay(500);
  if (!electionId) {
    return { success: false, message: "Election ID is required." };
  }
  const votersForElection = votersData.filter(voter => 
    voter.votedElections.includes(electionId)
  );
  return { success: true, data: votersForElection };
};

export const createCandidate = async (newCandidate) => {
  await simulateDelay(500);
  const id = `c${candidatesData.length + 1}`;
  const candidateWithId = { ...newCandidate, id, voteCount: 0 };
  candidatesData.push(candidateWithId);
  const electionIndex = electionsData.findIndex(e => e.id === newCandidate.election);
  if (electionIndex !== -1) {
    electionsData[electionIndex].candidates.push(id);
  }
  return { success: true, data: candidateWithId };
};

export const castVote = async (electionId, candidateId, voterId) => {
  await simulateDelay(500);
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
  await simulateDelay(500);
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
    };
  });
  return { success: true, data: results };
};

export const loginUser = async (email, password) => {
  await simulateDelay(500);
  const user = votersData.find(v => v.email === email && v.password === password);
  if (user) {
    return { success: true, data: { ...user, token: "mock-jwt-token" } };
  }
  return { success: false, message: "Invalid credentials" };
};

export const registerUser = async (newUser) => {
  await simulateDelay(500);
  const existingUser = votersData.find(v => v.email === newUser.email);
  if (existingUser) {
    return { success: false, message: "User with this email already exists" };
  }
  const id = `v${votersData.length + 1}`;
  const userWithId = { ...newUser, id, isAdmin: false, votedElections: [] };
  votersData.push(userWithId);
  return { success: true, data: userWithId };
};
