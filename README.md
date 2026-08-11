 # LostLink

LostLink is a graph-powered Lost and Found application that connects lost reports, found reports, items, locations, people, and item features.

The system uses CognoDB as its graph database layer for both development and deployment.

---

## 1. Project Overview

LostLink helps users report lost items and discover potentially matching found items.

Instead of relying only on text-based search, LostLink uses graph relationships such as:

- Report → Item
- Report → Location
- Report → Person
- Item → Feature
- Report → TimeEvent

These relationships allow the application to discover connections between reports.

For example:

A lost Samsung Galaxy S24 Ultra reported at Vijayawada Railway Station can be connected to a found Samsung smartphone reported at the same location with shared features such as:

- Samsung
- Black

The graph matching system calculates a match score based on these relationships.

---

## 2. Why a Graph Database?

Lost and found information contains many relationships between different entities.

A relational database would require multiple tables and joins to discover these relationships.

A graph database represents these relationships directly, making relationship-based queries and multi-hop traversal more natural.

For LostLink, a potential match can depend on several connected pieces of information at the same time:

```text
Lost Report
    |
    +---- DESCRIBES ----> Item
    |                       |
    |                       +---- HAS_FEATURE ----> Feature
    |
    +---- OCCURRED_AT ---> Location
                              ^
                              |
                         OCCURRED_AT
                              |
                         Found Report
```

This makes graph traversal useful for finding potential lost-and-found connections based on:

- Same location
- Same category
- Similar item names
- Shared item features

---

## 3. Graph Data Model

LostLink uses a connected graph model with labeled nodes, typed relationships, and properties.

### Nodes

- `Person` — person who submitted a report
- `Report` — lost or found report
- `Item` — item described by a report
- `Location` — location where the report occurred
- `Feature` — characteristics of an item
- `TimeEvent` — date and time associated with a report

### Relationships

- `Person -[:SUBMITTED]-> Report`
- `Report -[:DESCRIBES]-> Item`
- `Report -[:OCCURRED_AT]-> Location`
- `Report -[:OCCURRED_DURING]-> TimeEvent`
- `Item -[:HAS_FEATURE]-> Feature`

### Graph Structure

```text
                         ┌──────────────┐
                         │    Person    │
                         └──────┬───────┘
                                │
                          SUBMITTED
                                │
                                ▼
                         ┌──────────────┐
                         │    Report    │
                         │ LOST / FOUND │
                         └──┬────┬───┬──┘
                            │    │   │
                     DESCRIBES    │   OCCURRED_AT
                            │    │        │
                            ▼    │        ▼
                      ┌────────┐ │  ┌──────────┐
                      │  Item  │ │  │ Location │
                      └───┬────┘ │  └──────────┘
                          │      │
                    HAS_FEATURE  │ OCCURRED_DURING
                          │      │
                          ▼      ▼
                     ┌────────┐ ┌───────────┐
                     │Feature │ │ TimeEvent │
                     └────────┘ └───────────┘
```

### Example Graph Connection

A lost report can connect to a found report through multiple graph relationships:

```text
Lost Report
    │
    ├── DESCRIBES ──> Lost Item
    │                     │
    │                     └── HAS_FEATURE ──> Black
    │
    └── OCCURRED_AT ──> Vijayawada Railway Station
                              ▲
                              │
                         OCCURRED_AT
                              │
                         Found Report
                              │
                         DESCRIBES
                              │
                              ▼
                         Found Item
```

This graph structure allows LostLink to identify potential matches using relationships between locations, categories, item names, and shared item features.

---

## 4. Match Scoring

LostLink calculates a potential match score between a LOST report and FOUND reports.

| Matching Factor | Score |
|---|---:|
| Same location | 30 |
| Same category | 20 |
| Matching item name | 20 |
| Shared features | Up to 30 |
| **Maximum score** | **100** |

### Location

If the lost and found reports occurred at the same location:

```text
+30 points
```

### Category

If both items belong to the same category:

```text
+20 points
```

### Item Name

If the item names are identical or one item name contains the other:

```text
+20 points
```

### Shared Features

Shared features contribute up to 30 points:

```text
1 feature  → 6 points
2 features → 12 points
3 features → 18 points
4 features → 24 points
5+ features → 30 points
```

The final score is:

```text
Location Score
+ Category Score
+ Item Score
+ Feature Score
= Match Score
```

The application also explains why a match was found.

For example:

```text
WHY THIS MATCHED

✓ Same location       +30
✓ Same category       +20
✓ 3 shared features  +18

Total                  68
```

---

## 5. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- CORS
- dotenv

### Database

- CognoDB
- openCypher / Cypher
- Official Neo4j JavaScript driver

---

## 6. Project Structure

```text
lostlink/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── ...
│
├── server/
│   ├── db.js
│   ├── index.js
│   ├── seed.js
│   ├── setup.js
│   ├── schema.cypher
│   ├── queries.cypher
│   ├── fix-items.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

> The actual `server/.env` file is intentionally excluded from GitHub because it contains the private CognoDB password.

---

## 7. Backend API

The Express backend provides the following API endpoints.

### Health Check

```http
GET /api/health
```

Checks whether the backend can communicate with the graph database.

### Get Lost Reports

```http
GET /api/reports/lost
```

Returns all LOST reports.

### Create Lost Report

```http
POST /api/reports/lost
```

Creates a new lost report.

Example request:

```json
{
  "itemName": "Samsung Galaxy S24 Ultra",
  "category": "Smartphone",
  "description": "Black Samsung phone with transparent case",
  "location": "Vijayawada Railway Station",
  "date": "2026-08-11",
  "time": "19:30",
  "features": [
    "black",
    "samsung",
    "transparent case"
  ]
}
```

### Get Found Reports

```http
GET /api/reports/found
```

Returns all FOUND reports.

### Create Found Report

```http
POST /api/reports/found
```

Creates a new found report.

### Find Potential Matches

```http
GET /api/reports/:reportId/matches
```

Compares a LOST report with FOUND reports using graph relationships and match scoring.

Example:

```text
GET /api/reports/R001/matches
```

### Get Connection Details

```http
GET /api/reports/:reportId/connection
```

Returns the graph connections associated with a report.

---

## 8. Main Cypher Queries

The project includes the main Cypher queries in:

```text
server/queries.cypher
```

### Query 1 — Find Lost Reports

This query finds all LOST reports and follows the relationship:

```text
Report → Item
```

It returns the report ID, item, category, date, and time.

### Query 2 — Find Reports Through the Same Location

This is a multi-hop graph traversal.

It follows:

```text
Lost Report
     ↓ OCCURRED_AT
Location
     ↑ OCCURRED_AT
Found Report
```

This allows LostLink to find FOUND reports associated with the same location as a LOST report.

### Query 3 — Graph-Based Potential Matching

This query combines:

```text
Report → Location
Report → Item → Feature
```

It identifies FOUND reports that share a location and item features with a LOST report.

This type of relationship traversal is a natural fit for a graph database because the query crosses multiple connected entities.

### Query 4 — Item Feature Traversal

This query follows:

```text
Report → Item → Feature
```

to retrieve all features associated with an item's report.

### Query 5 — Activity Around a Location

This query finds reports occurring at a specific location and follows:

```text
Location → Report → Item
```

It returns the reports and items associated with that location.

---

## 9. Database Schema

LostLink uses unique identifiers for its graph entities.

The schema is stored in:

```text
server/schema.cypher
```

Example constraints include:

```cypher
CREATE CONSTRAINT FOR (p:Person)
REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT FOR (i:Item)
REQUIRE i.id IS UNIQUE;

CREATE CONSTRAINT FOR (r:Report)
REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT FOR (l:Location)
REQUIRE l.id IS UNIQUE;

CREATE CONSTRAINT FOR (t:TimeEvent)
REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT FOR (f:Feature)
REQUIRE f.id IS UNIQUE;
```

These constraints prevent duplicate identifiers.

---

## 10. Seed Data

Realistic sample data is loaded using:

```text
server/seed.js
```

The seed data contains:

- People
- Locations
- Features
- Items
- LOST reports
- FOUND reports
- Time events

The seed data includes related LOST and FOUND reports so the graph matching functionality can be demonstrated.

Run:

```bash
node seed.js
```

A successful seed operation prints:

```text
LostLink seed data loaded successfully.
```

---

## 11. CognoDB Cloud Setup

LostLink uses CognoDB as the graph database layer.

### Create a CognoDB Account

Create an account through the CognoDB Cloud console.

Create a free C0 instance and select a region.

### Save the Connection Details

CognoDB provides a Bolt connection URI similar to:

```text
bolt+s://<instance-id>.databases.cognodb.com
```

The username is:

```text
cognodb
```

The generated password should be stored securely and never committed to GitHub.

### Environment Variables

Create the following file locally:

```text
server/.env
```

Example:

```env
NEO4J_URI=bolt+s://<instance-id>.databases.cognodb.com
NEO4J_USERNAME=cognodb
NEO4J_PASSWORD=your_password
PORT=5000
```

> Never upload `server/.env` to GitHub. The real password must remain private.

---

## 12. Local Development Setup

### Backend

Open a terminal in:

```text
lostlink/server
```

Install dependencies:

```bash
npm install
```

Then configure:

```text
server/.env
```

Run the database schema setup:

```bash
node setup.js
```

Load the seed data:

```bash
node seed.js
```

Start the backend:

```bash
node index.js
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend

Open another terminal in:

```text
lostlink/client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server will provide a local URL, normally:

```text
http://localhost:5173
```

Open that address in a browser.

---

## 13. Application Workflow

The LostLink workflow is:

```text
User
 |
 +--> Report Lost Item
 |        |
 |        v
 |    React Frontend
 |        |
 |        v
 |    Express API
 |        |
 |        v
 |    Graph Database
 |
 +--> Report Found Item
 |
 +--> Find Potential Match
          |
          v
      Lost Report
          |
          v
     Graph Traversal
          |
          v
      Found Reports
          |
          v
      Match Scoring
          |
          v
     Potential Matches
```

---

## 14. Frontend Features

The web application provides:

- Recently lost reports
- Recently found reports
- Lost item reporting
- Found item reporting
- Graph-based potential matching
- Match score display
- Match explanations
- Shared feature display
- Location information
- Date and time information
- Loading states
- Empty states
- Error states

---

## 15. Parameterized Queries

The backend uses the official Neo4j JavaScript driver and parameterized queries.

For example:

```javascript
await runQuery(
  `
    MATCH (lost:Report {id: $reportId})
    RETURN lost
  `,
  { reportId }
);
```

User-controlled values are passed as parameters rather than being concatenated directly into Cypher strings.

This helps keep the database interaction safer and cleaner.

---

## 16. Error Handling

The backend handles database failures and returns appropriate HTTP error responses.

For example, if the database is unavailable, the health endpoint returns a service-unavailable response rather than crashing the application.

The frontend also provides an error state when it cannot connect to the backend.

---

## 17. Screenshots

Screenshots of the working LostLink application will be added here before final submission.

### Main Application

*Add screenshot here.*

### Lost Report Form

*Add screenshot here.*

### Graph Match Results

*Add screenshot here.*

### Found Report

*Add screenshot here.*
## 18. Future Improvements

Possible future improvements include:

- User authentication
- Owner verification
- Image-based item matching
- Improved natural-language similarity
- Distance-based location matching
- Time-proximity scoring
- Notifications for potential matches
- Report verification
- Claim verification
- Administrative moderation
- More advanced graph-based recommendation algorithms

---

## 19. Conclusion

LostLink demonstrates how a graph database can solve a relationship-heavy Lost and Found problem.

By representing reports, people, items, locations, features, and time events as connected graph entities, the application can traverse relationships across multiple nodes and identify potential connections between lost and found items.

The graph model makes the matching process explainable because users can see which relationships contributed to a potential match.

## Screenshots

### LostLink Homepage
![LostLink Homepage](docs/screenshots/LostLink%20homepage.png)

### Lost Item Report
![Lost Item Form](docs/screenshots/Lost%20Item%20form.png)

### Found Item Report
![Found Item Form](docs/screenshots/Found%20Item%20form.png)

### Potential Matches
![Potential Matches](docs/screenshots/Potential%20Matches%20.png)
