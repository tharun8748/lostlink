import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    box: (
      <svg {...common}>
        <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
        <path d="m3.3 7.7 8.7 5 8.7-5" />
        <path d="M12 22V12.7" />
      </svg>
    ),

    mapPin: (
      <svg {...common}>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),

    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),

    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),

    arrow: (
      <svg {...common}>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),

    x: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    refresh: (
      <svg {...common}>
        <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function formatDate(date) {
  if (!date) return "Unknown date";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeFeatures(value) {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((feature) => String(feature).trim())
      .filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function App() {
  const [lostReports, setLostReports] = useState([]);
  const [foundReports, setFoundReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("LOST");

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [matches, setMatches] = useState([]);

  const [form, setForm] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    date: "",
    time: "",
    features: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [lostResponse, foundResponse] = await Promise.all([
        fetch(`${API_BASE}/reports/lost`),
        fetch(`${API_BASE}/reports/found`),
      ]);

      if (!lostResponse.ok || !foundResponse.ok) {
        throw new Error("Unable to load reports");
      }

      const lostData = await lostResponse.json();
      const foundData = await foundResponse.json();

      setLostReports(Array.isArray(lostData) ? lostData : []);
      setFoundReports(Array.isArray(foundData) ? foundData : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(
        "Unable to connect to LostLink. Make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function openReportModal(type = "LOST") {
    setReportType(type);

    setForm({
      itemName: "",
      category: "",
      description: "",
      location: "",
      date: "",
      time: "",
      features: "",
    });

    setFormError("");
    setFormSuccess("");
    setReportModalOpen(true);
  }

  function closeReportModal() {
    if (submitting) return;

    setReportModalOpen(false);
    setFormError("");
    setFormSuccess("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function submitReport(event) {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (
      !form.itemName.trim() ||
      !form.category.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.date ||
      !form.time
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const endpoint =
        reportType === "FOUND"
          ? `${API_BASE}/reports/found`
          : `${API_BASE}/reports/lost`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemName: form.itemName.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          date: form.date,
          time: form.time,
          features: normalizeFeatures(form.features),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit report");
      }

      setFormSuccess(
        `${reportType === "FOUND" ? "Found" : "Lost"} report submitted successfully.`
      );

      await loadReports();

      setTimeout(() => {
        setReportModalOpen(false);
        setFormSuccess("");
      }, 900);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setFormError(err.message || "Unable to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  async function findPotentialMatches(report) {
    if (!report?.reportId) return;

    setSelectedReport(report);
    setMatchModalOpen(true);
    setMatchLoading(true);
    setMatchError("");
    setMatches([]);

    try {
      const response = await fetch(
        `${API_BASE}/reports/${encodeURIComponent(
          report.reportId
        )}/matches`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to find matches");
      }

      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to find matches:", err);
      setMatchError(
        err.message || "Unable to find potential matches."
      );
    } finally {
      setMatchLoading(false);
    }
  }

  function closeMatchModal() {
    setMatchModalOpen(false);
    setSelectedReport(null);
    setMatches([]);
    setMatchError("");
  }

  function getMatchLabel(score) {
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Possible Match";
    return "Weak Match";
  }

  function getScoreWidth(score) {
    return `${Math.max(0, Math.min(100, Number(score) || 0))}%`;
  }

  function renderReportCard(report, type) {
    const features = normalizeFeatures(report.features);

    return (
      <article className="report-card" key={report.reportId}>
        <div className="card-top">
          <span className="lost-badge">
            {type === "FOUND" ? "FOUND" : "LOST"}
          </span>

          <span className="report-id">
            {report.reportId || "—"}
          </span>
        </div>

        <div className="item-icon">
          <Icon name="box" size={25} />
        </div>

        <h3>{report.item || "Unnamed item"}</h3>

        <p className="category">
          {report.category || "Uncategorized"}
        </p>

        <p className="description">
          {report.description || "No description provided."}
        </p>

        <div className="metadata">
          <div>
            <Icon name="mapPin" size={14} />
            <span>
              {report.location || "Unknown location"}
            </span>
          </div>

          <div>
            <Icon name="clock" size={14} />
            <span>
              {formatDate(report.date)}
              {report.time ? ` · ${report.time}` : ""}
            </span>
          </div>

          {features.length > 0 && (
            <div>
              <Icon name="search" size={14} />
              <span>
                {features.length} feature
                {features.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        {type === "LOST" && (
          <button
            className="match-button"
            onClick={() => findPotentialMatches(report)}
          >
            Find potential matches
            <Icon name="arrow" size={16} />
          </button>
        )}
      </article>
    );
  }

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Icon name="box" size={23} />
          </div>

          <div>
            <h2>LostLink</h2>
            <span>Graph-powered lost & found</span>
          </div>
        </div>

        <button
          className="report-button"
          onClick={() => openReportModal("LOST")}
        >
          <Icon name="plus" size={16} />
          Report an item
        </button>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            GRAPH MATCHING ACTIVE
          </div>

          <h1>
            Lost something?
            <br />
            <span>Let's find the connection.</span>
          </h1>

          <p>
            LostLink connects lost and found reports using Neo4j
            graph relationships. Compare locations, categories,
            item names, and shared features to discover potential
            matches.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => openReportModal("LOST")}
            >
              <Icon name="plus" size={17} />
              Report Lost Item
            </button>

            <button
              className="secondary-button"
              onClick={() => openReportModal("FOUND")}
            >
              <Icon name="box" size={17} />
              Report Found Item
            </button>
          </div>
        </div>
      </section>

      {/* RECENTLY LOST */}
      <section className="reports-section">
        <div className="section-heading">
          <div>
            <span className="section-label">LOST REPORTS</span>
            <h2>Recently Lost</h2>
            <p>Find potential connections for lost items.</p>
          </div>

          <span className="report-count">
            {lostReports.length} report
            {lostReports.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="state-card">
            <div className="spinner" />
            <h3>Loading reports</h3>
            <p>Connecting to the LostLink graph...</p>
          </div>
        ) : error ? (
          <div className="state-card error-state">
            <h3>Unable to load reports</h3>
            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadReports}
              style={{ marginTop: "18px" }}
            >
              <Icon name="refresh" size={16} />
              Try again
            </button>
          </div>
        ) : lostReports.length === 0 ? (
          <div className="state-card">
            <Icon name="search" size={30} />
            <h3>No lost reports yet</h3>
            <p>Be the first to report a lost item.</p>
          </div>
        ) : (
          <div className="reports-grid">
            {lostReports.map((report) =>
              renderReportCard(report, "LOST")
            )}
          </div>
        )}
      </section>

      {/* RECENTLY FOUND */}
      <section className="reports-section">
        <div className="section-heading">
          <div>
            <span className="section-label">FOUND REPORTS</span>
            <h2>Recently Found</h2>
            <p>Items that have been reported as found.</p>
          </div>

          <span className="report-count">
            {foundReports.length} report
            {foundReports.length === 1 ? "" : "s"}
          </span>
        </div>

        {!loading && !error && foundReports.length === 0 ? (
          <div className="state-card">
            <Icon name="box" size={30} />
            <h3>No found reports yet</h3>
            <p>Found an item? Submit a found report.</p>
          </div>
        ) : !loading && !error ? (
          <div className="reports-grid">
            {foundReports.map((report) =>
              renderReportCard(report, "FOUND")
            )}
          </div>
        ) : null}
      </section>

      {/* FOOTER */}
      <footer>
        LostLink · Graph-powered lost and found · Neo4j
      </footer>

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReportModal();
            }
          }}
        >
          <div className="report-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">
                  {reportType === "FOUND"
                    ? "FOUND REPORT"
                    : "LOST REPORT"}
                </span>

                <h2>
                  {reportType === "FOUND"
                    ? "Submit Found Report"
                    : "Report Lost Item"}
                </h2>

                <p>
                  Add the item details so LostLink can connect
                  the report through the graph.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeReportModal}
                disabled={submitting}
                aria-label="Close"
              >
                <Icon name="x" size={21} />
              </button>
            </div>

            <form
              className="report-form"
              onSubmit={submitReport}
            >
              <label>
                Item name
                <input
                  name="itemName"
                  value={form.itemName}
                  onChange={handleInputChange}
                  placeholder="e.g. Samsung Galaxy S24 Ultra"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Smartphone"
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Vijayawada Railway Station"
                    required
                  />
                </label>
              </div>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Describe the item and where/how it was lost or found..."
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  Date
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    required
                  />
                </label>

                <label>
                  Time
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              <label>
                Features
                <input
                  name="features"
                  value={form.features}
                  onChange={handleInputChange}
                  placeholder="e.g. black, samsung, leather"
                />
                <span className="field-hint">
                  Separate multiple features with commas.
                </span>
              </label>

              {formError && (
                <div className="form-message error-message">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="form-message success-message">
                  <Icon name="check" size={17} />
                  {formSuccess}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeReportModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={17} />
                      Submit{" "}
                      {reportType === "FOUND"
                        ? "Found"
                        : "Lost"}{" "}
                      Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATCH MODAL */}
      {matchModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMatchModal();
            }
          }}
        >
          <div className="report-modal">
            <div className="modal-header">
              <div>
                <span className="section-label">
                  GRAPH MATCHING
                </span>

                <h2>Potential Matches</h2>

                <p>
                  Matches for{" "}
                  <strong>
                    {selectedReport?.item || "your item"}
                  </strong>
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeMatchModal}
                aria-label="Close"
              >
                <Icon name="x" size={21} />
              </button>
            </div>

            {matchLoading ? (
              <div className="state-card">
                <div className="spinner" />
                <h3>Analyzing graph connections</h3>
                <p>
                  Comparing location, category, item name,
                  and shared features...
                </p>
              </div>
            ) : matchError ? (
              <div className="state-card error-state">
                <h3>Unable to find matches</h3>
                <p>{matchError}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="state-card">
                <Icon name="search" size={30} />
                <h3>No potential matches</h3>
                <p>
                  No connected found reports were identified
                  by the current graph matching rules.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {matches.map((match) => {
                  const score = Number(match.matchScore) || 0;

                  const sharedFeatures =
                    normalizeFeatures(match.sharedFeatures);

                  const reasons = Array.isArray(
                    match.matchReasons
                  )
                    ? match.matchReasons
                    : [];

                  return (
                    <div
                      key={match.matchedReport}
                      className="report-card"
                      style={{
                        minHeight: "auto",
                        padding: "20px",
                      }}
                    >
                      <div className="card-top">
                        <span className="lost-badge">
                          FOUND
                        </span>

                        <span className="report-id">
                          {match.matchedReport}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "16px",
                          padding: "16px",
                          border:
                            "1px solid rgba(99, 230, 213, 0.18)",
                          borderRadius: "14px",
                          background:
                            "rgba(99, 230, 213, 0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#7f8997",
                                fontSize: "11px",
                                letterSpacing: "1px",
                                fontWeight: "800",
                              }}
                            >
                              GRAPH MATCH SCORE
                            </div>

                            <div
                              style={{
                                marginTop: "6px",
                                fontSize: "30px",
                                fontWeight: "900",
                                color: "#63e6d5",
                              }}
                            >
                              {score}
                              <span
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "6px",
                                  color: "#7f8997",
                                }}
                              >
                                points
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              padding: "8px 12px",
                              border:
                                "1px solid rgba(99, 230, 213, 0.2)",
                              borderRadius: "999px",
                              color: "#63e6d5",
                              fontSize: "11px",
                              fontWeight: "800",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {getMatchLabel(score)}
                          </span>
                        </div>

                        <div
                          style={{
                            height: "6px",
                            marginTop: "14px",
                            borderRadius: "999px",
                            background:
                              "rgba(255,255,255,0.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: getScoreWidth(score),
                              height: "100%",
                              borderRadius: "999px",
                              background: "#63e6d5",
                            }}
                          />
                        </div>
                      </div>

                      <div className="item-icon">
                        <Icon name="box" size={25} />
                      </div>

                      <h3>{match.item}</h3>

                      <p className="category">
                        {match.category}
                      </p>

                      <p className="description">
                        {match.description}
                      </p>

                      <div className="metadata">
                        <div>
                          <Icon name="mapPin" size={14} />
                          <span>
                            {match.location ||
                              "Unknown location"}
                          </span>
                        </div>

                        <div>
                          <Icon name="clock" size={14} />
                          <span>
                            {formatDate(match.date)}
                            {match.time
                              ? ` · ${match.time}`
                              : ""}
                          </span>
                        </div>

                        <div>
                          <Icon name="search" size={14} />
                          <span>
                            {sharedFeatures.length} shared
                            feature
                            {sharedFeatures.length === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>
                      </div>

                      {reasons.length > 0 && (
                        <div
                          style={{
                            marginTop: "18px",
                            padding: "16px",
                            border:
                              "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "14px",
                            background:
                              "rgba(255,255,255,0.025)",
                          }}
                        >
                          <div
                            style={{
                              color: "#7f8997",
                              fontSize: "11px",
                              letterSpacing: "1px",
                              fontWeight: "800",
                              marginBottom: "10px",
                            }}
                          >
                            WHY THIS MATCHED
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            {reasons.map((reason, index) => (
                              <div
                                key={`${reason.type}-${index}`}
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  borderRadius: "9px",
                                  background:
                                    "rgba(255,255,255,0.025)",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#c8d0d9",
                                    fontSize: "12px",
                                  }}
                                >
                                  ✓ {reason.label}
                                </span>

                                <span
                                  style={{
                                    color: "#63e6d5",
                                    fontSize: "12px",
                                    fontWeight: "800",
                                  }}
                                >
                                  +{reason.score}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sharedFeatures.length > 0 && (
                        <div
                          style={{
                            marginTop: "14px",
                          }}
                        >
                          <div
                            style={{
                              color: "#7f8997",
                              fontSize: "10px",
                              letterSpacing: "1px",
                              fontWeight: "800",
                              marginBottom: "8px",
                            }}
                          >
                            SHARED FEATURES
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "7px",
                            }}
                          >
                            {sharedFeatures.map((feature) => (
                              <span
                                key={feature}
                                style={{
                                  padding: "5px 9px",
                                  border:
                                    "1px solid rgba(99,230,213,0.18)",
                                  borderRadius: "999px",
                                  background:
                                    "rgba(99,230,213,0.05)",
                                  color: "#63e6d5",
                                  fontSize: "11px",
                                }}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;