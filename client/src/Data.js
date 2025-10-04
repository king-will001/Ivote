// Flag and Candidate Images
import Thumbnai11 from './assets/argentina-flag.jpg';
import Thumbnai12 from './assets/cameroon-flag.png';
import Thumbnai13 from './assets/shutterstock-flag.webp';
import Candidate0 from './assets/candidate1.webp';
import Candidate1 from './assets/innocent.jpg';
import Candidate2 from './assets/candidate2.jpg';
import Candidate3 from './assets/candidate3.jpg';
import Candidate4 from './assets/candidate4.jpg';
import Candidate5 from './assets/candidate5.jpg';
import Candidate6 from './assets/candidate6.jpg';
import Candidate7 from './assets/candidate7.jpg';

// Elections Data
export const elections = [
  {
    id: "e1",
    title: "Argentina Presidential Elections 2025",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: Thumbnai11,
    candidates: ["c1", "c2"], // Only candidates with election: "e1"
    voters: [],
  },
  {
    id: "e2",
    title: "Cameroon Presidential Elections 2025",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: Thumbnai12,
    candidates: ["c5", "c6", "c7"],
    voters: [],
  },
  {
    id: "e3",
    title: "Honduras Presidential Elections 2025",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ullam libero tempora repellendus...",
    thumbnail: Thumbnai13,
    candidates: ["c3", "c4"],
    voters: [],
  },
];

// Candidates Data
export const candidates = [
  {
    id: "c1",
    fullName: "Ngwa Innocent",
    image: Candidate1,
    motto: "Unity and Progress for All",
    voteCount: 230,
    election: "e1",
  },
  {
    id: "c2",
    fullName: "Nshom Ciara",
    image: Candidate2,
    motto: "A Voice for the People",
    voteCount: 130,
    election: "e1",
  },
  {
    id: "c3",
    fullName: "Boseh Iwill",
    image: Candidate3,
    motto: "Transparency and Growth",
    voteCount: 4030,
    election: "e3",
  },
  {
    id: "c4",
    fullName: "Ngwa Nelson",
    image: Candidate4,
    motto: "A Better Tomorrow",
    voteCount: 430,
    election: "e3",
  },
  {
    id: "c5",
    fullName: "Berrynun Kum",
    image: Candidate5,
    motto: "Power to the Youth",
    voteCount: 260,
    election: "e2",
  },
  {
    id: "c6",
    fullName: "Kudi Prisca",
    image: Candidate6,
    motto: "Together We Can",
    voteCount: 330,
    election: "e2",
  },
  {
    id: "c7",
    fullName: "Cho Stephane Cho",
    image: Candidate7,
    motto: "Fairness. Equality. Future.",
    voteCount: 130,
    election: "e2",
  },
  {
    id: "c8",
    fullName: "Mbang Mac-joel",
    image: Candidate0,
    motto: "Unity in Diversity",
    voteCount: 10,
    election: "e1",

  },
];

// Voters Data
export const voters = [
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
