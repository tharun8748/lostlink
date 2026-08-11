require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { runQuery } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api/health", async (req, res) => {
  try {
    const result = await runQuery("RETURN 1 AS result");

    const value = result[0]?.result;

    res.json({
      status: "ok",
      database:
        value &&
        typeof value.toNumber === "function"
          ? value.toNumber()
          : Number(value),
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      message: "Database unavailable",
    });
  }
});

/* =========================================
   GET ALL LOST REPORTS
========================================= */

app.get("/api/reports/lost", async (req, res) => {
  try {
    const result = await runQuery(`
      MATCH (r:Report {type: "LOST"})
        -[:DESCRIBES]->(i:Item)

      OPTIONAL MATCH (r)-[:OCCURRED_AT]->(loc:Location)

      OPTIONAL MATCH (i)-[:HAS_FEATURE]->(f:Feature)

      RETURN
        r.id AS reportId,
        i.name AS item,
        i.category AS category,
        r.description AS description,

        CASE
          WHEN loc IS NOT NULL
          THEN loc.name
          ELSE "Unknown location"
        END AS location,

        r.date AS date,
        r.time AS time,

        collect(DISTINCT f.name) AS features

      ORDER BY r.date DESC, r.time DESC
    `);

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch lost reports:", error);

    res.status(503).json({
      message: "Unable to fetch lost reports",
    });
  }
});

/* =========================================
   CREATE LOST REPORT
========================================= */

app.post("/api/reports/lost", async (req, res) => {
  const {
    itemName,
    category,
    description,
    location,
    date,
    time,
    features,
  } = req.body;

  if (
    !itemName ||
    !category ||
    !description ||
    !location ||
    !date ||
    !time
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const featureList = Array.isArray(features)
      ? features
      : String(features || "")
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean);

    const result = await runQuery(
      `
      OPTIONAL MATCH (existingReport:Report)

      WITH
        coalesce(
          max(
            toInteger(
              replace(existingReport.id, "R", "")
            )
          ),
          0
        ) + 1 AS nextReportNumber

      OPTIONAL MATCH (existingItem:Item)

      WITH
        nextReportNumber,
        coalesce(
          max(
            toInteger(
              replace(existingItem.id, "I", "")
            )
          ),
          0
        ) + 1 AS nextItemNumber

      WITH
        "R" + right(
          "000" + toString(nextReportNumber),
          3
        ) AS generatedReportId,

        "I" + right(
          "000" + toString(nextItemNumber),
          3
        ) AS generatedItemId

      CREATE (i:Item {
        id: generatedItemId,
        name: $itemName,
        category: $category,
        description: $description
      })

      MERGE (loc:Location {
        name: $location
      })

      CREATE (r:Report {
        id: generatedReportId,
        type: "LOST",
        description: $description,
        date: $date,
        time: $time
      })

      CREATE (r)-[:DESCRIBES]->(i)

      CREATE (r)-[:OCCURRED_AT]->(loc)

      FOREACH (featureName IN $featureList |
        MERGE (f:Feature {
          name: toLower(trim(featureName))
        })

        MERGE (i)-[:HAS_FEATURE]->(f)
      )

      RETURN
        generatedReportId AS reportId,
        generatedItemId AS itemId,
        i.name AS item,
        i.category AS category,
        r.description AS description,
        loc.name AS location,
        r.date AS date,
        r.time AS time
      `,
      {
        itemName,
        category,
        description,
        location,
        date,
        time,
        featureList,
      }
    );

    if (result.length === 0) {
      return res.status(500).json({
        message: "Unable to create lost report",
      });
    }

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Failed to create lost report:", error);

    res.status(500).json({
      message: "Unable to create lost report",
    });
  }
});

/* =========================================
   CREATE FOUND REPORT
========================================= */

app.post("/api/reports/found", async (req, res) => {
  const {
    itemName,
    category,
    description,
    location,
    date,
    time,
    features,
  } = req.body;

  if (
    !itemName ||
    !category ||
    !description ||
    !location ||
    !date ||
    !time
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const featureList = Array.isArray(features)
      ? features
      : String(features || "")
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean);

    const result = await runQuery(
      `
      OPTIONAL MATCH (existingReport:Report)

      WITH
        coalesce(
          max(
            toInteger(
              replace(existingReport.id, "R", "")
            )
          ),
          0
        ) + 1 AS nextReportNumber

      OPTIONAL MATCH (existingItem:Item)

      WITH
        nextReportNumber,
        coalesce(
          max(
            toInteger(
              replace(existingItem.id, "I", "")
            )
          ),
          0
        ) + 1 AS nextItemNumber

      WITH
        "R" + right(
          "000" + toString(nextReportNumber),
          3
        ) AS generatedReportId,

        "I" + right(
          "000" + toString(nextItemNumber),
          3
        ) AS generatedItemId

      CREATE (i:Item {
        id: generatedItemId,
        name: $itemName,
        category: $category,
        description: $description
      })

      MERGE (loc:Location {
        name: $location
      })

      CREATE (r:Report {
        id: generatedReportId,
        type: "FOUND",
        description: $description,
        date: $date,
        time: $time
      })

      CREATE (r)-[:DESCRIBES]->(i)

      CREATE (r)-[:OCCURRED_AT]->(loc)

      FOREACH (featureName IN $featureList |
        MERGE (f:Feature {
          name: toLower(trim(featureName))
        })

        MERGE (i)-[:HAS_FEATURE]->(f)
      )

      RETURN
        generatedReportId AS reportId,
        generatedItemId AS itemId,
        i.name AS item,
        i.category AS category,
        r.description AS description,
        loc.name AS location,
        r.date AS date,
        r.time AS time
      `,
      {
        itemName,
        category,
        description,
        location,
        date,
        time,
        featureList,
      }
    );

    if (result.length === 0) {
      return res.status(500).json({
        message: "Unable to create found report",
      });
    }

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Failed to create found report:", error);

    res.status(500).json({
      message: "Unable to create found report",
    });
  }
});

/* =========================================
   GET ALL FOUND REPORTS
========================================= */

app.get("/api/reports/found", async (req, res) => {
  try {
    const result = await runQuery(`
      MATCH (r:Report {type: "FOUND"})
        -[:DESCRIBES]->(i:Item)

      OPTIONAL MATCH (r)-[:OCCURRED_AT]->(loc:Location)

      OPTIONAL MATCH (i)-[:HAS_FEATURE]->(f:Feature)

      RETURN
        r.id AS reportId,
        i.name AS item,
        i.category AS category,
        r.description AS description,

        CASE
          WHEN loc IS NOT NULL
          THEN loc.name
          ELSE "Unknown location"
        END AS location,

        r.date AS date,
        r.time AS time,

        collect(DISTINCT f.name) AS features

      ORDER BY r.date DESC, r.time DESC
    `);

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch found reports:", error);

    res.status(503).json({
      message: "Unable to fetch found reports",
    });
  }
});

/* =========================================
   FIND POTENTIAL MATCHES
   SMART MATCH SCORING
========================================= */

app.get(
  "/api/reports/:reportId/matches",
  async (req, res) => {
    const { reportId } = req.params;

    try {
      const result = await runQuery(
        `
        MATCH (lost:Report {id: $reportId})
          -[:DESCRIBES]->(lostItem:Item)

        MATCH (found:Report {type: "FOUND"})
          -[:DESCRIBES]->(foundItem:Item)

        OPTIONAL MATCH
          (lost)-[:OCCURRED_AT]->(lostLocation:Location)

        OPTIONAL MATCH
          (found)-[:OCCURRED_AT]->(foundLocation:Location)

        OPTIONAL MATCH
          (lostItem)-[:HAS_FEATURE]->(lostFeature:Feature)

        OPTIONAL MATCH
          (foundItem)-[:HAS_FEATURE]->(foundFeature:Feature)

        WITH
          lost,
          lostItem,
          found,
          foundItem,
          lostLocation,
          foundLocation,

          collect(
            DISTINCT CASE
              WHEN lostFeature IS NOT NULL
                AND foundFeature IS NOT NULL
                AND toLower(trim(lostFeature.name))
                  =
                toLower(trim(foundFeature.name))
              THEN toLower(trim(lostFeature.name))
            END
          ) AS rawSharedFeatures

        WITH
          lost,
          lostItem,
          found,
          foundItem,
          lostLocation,
          foundLocation,

          [
            feature IN rawSharedFeatures
            WHERE feature IS NOT NULL
          ] AS sharedFeatures

        WITH
          found,
          foundItem,
          foundLocation,
          sharedFeatures,

          /* LOCATION = 30% */

          CASE
            WHEN
              lostLocation IS NOT NULL
              AND foundLocation IS NOT NULL
              AND toLower(trim(lostLocation.name))
                =
              toLower(trim(foundLocation.name))
            THEN 30
            ELSE 0
          END AS locationScore,

          /* CATEGORY = 20% */

          CASE
            WHEN
              toLower(trim(lostItem.category))
                =
              toLower(trim(foundItem.category))
            THEN 20
            ELSE 0
          END AS categoryScore,

          /* ITEM NAME = 20% */

          CASE
            WHEN
              toLower(trim(lostItem.name))
                =
              toLower(trim(foundItem.name))
            THEN 20

            WHEN
              toLower(trim(lostItem.name)) CONTAINS
              toLower(trim(foundItem.name))
              OR
              toLower(trim(foundItem.name)) CONTAINS
              toLower(trim(lostItem.name))
            THEN 20

            ELSE 0
          END AS itemScore

        WITH
          found,
          foundItem,
          foundLocation,
          sharedFeatures,
          locationScore,
          categoryScore,
          itemScore,

          /* FEATURES = 30% */

          CASE
            WHEN size(sharedFeatures) >= 5
            THEN 30

            WHEN size(sharedFeatures) = 4
            THEN 24

            WHEN size(sharedFeatures) = 3
            THEN 18

            WHEN size(sharedFeatures) = 2
            THEN 12

            WHEN size(sharedFeatures) = 1
            THEN 6

            ELSE 0
          END AS featureScore

        WITH
          found,
          foundItem,
          foundLocation,
          sharedFeatures,
          locationScore,
          categoryScore,
          itemScore,
          featureScore,

          (
            locationScore +
            categoryScore +
            itemScore +
            featureScore
          ) AS matchScore

        WHERE matchScore > 0

        RETURN
          found.id AS matchedReport,

          foundItem.name AS item,

          foundItem.category AS category,

          found.description AS description,

          CASE
            WHEN foundLocation IS NOT NULL
            THEN foundLocation.name
            ELSE "Unknown location"
          END AS location,

          found.date AS date,

          found.time AS time,

          sharedFeatures,

          size(sharedFeatures) AS featureMatches,

          locationScore,

          categoryScore,

          itemScore,

          featureScore,

          matchScore

        ORDER BY
          matchScore DESC,
          featureMatches DESC
        `,
        { reportId }
      );

      /* =========================================
         CONVERT NEO4J NUMBERS
      ========================================= */

      const formattedResult = result.map((record) => {
        const convertNumber = (value) => {
          if (
            value !== null &&
            value !== undefined &&
            typeof value.toNumber === "function"
          ) {
            return value.toNumber();
          }

          const converted = Number(value);

          return Number.isNaN(converted)
            ? 0
            : converted;
        };

        const featureMatches = convertNumber(
          record.featureMatches
        );

        const locationScore = convertNumber(
          record.locationScore
        );

        const categoryScore = convertNumber(
          record.categoryScore
        );

        const itemScore = convertNumber(
          record.itemScore
        );

        const featureScore = convertNumber(
          record.featureScore
        );

        const matchScore = convertNumber(
          record.matchScore
        );

        /* =========================================
           BUILD MATCH REASONS
        ========================================= */

        const matchReasons = [];

        if (locationScore > 0) {
          matchReasons.push({
            type: "location",
            label: "Same location",
            score: locationScore,
          });
        }

        if (categoryScore > 0) {
          matchReasons.push({
            type: "category",
            label: "Same category",
            score: categoryScore,
          });
        }

        if (itemScore > 0) {
          matchReasons.push({
            type: "item",
            label: "Matching item name",
            score: itemScore,
          });
        }

        if (featureScore > 0) {
          matchReasons.push({
            type: "features",
            label: `${featureMatches} shared feature${
              featureMatches === 1 ? "" : "s"
            }`,
            score: featureScore,
          });
        }

        return {
          ...record,

          featureMatches,

          locationScore,

          categoryScore,

          itemScore,

          featureScore,

          matchScore,

          sharedFeatures: Array.isArray(
            record.sharedFeatures
          )
            ? record.sharedFeatures.filter(Boolean)
            : [],

          matchReasons,
        };
      });

      console.log(
        "Formatted match results:",
        formattedResult
      );

      res.json(formattedResult);
    } catch (error) {
      console.error(
        "Failed to find matches:",
        error
      );

      res.status(503).json({
        message:
          "Unable to find potential matches",
      });
    }
  }
);

/* =========================================
   GET REPORT CONNECTION DETAILS
========================================= */

app.get(
  "/api/reports/:reportId/connection",
  async (req, res) => {
    const { reportId } = req.params;

    try {
      const result = await runQuery(
        `
        MATCH (r:Report {id: $reportId})
          -[:DESCRIBES]->(i:Item)

        OPTIONAL MATCH
          (i)-[:HAS_FEATURE]->(f:Feature)

        OPTIONAL MATCH
          (r)-[:OCCURRED_AT]->(loc:Location)

        RETURN
          r.id AS reportId,
          i.id AS itemId,
          i.name AS item,
          i.category AS category,

          CASE
            WHEN loc IS NOT NULL
            THEN loc.name
            ELSE "Unknown location"
          END AS location,

          collect(
            DISTINCT f.name
          ) AS features
        `,
        { reportId }
      );

      if (result.length === 0) {
        return res.status(404).json({
          message: "Report not found",
        });
      }

      res.json(result[0]);
    } catch (error) {
      console.error(
        "Failed to fetch connection details:",
        error
      );

      res.status(503).json({
        message:
          "Unable to fetch connection details",
      });
    }
  }
);

/* =========================================
   ROOT ROUTE
========================================= */

app.get("/", (req, res) => {
  res.json({
    message: "LostLink API is running",
    status: "ok",
  });
});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `LostLink server running on port ${PORT}`
  );
});