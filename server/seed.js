require("dotenv").config();

const { driver } = require("./db");

const people = [
  {
    id: "P001",
    name: "Arjun Rao",
    contact: "arjun@example.com",
  },
  {
    id: "P002",
    name: "Meera Sharma",
    contact: "meera@example.com",
  },
  {
    id: "P003",
    name: "Kiran Patel",
    contact: "kiran@example.com",
  },
  {
    id: "P004",
    name: "Sneha Reddy",
    contact: "sneha@example.com",
  },
];

const locations = [
  {
    id: "L001",
    name: "Vijayawada Railway Station",
    city: "Vijayawada",
    type: "Transport Hub",
  },
  {
    id: "L002",
    name: "Benz Circle Bus Stop",
    city: "Vijayawada",
    type: "Transport Hub",
  },
  {
    id: "L003",
    name: "KL University Main Gate",
    city: "Vijayawada",
    type: "Campus",
  },
  {
    id: "L004",
    name: "Trendset Mall",
    city: "Vijayawada",
    type: "Shopping Mall",
  },
  {
    id: "L005",
    name: "MG Road Cafe",
    city: "Vijayawada",
    type: "Cafe",
  },
];

const features = [
  { id: "F001", name: "Black" },
  { id: "F002", name: "Samsung" },
  { id: "F003", name: "Leather" },
  { id: "F004", name: "Blue" },
  { id: "F005", name: "Apple" },
  { id: "F006", name: "Silver" },
  { id: "F007", name: "Student ID" },
  { id: "F008", name: "Backpack" },
  { id: "F009", name: "Red" },
  { id: "F010", name: "Wireless" },
];

const items = [
  {
    id: "I001",
    name: "Samsung Galaxy S24 Ultra",
    category: "Smartphone",
    description: "Black Samsung smartphone with a cracked screen protector",
  },
  {
    id: "I002",
    name: "Samsung Galaxy Smartphone",
    category: "Smartphone",
    description: "Black Samsung smartphone with a cracked screen protector",
  },
  {
    id: "I003",
    name: "Leather Wallet",
    category: "Wallet",
    description: "Brown leather wallet containing several cards",
  },
  {
    id: "I004",
    name: "Blue Backpack",
    category: "Bag",
    description: "Medium blue backpack with a front zipper",
  },
  {
    id: "I005",
    name: "Apple AirPods Pro",
    category: "Earbuds",
    description: "White wireless earbuds inside a small charging case",
  },
  {
    id: "I006",
    name: "Silver Laptop",
    category: "Laptop",
    description: "Silver laptop with a small university sticker",
  },
  {
    id: "I007",
    name: "Red Water Bottle",
    category: "Bottle",
    description: "Red insulated water bottle",
  },
];

const reports = [
  {
    id: "R001",
    type: "LOST",
    date: "2026-08-10",
    time: "18:30",
    description: "Lost near the main entrance while waiting for a train",
    personId: "P001",
    itemId: "I001",
    locationId: "L001",
    timeId: "T001",
    featureIds: ["F001", "F002"],
  },
  {
    id: "R002",
    type: "FOUND",
    date: "2026-08-10",
    time: "18:45",
    description: "Found a black Samsung phone near the entrance",
    personId: "P002",
    itemId: "I002",
    locationId: "L001",
    timeId: "T002",
    featureIds: ["F001", "F002"],
  },
  {
    id: "R003",
    type: "LOST",
    date: "2026-08-10",
    time: "13:10",
    description: "Brown leather wallet lost after leaving the bus",
    personId: "P003",
    itemId: "I003",
    locationId: "L002",
    timeId: "T003",
    featureIds: ["F003"],
  },
  {
    id: "R004",
    type: "FOUND",
    date: "2026-08-10",
    time: "13:28",
    description: "Brown leather wallet found beside a bus stop bench",
    personId: "P004",
    itemId: "I003",
    locationId: "L002",
    timeId: "T004",
    featureIds: ["F003"],
  },
  {
    id: "R005",
    type: "LOST",
    date: "2026-08-09",
    time: "16:20",
    description: "Blue backpack left near the university entrance",
    personId: "P001",
    itemId: "I004",
    locationId: "L003",
    timeId: "T005",
    featureIds: ["F004", "F008"],
  },
  {
    id: "R006",
    type: "FOUND",
    date: "2026-08-09",
    time: "16:50",
    description: "Blue backpack found near the security office",
    personId: "P003",
    itemId: "I004",
    locationId: "L003",
    timeId: "T006",
    featureIds: ["F004", "F008"],
  },
  {
    id: "R007",
    type: "LOST",
    date: "2026-08-08",
    time: "20:15",
    description: "Wireless earbuds lost inside the mall food court",
    personId: "P002",
    itemId: "I005",
    locationId: "L004",
    timeId: "T007",
    featureIds: ["F005", "F010"],
  },
  {
    id: "R008",
    type: "FOUND",
    date: "2026-08-08",
    time: "20:40",
    description: "Wireless earbuds found under a food court table",
    personId: "P004",
    itemId: "I005",
    locationId: "L004",
    timeId: "T008",
    featureIds: ["F005", "F010"],
  },
  {
    id: "R009",
    type: "LOST",
    date: "2026-08-07",
    time: "10:30",
    description: "Silver laptop with a university sticker left at a cafe",
    personId: "P003",
    itemId: "I006",
    locationId: "L005",
    timeId: "T009",
    featureIds: ["F006", "F007"],
  },
  {
    id: "R010",
    type: "FOUND",
    date: "2026-08-07",
    time: "11:05",
    description: "Silver laptop found on a cafe chair",
    personId: "P002",
    itemId: "I006",
    locationId: "L005",
    timeId: "T010",
    featureIds: ["F006", "F007"],
  },
  {
    id: "R011",
    type: "LOST",
    date: "2026-08-06",
    time: "17:10",
    description: "Red insulated bottle lost near the campus gate",
    personId: "P004",
    itemId: "I007",
    locationId: "L003",
    timeId: "T011",
    featureIds: ["F009"],
  },
];

async function seed() {
  const session = driver.session();

  try {
    console.log("🌱 Starting LostLink seed...");

    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $people AS person
        MERGE (p:Person {id: person.id})
        SET p.name = person.name,
            p.contact = person.contact
        `,
        { people }
      );

      await tx.run(
        `
        UNWIND $locations AS location
        MERGE (l:Location {id: location.id})
        SET l.name = location.name,
            l.city = location.city,
            l.type = location.type
        `,
        { locations }
      );

      await tx.run(
        `
        UNWIND $features AS feature
        MERGE (f:Feature {id: feature.id})
        SET f.name = feature.name
        `,
        { features }
      );

      await tx.run(
        `
        UNWIND $items AS item
        MERGE (i:Item {id: item.id})
        SET i.name = item.name,
            i.category = item.category,
            i.description = item.description
        `,
        { items }
      );

      await tx.run(
        `
        UNWIND $reports AS report

        MERGE (r:Report {id: report.id})
        SET r.type = report.type,
            r.date = report.date,
            r.time = report.time,
            r.description = report.description

        WITH r, report

        MATCH (p:Person {id: report.personId})
        MATCH (i:Item {id: report.itemId})
        MATCH (l:Location {id: report.locationId})

        MERGE (p)-[:SUBMITTED]->(r)
        MERGE (r)-[:DESCRIBES]->(i)
        MERGE (r)-[:OCCURRED_AT]->(l)

        WITH r, report

        MERGE (t:TimeEvent {id: report.timeId})
        SET t.date = report.date,
            t.time = report.time

        MERGE (r)-[:OCCURRED_DURING]->(t)

        WITH r, report

        UNWIND report.featureIds AS featureId
        MATCH (f:Feature {id: featureId})
        MATCH (i:Item {id: report.itemId})
        MERGE (i)-[:HAS_FEATURE]->(f)
        `,
        { reports }
      );
    });

    console.log("✅ LostLink seed data loaded successfully.");

    const result = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS type, count(n) AS count
      ORDER BY type
    `);

    console.log("\n📊 Database contents:");

    for (const record of result.records) {
      console.log(
        `${record.get("type")}: ${record.get("count").toNumber()}`
      );
    }
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();