import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { RefreshCw, Clock, Award, User, LogOut } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { database } from "../../config/firebase";

// Type Definitions
interface WasteLog {
  type: string;
  timestamp: string;
}

interface WasteData {
  [key: string]: WasteLog;
}

interface WasteCountItem {
  name: string;
  value: number;
  color: string;
}

const WasteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [wasteData, setWasteData] = useState<WasteData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Pagination & Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState<string>(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(""); // yyyy-mm-dd

  // Colors for waste types
  const colorMap: { [key: string]: string } = {
    Metal: "#6366F1", // Indigo
    Wet: "#10B981", // Green
    Dry: "#F59E0B", // Amber
  };

  useEffect(() => {
    const fetchData = () => {
      const wasteRef = ref(database, "waste_logs"); // adjust path if needed

      onValue(
        wasteRef,
        (snapshot) => {
          const data = snapshot.val() || {};
          setWasteData(data);
          setLastUpdated(new Date());
          setLoading(false);
        },
        (error) => {
          console.error("Firebase read failed: ", error);
          setLoading(false);
        }
      );
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process data for Pie Chart
  const processDataForPieChart = (): WasteCountItem[] => {
    const counts: { [key: string]: number } = { Metal: 0, Wet: 0, Dry: 0 };
    Object.values(wasteData).forEach((log) => {
      if (counts[log.type] !== undefined) {
        counts[log.type] += 1;
      }
    });
    return Object.keys(counts).map((type) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: counts[type],
      color: colorMap[type],
    }));
  };

  const pieData = processDataForPieChart();
  const totalWasteCount = Object.keys(wasteData).length;

  const getMostCommonType = (): { type: string; count: number } | null => {
    if (pieData.length === 0) return null;
    const mostCommon = pieData.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );
    return {
      type: mostCommon.name,
      count: mostCommon.value,
    };
  };

  const mostCommonType = getMostCommonType();

  // Refresh data manually
  const refreshData = () => {
    setLastUpdated(new Date());
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate("/");
  };

  // ----------- Date filter & Pagination logic -----------

  // Convert date string (yyyy-mm-dd) to timestamp in seconds for comparison
  const dateStringToTimestamp = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
  };

  // Filter logs by date range
  const filteredLogs = Object.values(wasteData)
    .filter((log) => {
      const ts = parseInt(log.timestamp);
      const startTs = dateStringToTimestamp(startDate);
      const endTs = dateStringToTimestamp(endDate);
      if (startTs && ts < startTs) return false;
      if (endTs && ts > endTs + 86399) return false; // Include whole end day (23:59:59)
      return true;
    })
    .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // ------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Waste Management Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <User className="h-6 w-6 text-gray-600" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Last Updated */}
            <div className="mb-6 flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total Items</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {totalWasteCount}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow flex flex-col">
                <h3 className="text-lg font-semibold mb-2">Waste Categories</h3>
                <div className="flex space-x-4 mt-2">
                  <span className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-1"
                      style={{ backgroundColor: colorMap.Metal }}
                    ></span>
                    Metal
                  </span>
                  <span className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-1"
                      style={{ backgroundColor: colorMap.Wet }}
                    ></span>
                    Wet
                  </span>
                  <span className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-1"
                      style={{ backgroundColor: colorMap.Dry }}
                    ></span>
                    Dry
                  </span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart with Most Common Type */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">Waste Distribution</h3>
                  {mostCommonType && (
                    <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
                      <Award className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Most Common</div>
                        <div className="font-semibold flex items-center">
                          <span
                            className="h-3 w-3 rounded-full mr-1"
                            style={{
                              backgroundColor:
                                colorMap[mostCommonType.type.toLowerCase()],
                            }}
                          ></span>
                          {mostCommonType.type} ({mostCommonType.count})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Waste Counts by Type
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pieData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Count">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>

              {/* Date Filters */}
              <div className="flex space-x-4 mb-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                    max={endDate || undefined}
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md p-2"
                    min={startDate || undefined}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log, index) => {
                        const date = new Date(parseInt(log.timestamp) * 1000);
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {date.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                style={{
                                  backgroundColor: colorMap[log.type] + "20",
                                  color: colorMap[log.type],
                                }}
                              >
                                {log.type.charAt(0).toUpperCase() +
                                  log.type.slice(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500"
                        >
                          No waste data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center space-x-4">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === 1
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        © 2025 Smart Waste Management
      </footer>
    </div>
  );
};

export default WasteDashboard;
