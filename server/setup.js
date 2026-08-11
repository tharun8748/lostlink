require("dotenv").config();

const fs = require("fs");
const { driver } = require("./db");

async function setup() {
  const schema = fs.readFileSync("./schema.cypher", "utf8");

  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  const session = driver.session();

  try {
    for (const statement of statements) {
      console.log(`Running: ${statement}`);
      await session.run(statement);
    }

    console.log("✅ Database schema created successfully.");
  } catch (error) {
    console.error("❌ Schema setup failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

setup();