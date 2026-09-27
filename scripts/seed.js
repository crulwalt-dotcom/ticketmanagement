const { MongoClient } = require("mongodb");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const users = [
  { id: randomUUID(), name: "Alex Chen", email: "alex@example.com", color: "#0078d4" },
  { id: randomUUID(), name: "Sam Rivera", email: "sam@example.com", color: "#107c10" },
  { id: randomUUID(), name: "Jordan Lee", email: "jordan@example.com", color: "#8764b8" },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("ticketboard");

  const count = await db.collection("users").countDocuments();
  if (count === 0) {
    await db.collection("users").insertMany(users);
    console.log("Seeded 3 users");
  } else {
    console.log(`Users already exist (${count}), skipping`);
  }

  const tCount = await db.collection("tickets").countDocuments();
  if (tCount === 0) {
    const now = new Date().toISOString();
    await db.collection("tickets").insertMany([
      {
        id: randomUUID(),
        title: "Login page crashes on empty password",
        description: "Submit with blank password throws uncaught exception.",
        type: "Bug",
        status: "New",
        priority: "High",
        createdBy: users[0].id,
        assignedTo: users[1].id,
        images: [],
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Add dark mode toggle",
        description: "Users want a theme switcher in settings.",
        type: "Feature",
        status: "Active",
        priority: "Medium",
        createdBy: users[1].id,
        assignedTo: users[2].id,
        images: [],
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Update README with setup steps",
        description: "Document env vars and seed command.",
        type: "Task",
        status: "Resolved",
        priority: "Low",
        createdBy: users[2].id,
        assignedTo: users[0].id,
        images: [],
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    console.log("Seeded sample tickets");
  } else {
    console.log(`Tickets already exist (${tCount}), skipping`);
  }

  await client.close();
  console.log("Done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
