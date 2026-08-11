const { runQuery, driver } = require("./db");

async function fixItems() {
  try {
    const result = await runQuery(`
      MATCH (i:Item)
      WHERE i.id IS NULL

      WITH i,
        CASE i.name
          WHEN "Black iphone 15" THEN "I009"
          WHEN "Black Wallet" THEN "I010"
          WHEN "Black Nike Backpack" THEN "I011"
          WHEN "Test Samsung Phone" THEN "I012"
          ELSE null
        END AS newId

      WHERE newId IS NOT NULL

      SET i.id = newId

      RETURN
        i.id AS id,
        i.name AS name
    `);

    console.log("✅ Old items fixed:");
    console.table(result);

    console.log("\n✅ Item ID cleanup completed.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await driver.close();
  }
}

fixItems();