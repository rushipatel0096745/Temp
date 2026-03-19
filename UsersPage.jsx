import { useState, useEffect, useCallback } from "react";

// ─── Cookie Helpers ───────────────────────────────────────────────────────────
const COOKIE_KEY = "company_user_filters";
const COOKIE_EXPIRY_DAYS = 7;

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch {
      return [];
    }
  }
  return [];
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    JSON.stringify(value)
  )}; expires=${expires}; path=/`;
}

function removeCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

// ─── Mock API (replace with real fetch calls) ─────────────────────────────────
async function fetchTableColumns() {
  // Replace with: return fetch('/api/table-columns?table=users').then(r => r.json())
  return {
    has_error: false,
    message: "Table Fetched Columns Successfully.",
    table: "users",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "firstname", type: "VARCHAR" },
      { name: "lastname", type: "VARCHAR" },
      { name: "email", type: "VARCHAR" },
      { name: "password", type: "VARCHAR" },
      { name: "last_logged_in", type: "DATETIME" },
      { name: "role_id", type: "INTEGER" },
    ],
    conditions: {
      Equals: "equals",
      "Not Equals": "not_equals",
      Contains: "contains",
      "Greater Than": "gt",
      "Greater Than or Equal To": "gte",
      "Less Than": "lt",
      "Less Than or Equal To": "lte",
      In: "in",
      Between: "between",
      "Is Null": "is_null",
      "Is Not Null": "is_not_null",
    },
  };
}

async function fetchUsers(payload) {
  // Replace with: return fetch('/api/users', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }).then(r => r.json())
  console.log("API Payload:", payload);
  await new Promise((r) => setTimeout(r, 600));
  return {
    data: [
      { id: 4, firstname: "Alice", lastname: "Smith", email: "alice@corewix.com", last_logged_in: "2024-03-10T10:00:00", role_id: 1 },
      { id: 5, firstname: "Bob", lastname: "Jones", email: "bob@corewix.com", last_logged_in: "2024-03-12T14:30:00", role_id: 2 },
      { id: 6, firstname: "Carol", lastname: "White", email: "carol@corewix.com", last_logged_in: "2024-02-28T09:15:00", role_id: 1 },
    ],
    total: 3,
    page: 1,
    page_size: 20,
  };
}

// ─── Condition sets by type ───────────────────────────────────────────────────
const INTEGER_CONDITIONS = ["equals", "not_equals", "gt", "gte", "lt", "lte", "between", "in", "is_null", "is_not_null"];
const VARCHAR_CONDITIONS  = ["equals", "not_equals", "contains", "in", "is_null", "is_not_null"];
const DATETIME_CONDITIONS = ["equals", "between", "gt", "gte", "lt", "lte", "is_null", "is_not_null"];

function allowedConditions(colType, allConditions) {
  const keys = Object.entries(allConditions);
  let allowed;
  if (colType === "INTEGER") allowed = INTEGER_CONDITIONS;
  else if (colType === "DATETIME") allowed = DATETIME_CONDITIONS;
  else allowed = VARCHAR_CONDITIONS;
  return keys.filter(([, v]) => allowed.includes(v));
}

// ─── FilterField Component ────────────────────────────────────────────────────
function FilterField({ column, allConditions, filterState, onChange }) {
  const { name, type } = column;
  const label = name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const allowed = allowedConditions(type, allConditions);

  const current = filterState[name] || { condition: allowed[0]?.[1] || "", value: "", valueTo: "" };
  const noValue = ["is_null", "is_not_null"].includes(current.condition);
  const isBetween = current.condition === "between";

  function update(patch) {
    onChange(name, { ...current, ...patch });
  }

  return (
    <div style={styles.filterCard}>
      <div style={styles.filterLabel}>{label}</div>

      {/* Condition selector */}
      <select
        style={styles.select}
        value={current.condition}
        onChange={(e) => update({ condition: e.target.value, value: "", valueTo: "" })}
      >
        {allowed.map(([label, val]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>

      {/* Value input(s) */}
      {!noValue && (
        <>
          {type === "DATETIME" ? (
            <div style={styles.dateRow}>
              <div style={styles.dateGroup}>
                <span style={styles.dateLabel}>From</span>
                <input
                  type="date"
                  style={styles.input}
                  value={current.value}
                  onChange={(e) => update({ value: e.target.value })}
                />
              </div>
              {isBetween && (
                <div style={styles.dateGroup}>
                  <span style={styles.dateLabel}>To</span>
                  <input
                    type="date"
                    style={styles.input}
                    value={current.valueTo}
                    onChange={(e) => update({ valueTo: e.target.value })}
                  />
                </div>
              )}
            </div>
          ) : type === "INTEGER" ? (
            <div style={styles.dateRow}>
              <input
                type="number"
                placeholder="Enter value"
                style={styles.input}
                value={current.value}
                onChange={(e) => update({ value: e.target.value })}
              />
              {isBetween && (
                <input
                  type="number"
                  placeholder="To value"
                  style={{ ...styles.input, marginLeft: 8 }}
                  value={current.valueTo}
                  onChange={(e) => update({ valueTo: e.target.value })}
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Enter Value"
              style={styles.input}
              value={current.value}
              onChange={(e) => update({ value: e.target.value })}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Build API payload from filterState ───────────────────────────────────────
function buildApiFilters(filterState) {
  const filters = [];
  for (const [field, f] of Object.entries(filterState)) {
    if (!f.condition) continue;
    if (["is_null", "is_not_null"].includes(f.condition)) {
      filters.push({ field, condition: f.condition, text: "" });
    } else if (f.condition === "between" && f.value && f.valueTo) {
      filters.push({ field, condition: "between", text: `${f.value},${f.valueTo}` });
    } else if (f.value) {
      filters.push({ field, condition: f.condition, text: f.value });
    }
  }
  return filters;
}

// ─── Build cookie format from filterState ─────────────────────────────────────
function buildCookieFilters(filterState) {
  return Object.entries(filterState)
    .filter(([, f]) => f.value || ["is_null", "is_not_null"].includes(f.condition))
    .map(([column, f]) => ({
      column,
      condition: f.condition,
      value: f.condition === "between" ? `${f.value},${f.valueTo}` : f.value,
    }));
}

// ─── Restore filterState from cookie array ────────────────────────────────────
function restoreFilterState(cookieFilters, columns, allConditions) {
  const state = {};
  for (const saved of cookieFilters) {
    const col = columns.find((c) => c.name === saved.column);
    if (!col) continue;
    const allowed = allowedConditions(col.type, allConditions);
    const validCondition = allowed.find(([, v]) => v === saved.condition)?.[1] || allowed[0]?.[1];
    const [value, valueTo] = (saved.value || "").split(",");
    state[saved.column] = { condition: validCondition, value: value || "", valueTo: valueTo || "" };
  }
  return state;
}

// ─── HIDDEN COLUMNS (never shown in filter UI) ────────────────────────────────
const HIDDEN_COLUMNS = ["password"];

// ─── Main UsersPage ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const [columns, setColumns] = useState([]);
  const [allConditions, setAllConditions] = useState({});
  const [filterState, setFilterState] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Init: fetch columns then restore cookie
  useEffect(() => {
    (async () => {
      const res = await fetchTableColumns();
      setColumns(res.columns);
      setAllConditions(res.conditions);

      const saved = getCookie(COOKIE_KEY);
      const restored = restoreFilterState(saved, res.columns, res.conditions);
      setFilterState(restored);
      setInitialized(true);
    })();
  }, []);

  // Fetch users on init or page change
  useEffect(() => {
    if (!initialized) return;
    loadUsers(filterState, page);
  }, [initialized, page]);

  const loadUsers = useCallback(async (state, pg = 1) => {
    setLoading(true);
    const apiFilters = buildApiFilters(state);
    const res = await fetchUsers({ page: pg, page_size: 20, filters: apiFilters });
    setUsers(res.data || []);
    setTotalCount(res.total || 0);
    setActiveFiltersCount(apiFilters.length);
    setLoading(false);
  }, []);

  function handleFilterChange(colName, updated) {
    setFilterState((prev) => ({ ...prev, [colName]: updated }));
  }

  function handleApply() {
    const cookieData = buildCookieFilters(filterState);
    setCookie(COOKIE_KEY, cookieData, COOKIE_EXPIRY_DAYS);
    setPage(1);
    loadUsers(filterState, 1);
  }

  function handleReset() {
    removeCookie(COOKIE_KEY);
    setFilterState({});
    setPage(1);
    loadUsers({}, 1);
  }

  const visibleColumns = columns.filter((c) => !HIDDEN_COLUMNS.includes(c.name));
  const tableColumns = columns.filter((c) => !HIDDEN_COLUMNS.includes(c.name));

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.hamburger}>☰</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.avatar}>CT</div>
          <span style={styles.orgName}>CoreWix Technology Admin</span>
          <span style={styles.chevron}>▾</span>
        </div>
      </div>

      <div style={styles.body}>
        {/* Page title */}
        <h1 style={styles.pageTitle}>Users</h1>

        {/* Filter Panel */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Filters
              {activeFiltersCount > 0 && (
                <span style={styles.badge}>{activeFiltersCount} active</span>
              )}
            </div>
            <div style={styles.filterActions}>
              <button style={styles.btnOutline} onClick={handleReset}>
                <span style={styles.btnIcon}>↺</span> Reset
              </button>
              <button style={styles.btnPrimary} onClick={handleApply}>
                <span style={styles.btnIcon}>⊞</span> Apply Filter
              </button>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.filterGrid}>
            {visibleColumns.map((col) => (
              <FilterField
                key={col.name}
                column={col}
                allConditions={allConditions}
                filterState={filterState}
                onChange={handleFilterChange}
              />
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Users List
              {totalCount > 0 && <span style={styles.countBadge}>{totalCount} total</span>}
            </div>
            <div style={styles.tableActions}>
              <button style={styles.btnPill}>+ Add User</button>
              <button style={styles.btnPill}>+ Add Role</button>
              <button style={{ ...styles.btnPill, ...styles.btnPillActive }}>+ All Users</button>
              <button style={styles.btnPill}>+ All Roles</button>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.spinner} />
                <span style={styles.loadingText}>Fetching users...</span>
              </div>
            ) : users.length === 0 ? (
              <div style={styles.emptyState}>No users found for the applied filters.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {tableColumns.map((col) => (
                      <th key={col.name} style={styles.th}>
                        {col.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        <span style={styles.typeTag}>{col.type}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((row, i) => (
                    <tr
                      key={row.id}
                      style={i % 2 === 0 ? styles.trEven : styles.trOdd}
                    >
                      {tableColumns.map((col) => (
                        <td key={col.name} style={styles.td}>
                          {row[col.name] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PURPLE = "#7c5cbf";
const PURPLE_LIGHT = "#ede9f7";
const BORDER = "#e4e4ef";

const styles = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f5fa",
    minHeight: "100vh",
    color: "#1a1a2e",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 32px",
    background: "#1a1a2e",
    borderBottom: "1px solid #2d2d4e",
  },
  headerLeft: { display: "flex", alignItems: "center" },
  hamburger: { color: "#fff", fontSize: 20, cursor: "pointer" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: PURPLE,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
  },
  orgName: { color: "#e0e0f0", fontSize: 14 },
  chevron: { color: "#888", fontSize: 12 },
  body: { padding: "28px 32px", maxWidth: 1400, margin: "0 auto" },
  pageTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#1a1a2e" },
  section: {
    background: "#fff",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    marginBottom: 24,
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    background: PURPLE_LIGHT,
    color: PURPLE,
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  countBadge: {
    background: "#f0f0f5",
    color: "#666",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  filterActions: { display: "flex", gap: 10 },
  tableActions: { display: "flex", gap: 8 },
  btnOutline: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 24,
    background: "#fff",
    color: "#333",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 18px",
    border: "none",
    borderRadius: 24,
    background: PURPLE_LIGHT,
    color: PURPLE,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  btnIcon: { fontSize: 14 },
  btnPill: {
    padding: "7px 14px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 24,
    background: "#fff",
    color: "#555",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
  },
  btnPillActive: {
    background: PURPLE_LIGHT,
    color: PURPLE,
    border: `1.5px solid ${PURPLE_LIGHT}`,
    fontWeight: 600,
  },
  divider: { height: 1, background: BORDER, margin: "0 24px" },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    padding: 24,
  },
  filterCard: {
    background: "#fafafa",
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  filterLabel: { fontWeight: 600, fontSize: 13, color: "#333" },
  select: {
    width: "100%",
    padding: "8px 10px",
    border: `1px solid ${BORDER}`,
    borderRadius: 7,
    background: "#fff",
    fontSize: 13,
    color: "#444",
    cursor: "pointer",
    outline: "none",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 7,
    background: "#fff",
    fontSize: 13,
    color: "#333",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  dateRow: { display: "flex", gap: 8, alignItems: "flex-end" },
  dateGroup: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  dateLabel: { fontSize: 11, color: "#999", fontWeight: 500 },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "12px 20px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 12,
    color: "#888",
    borderBottom: `1px solid ${BORDER}`,
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  typeTag: {
    marginLeft: 6,
    background: "#f0f0f5",
    color: "#aaa",
    fontSize: 9,
    padding: "1px 5px",
    borderRadius: 4,
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  td: {
    padding: "13px 20px",
    color: "#333",
    borderBottom: `1px solid #f5f5f5`,
    whiteSpace: "nowrap",
  },
  trEven: { background: "#fff" },
  trOdd: { background: "#fcfcfe" },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 48,
    color: "#999",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid #e5e5f5",
    borderTop: `2px solid ${PURPLE}`,
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: { fontSize: 14, color: "#aaa" },
  emptyState: {
    textAlign: "center",
    padding: 48,
    color: "#bbb",
    fontSize: 14,
  },
};
