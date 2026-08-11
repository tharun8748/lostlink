// =========================================
// 1. FIND ALL LOST REPORTS
// =========================================

MATCH (r:Report {type: "LOST"})
  -[:DESCRIBES]->(i:Item)

RETURN
  r.id AS reportId,
  i.name AS item,
  i.category AS category,
  r.date AS date,
  r.time AS time

ORDER BY
  r.date DESC,
  r.time DESC;


// =========================================
// 2. MULTI-HOP QUERY
// Find FOUND reports connected through
// the same location as a LOST report
// =========================================

MATCH (lost:Report {id: $reportId})
  -[:OCCURRED_AT]->(location:Location)
  <-[:OCCURRED_AT]-(found:Report {type: "FOUND"})

MATCH (found)
  -[:DESCRIBES]->(foundItem:Item)

RETURN
  found.id AS matchedReport,
  foundItem.name AS item,
  location.name AS location,
  found.date AS date,
  found.time AS time

ORDER BY
  found.date DESC,
  found.time DESC;


// =========================================
// 3. GRAPH-BASED POTENTIAL MATCH
// Same location + same category +
// shared item features
// =========================================

MATCH (lost:Report {id: $reportId})
  -[:OCCURRED_AT]->(location:Location)

MATCH (lost)
  -[:DESCRIBES]->(lostItem:Item)
  -[:HAS_FEATURE]->(lostFeature:Feature)

MATCH (found:Report {type: "FOUND"})
  -[:OCCURRED_AT]->(location)

MATCH (found)
  -[:DESCRIBES]->(foundItem:Item)
  -[:HAS_FEATURE]->(foundFeature:Feature)

WHERE
  lost.id <> found.id
  AND toLower(lostItem.category)
      = toLower(foundItem.category)
  AND toLower(lostFeature.name)
      = toLower(foundFeature.name)

WITH
  found,
  foundItem,
  location,
  collect(DISTINCT lostFeature.name)
    AS sharedFeatures

RETURN
  found.id AS matchedReport,
  foundItem.name AS item,
  foundItem.category AS category,
  location.name AS location,
  sharedFeatures,
  size(sharedFeatures) AS featureMatches

ORDER BY
  featureMatches DESC;


// =========================================
// 4. MULTI-HOP RELATIONSHIP EXPLORATION
// Report → Item → Feature
// =========================================

MATCH
  (r:Report {id: $reportId})
  -[:DESCRIBES]->(i:Item)
  -[:HAS_FEATURE]->(f:Feature)

RETURN
  r.id AS report,
  i.id AS itemId,
  i.name AS item,
  i.category AS category,
  collect(DISTINCT f.name) AS features;


// =========================================
// 5. FIND ACTIVITY AROUND A LOCATION
// Location → Reports → Items
// =========================================

MATCH
  (r:Report)
  -[:OCCURRED_AT]->(location:Location)

WHERE
  location.id = $locationId

MATCH
  (r)-[:DESCRIBES]->(item:Item)

RETURN
  r.id AS reportId,
  r.type AS reportType,
  item.name AS item,
  item.category AS category,
  location.name AS location,
  r.date AS date,
  r.time AS time

ORDER BY
  r.date DESC,
  r.time DESC;