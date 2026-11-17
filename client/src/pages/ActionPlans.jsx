
import React, { useEffect, useMemo, useState } from "react";
import { getRecommendations } from "../services/recommendationApi";
import "../styles/ActionPlans.css";

import {
  MdLightbulb,
  MdQueryStats,
  MdArrowBack,
  MdChevronLeft,
  MdChevronRight,
  MdCalendarMonth,
  MdOutlineInfo,
} from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { getDailyAnalysis } from "../services/dailyAnalysisApi";

const energyTips = [
  {
    icon: <MdLightbulb />,
    title: "Use Lighting Efficiently",
    description:
      "Avoid unnecessary lighting when areas are not in use.",
  },
  {
    icon: <MdQueryStats />,
    title: "Monitor Daily Usage",
    description:
      "Compare daily readings to identify unusual changes.",
  },
];

const ITEMS_PER_PAGE = 5;

const priorityOrder = {
  high: 3,
  medium: 2,
  low: 1,
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function ActionPlans() {
  const navigate = useNavigate();

  const [recommendationData, setRecommendationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [dailyAnalysis, setDailyAnalysis] = useState({});
  const [dailyAnalysisLoading, setDailyAnalysisLoading] = useState(true); 

  const [selectedHistoryFloor, setSelectedHistoryFloor] = useState(1);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const historyDays = (dailyAnalysis[`floor_${selectedHistoryFloor}`] || [])
  .filter((day) => day.status !== "partial")
  .sort((a, b) => b.usage_date.localeCompare(a.usage_date));

  const displayedHistory = showAllHistory
  ? historyDays
  : historyDays.slice(0, 5);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecommendations();
        setRecommendationData(data);
      } catch (err) {
        setError("Unable to load energy recommendations.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    const fetchDailyAnalysis = async () => {
      try {
        const data = await getDailyAnalysis();
        setDailyAnalysis(data);
      } catch (error) {
        console.error("Failed to fetch daily analysis:", error);
      } finally {
        setDailyAnalysisLoading(false);
      }
    };
  
    fetchDailyAnalysis();
  }, []);

  // Collect recommendations from both floors
  const recommendations = useMemo(() => {
    return Object.values(recommendationData).flatMap(
      (floorData) => floorData.recommendations || []
    );
  }, [recommendationData]);

  
  // If dates are equal, High priority comes first.
  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return (
        (priorityOrder[b.severity] || 0) -
        (priorityOrder[a.severity] || 0)
      );
    });
  }, [recommendations]);

  // Filter recommendations by priority
  const filteredRecommendations = useMemo(() => {
    if (activeFilter === "all") {
      return sortedRecommendations;
    }

    return sortedRecommendations.filter(
      (item) => item.severity === activeFilter
    );
  }, [sortedRecommendations, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(
    filteredRecommendations.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const currentRecommendations = filteredRecommendations.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const priorityLabel = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  const floorCount = Object.keys(recommendationData).length;

  const highCount = recommendations.filter(
    (item) => item.severity === "high"
  ).length;

  const mediumCount = recommendations.filter(
    (item) => item.severity === "medium"
  ).length;

  const lowCount = recommendations.filter(
    (item) => item.severity === "low"
  ).length;

  return (
    <div className="action-plans-page">

      
      <button
        className="back-dashboard-btn"
        onClick={() => navigate("/")}
      >
        <MdArrowBack />
        Back to Dashboard
      </button>

      
      <div className="action-plans-header">
        <div>
            <h1>Action Plans</h1>
            <p>AI-powered energy insights and recommendations</p>
        </div>

        <div className="ai-label">
            <span className="ai-sparkle">✦</span>
            AI Analysis
        </div>
      </div>

      
      <section className="action-kpi-grid">

        <div className="action-kpi-card">
          <p>Floors Analyzed</p>
          <h2>{loading ? "--" : floorCount}</h2>
          <span>Floor 1 and Floor 2</span>
        </div>

        <div className="action-kpi-card">
          <p>Total Recommendations</p>
          <h2>{loading ? "--" : recommendations.length}</h2>
          <span>Detected energy issues</span>
        </div>

        <div className="action-kpi-card">
          <p>High Priority</p>
          <h2 className="high-kpi">
            {loading ? "--" : highCount}
          </h2>
          <span>Require closer attention</span>
        </div>

        <div className="action-kpi-card">
          <p>Other Priorities</p>
          <h2>
            {loading ? "--" : mediumCount + lowCount}
          </h2>
          <span>Medium and low priority</span>
        </div>

      </section>

      
      <section className="action-panel">

        <div className="panel-heading">
          <div>
            <h2>Campus Energy Overview</h2>
            <p>
              Latest completed daily analysis condition by floor
            </p>
          </div>
        </div>

        <div className="campus-overview">

          
          {[1, 2].map((floorNumber) => {
            const floorDays = dailyAnalysis[`floor_${floorNumber}`] || [];

            // Ignore today's partial analysis.
            const completedDays = floorDays
                .filter((day) => day.status !== "partial")
                .sort((a, b) =>
                b.usage_date.localeCompare(a.usage_date)
                );

            const latestDay = completedDays[0];

            const statusLabels = {
                normal: "Normal",
                anomaly: "Anomaly Detected",
                data_quality_issue: "Data Quality Issue",
                insufficient_data: "Insufficient Data"
            };

            return (
                <div className="floor-row" key={floorNumber}>
                <div className="floor-info">
                    <h3>Floor {floorNumber}</h3>

                    {dailyAnalysisLoading ? (
                    <p>Loading daily analysis...</p>
                    ) : latestDay ? (
                    <p>
                        Latest completed analysis:{" "}
                        {latestDay.usage_date}
                    </p>
                    ) : (
                    <p>No completed daily analysis available.</p>
                    )}
                </div>

                <span
                    className={`floor-status ${
                    latestDay ? latestDay.status : "unavailable"
                    }`}
                >
                    <span className="status-dot" />

                    {dailyAnalysisLoading
                    ? "Loading..."
                    : latestDay
                        ? statusLabels[latestDay.status] || latestDay.status
                        : "Awaiting Analysis"}
                </span>
                </div>
            );
          })}

        </div>

      </section>

      
      <section className="action-panel">

        <div className="panel-heading">
          <div>
            <h2>AI Recommended Actions</h2>
            <p>
              Review detected energy issues and suggested actions
            </p>
          </div>

          <span className="suggestion-count">
            {recommendations.length} Recommendations
          </span>
        </div>

        
        <div className="recommendation-priority-summary">
          <span className="priority-summary-item high">
            {highCount} High
          </span>

          <span className="priority-summary-item medium">
            {mediumCount} Medium
          </span>

          <span className="priority-summary-item low">
            {lowCount} Low
          </span>
        </div>

        
        <div className="recommendation-filters">

          {[
            { label: "All", value: "all" },
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ].map((filter) => (
            <button
              key={filter.value}
              className={`recommendation-filter ${
                activeFilter === filter.value ? "active" : ""
              }`}
              onClick={() => handleFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}

        </div>

        <div className="recommendation-sort-label">
          <span>Newest detection first</span>
          <span>5 recommendations per page</span>
        </div>

        
        <div className="recommendation-list">

          {loading ? (
            <p className="recommendation-message">
              Loading energy recommendations...
            </p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredRecommendations.length === 0 ? (
            <p className="recommendation-message">
              No recommendations found for this filter.
            </p>
          ) : (
            currentRecommendations.map((item, index) => (

              <article
                className={`recommendation-card ${
                  item.severity === "high" ? "high-card" : ""
                }`}
                key={`${item.recommendation_type}-${item.floor_number}-${item.date}`}
              >

                <div className="recommendation-top">

                  <div className="recommendation-title">

                    <span className="recommendation-floor">
                      Floor {item.floor_number}
                    </span>

                    <h3>{item.title}</h3>

                  </div>

                  <span
                    className={`priority-badge ${item.severity}`}
                  >
                    {priorityLabel[item.severity] ||
                      "Review Suggested"}
                  </span>

                </div>

                <p className="recommendation-description">
                  {item.summary}
                </p>

                <div className="recommendation-footer">

                  <p className="recommendation-date">
                    <MdCalendarMonth />
                    {formatDate(item.date)}
                  </p>

                </div>

                <details className="recommendation-details">
                    <summary>View Details</summary>

                    <div className="recommendation-detail-content">

                        
                        <div className="detail-section">
                            <h4>What happened?</h4>
                            <p>
                                {item.summary || "No explanation available."}
                            </p>
                        </div>

                        
                        <div className="detail-section">
                            <h4>Details</h4>

                            {item.evidence?.events?.length > 0 ? (
                                (() => {
                                    const event = item.evidence.events[0];

                                    return (
                                        <div className="reading-comparison">
                                            <div>
                                                <span>Previous reading</span>
                                                <strong>
                                                    {Number(event.previous_reading).toFixed(4)} kWh
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Current reading</span>
                                                <strong>
                                                    {Number(event.current_reading).toFixed(4)} kWh
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Decrease</span>
                                                <strong className="decrease-value">
                                                    {Math.abs(Number(event.energy_change_kwh)).toFixed(4)} kWh
                                                </strong>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p>No additional details available.</p>
                            )}
                        </div>

                        
                        <div className="detail-section">
                            <h4>What should I do?</h4>
                            <p>
                                {item.recommended_action ||
                                    "No recommended action available."}
                            </p>
                        </div>

                    </div>
                </details>

              </article>

            ))
          )}

        </div>

        
        {!loading && !error && totalPages > 1 && (
          <div className="recommendation-pagination">

            <span>
              Showing {startIndex + 1}–
              {Math.min(
                startIndex + ITEMS_PER_PAGE,
                filteredRecommendations.length
              )}{" "}
              of {filteredRecommendations.length} recommendations
            </span>

            <div className="pagination-controls">

              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <MdChevronLeft />
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <MdChevronRight />
              </button>

            </div>

          </div>
        )}

      </section>

      
        <section className="action-panel">

        <div className="panel-heading">
        <div>
            <h2>Daily Analysis History</h2>
            <p>
            Review previous daily analysis results for each floor
            </p>
        </div>

        <div className="history-floor-selector">
            <button
            className={selectedHistoryFloor === 1 ? "active" : ""}
            onClick={() => {
                setSelectedHistoryFloor(1);
                setShowAllHistory(false);
            }}
            >
            Floor 1
            </button>

            <button
            className={selectedHistoryFloor === 2 ? "active" : ""}
            onClick={() => {
                setSelectedHistoryFloor(2);
                setShowAllHistory(false);
            }}
            >
            Floor 2
            </button>
        </div>
        </div>

        {dailyAnalysisLoading ? (
        <div className="analysis-history-empty">
            <p>Loading analysis history...</p>
        </div>
        ) : (
        <>
            <div className="history-summary">

            <div className="history-summary-item">
                <h3>{historyDays.length}</h3>
                <p>Completed Days</p>
            </div>

            <div className="history-summary-item">
                <h3>
                {historyDays.filter(day => day.status === "normal").length}
                </h3>
                <p>Normal Days</p>
            </div>

            <div className="history-summary-item">
                <h3>
                {historyDays.filter(day => day.status === "anomaly").length}
                </h3>
                <p>Anomaly Days</p>
            </div>

            <div className="history-summary-item">
                <h3>
                {historyDays.filter(day => day.status === "data_quality_issue").length}
                </h3>
                <p>Data Issues</p>
            </div>

            </div>

            <div className="history-table-wrapper">
            <table className="history-table">
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Energy Usage</th>
                    <th>Readings</th>
                    <th>Status</th>
                </tr>
                </thead>

                <tbody>
                {displayedHistory.length > 0 ? (
                    displayedHistory.map(day => (
                    <tr key={day.usage_date}>
                        <td>{formatDate(day.usage_date)}</td>
                        <td>
                        {Number(day.daily_energy_kwh).toFixed(4)} kWh
                        </td>
                        <td>{day.reading_count.toLocaleString()}</td>
                        <td>
                        <span className={`history-status ${day.status}`}>
                            {day.status === "normal"
                            ? "Normal"
                            : day.status === "anomaly"
                                ? "Anomaly"
                                : day.status === "data_quality_issue"
                                ? "Data Quality Issue"
                                : "Insufficient Data"}
                        </span>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="4">
                        No completed analysis history available.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>

            {historyDays.length > 5 && (
            <button
                className="history-view-more"
                onClick={() => setShowAllHistory(!showAllHistory)}
            >
                {showAllHistory ? "Show Less" : "View All History"}
            </button>
            )}

        </>
        )}

        </section>


      
      <section className="action-panel">

        <div className="panel-heading">
          <div>
            <h2>Energy-Saving Tips</h2>
            <p>
              Simple ways to improve campus energy efficiency
            </p>
          </div>
        </div>

        <div className="energy-tips-list">

          {energyTips.map((tip) => (
            <div className="energy-tip-row" key={tip.title}>

              <span className="tip-icon">
                {tip.icon}
              </span>

              <div className="tip-content">
                <h3>{tip.title}</h3>
                <p>{tip.description}</p>
              </div>

            </div>
          ))}

        </div>

      </section>

    </div>
  );
}

export default ActionPlans;
