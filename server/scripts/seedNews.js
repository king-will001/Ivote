const path = require("path");
const mongoose = require("mongoose");
const NewsModel = require("../models/newsModel");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const topicSeeds = [
  {
    label: "Tech",
    author: "Tech Desk",
    headlines: [
      "AI copilots streamline service triage",
      "Zero-trust access rollout for admin tools",
      "Real-time analytics dashboard for platform health",
    ],
    summaries: [
      "A pilot uses AI copilots to summarize incident reports and route requests to the right teams.",
      "Admin tools now use conditional access checks and device posture rules to reduce shared credentials.",
      "A new dashboard aggregates uptime, latency, and error budgets so ops teams can spot spikes earlier.",
    ],
    followUps: [
      "Early results show faster response times and clearer audit trails.",
      "Training sessions start next week to cover updated access policies.",
      "A weekly status digest will be published to keep teams aligned.",
    ],
  },
  {
    label: "Health",
    author: "Health Desk",
    headlines: [
      "Telehealth hours expand for after-work visits",
      "Wearable programs track recovery milestones",
      "Nutrition workshops focus on affordable meals",
    ],
    summaries: [
      "Clinics are adding evening telehealth slots to improve access for working families.",
      "A wearable pilot monitors heart rate and activity during recovery to flag out-of-range metrics.",
      "Community workshops highlight low-cost, high-protein meal planning with grocery guides.",
    ],
    followUps: [
      "Patients can schedule within two days and receive follow-up reminders.",
      "Care teams can adjust plans faster with real-time alerts.",
      "Sessions are open to students and caregivers starting next week.",
    ],
  },
  {
    label: "Education",
    author: "Education Desk",
    headlines: [
      "Digital literacy labs launch across campuses",
      "Teacher upskilling series focuses on AI tools",
      "STEM scholarships open for community projects",
    ],
    summaries: [
      "New labs teach safe research, data privacy, and critical evaluation of sources.",
      "Teachers will receive training on AI-assisted lesson planning and grading safeguards.",
      "Scholarships fund student-led projects in robotics, health tech, and sustainability.",
    ],
    followUps: [
      "Mentor hours will be added weekly for project support.",
      "The series includes policy guidance and classroom demos.",
      "Applicants must submit a project plan and partner letter by next month.",
    ],
  },
];

const buildSeedNews = (topics) =>
  topics.flatMap((topic) => {
    const count = Math.min(
      topic.headlines.length,
      topic.summaries.length,
      topic.followUps.length
    );
    return Array.from({ length: count }, (_, index) => ({
      title: `${topic.label}: ${topic.headlines[index]}`,
      content: `${topic.summaries[index]} ${topic.followUps[index]}`,
      author: topic.author,
      category: topic.label,
      mediaType: null,
      mediaUrl: null,
    }));
  });

const seedNews = buildSeedNews(topicSeeds);

const connectDb = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error("Missing MONGO_URL in server/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 30_000,
  });
};

const seed = async () => {
  await connectDb();

  const now = Date.now();
  const datedNews = seedNews.map((post, index) => ({
    ...post,
    date: new Date(now - index * 60 * 60 * 1000),
  }));

  let created = 0;
  for (const post of datedNews) {
    const exists = await NewsModel.findOne({ title: post.title });
    if (exists) continue;
    await NewsModel.create(post);
    created += 1;
  }

  console.log(`Seeded news posts: ${created}`);
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error("News seed failed:", error);
  process.exit(1);
});
