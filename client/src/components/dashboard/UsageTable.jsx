
import { useEffect, useMemo, useState } from "react";
import { getMonthlyUsage } from "../../services/dashboardApi";
import "../../styles/usage-table.css";

function UsageTable({ selectedYear }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load historical usage records
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMonthlyUsage();
        setRecords(data);
      } catch (err) {
        console.error("Failed to load usage records:", err);
        setError("Failed to load electricity usage records.");
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  // Format PostgreSQL dates using Cambodia's UTC+7 timezone
  const formatDate = (date) => {
    if (!date) return "-";

    const [year, month, day] = String(date)
      .split("T")[0]
      .split("-")
      .map(Number);

    const localDate = new Date(year, month - 1, day + 1);

    const formattedDay = String(localDate.getDate()).padStart(2, "0");
    const formattedMonth = String(localDate.getMonth() + 1).padStart(2, "0");
    const formattedYear = localDate.getFullYear();

    return `${formattedDay}-${formattedMonth}-${formattedYear}`;
  };

  // Format numbers
  const formatNumber = (value) => {
    return Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter historical records by year and search
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        // Only show actual historical records
        const isActual =
          String(record.status).toLowerCase() === "actual";

        // Match selected year using the month field (e.g. Jan-26)
        const recordYear = record.month?.split("-")[1];
        const matchesYear =
          recordYear === String(selectedYear).slice(-2);

        // Search by year, month, or date
        const searchText = search.toLowerCase().trim();
        const searchableYear = `20${recordYear}`;

        const searchableText = [
          record.month,
          searchableYear,
          record.period_start,
          record.period_end,
          formatDate(record.period_start),
          formatDate(record.period_end),
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !searchText || searchableText.includes(searchText);

        return isActual && matchesYear && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(a.period_start) - new Date(b.period_start)
      );
  }, [records, selectedYear, search]);

  return (
    <div className="usage-table-container">
      <div className="usage-record-toolbar">
        <h3>Monthly Electricity Records</h3>

        <div className="usage-search">
            <input
            type="text"
            placeholder="Search by year, month, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <span>{filteredRecords.length} records</span>
      </div>

      {loading ? (
        <p className="usage-message">Loading usage records...</p>
      ) : error ? (
        <p className="usage-error">{error}</p>
      ) : filteredRecords.length === 0 ? (
        <p className="usage-message">
          No historical records found.
        </p>
      ) : (
        <div className="usage-table-scroll">
          <table className="usage-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>No. of Days</th>
                <th>Previous kWh</th>
                <th>Current kWh</th>
                <th>Total (kWh)</th>
                <th>Cost (USD)</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={`${record.month}-${index}`}>
                  <td>{record.month}</td>
                  <td>{formatDate(record.period_start)}</td>
                  <td>{formatDate(record.period_end)}</td>
                  <td>{record.no_of_days}</td>
                  <td>{formatNumber(record.previous_kwh)}</td>
                  <td>{formatNumber(record.current_kwh)}</td>
                  <td>{formatNumber(record.total_kwh)}</td>
                  <td>${formatNumber(record.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="usage-table-footer">
          <span>
            Showing {filteredRecords.length > 0 ? 1 : 0} to{" "}
            {filteredRecords.length} of {filteredRecords.length} records
          </span>
        </div>
      )}
    </div>
  );
}

export default UsageTable;
