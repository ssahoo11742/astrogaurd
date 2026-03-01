import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

const LiveNEOSection = () => {
  const [neos, setNeos] = useState([]);
  const [stats, setStats] = useState({
    total: 34847,
    hazardous: 2341,
    thisMonth: 156,
    closeApproaches: 23,
  });

  useEffect(() => {
    fetch("https://meteor-madness-server-wtu3.onrender.com/live_neo_data")
      .then((res) => res.json())
      .then(setNeos)
      .catch(console.error);
  }, []);

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Live Data</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Real-time tracking of Near-Earth Objects with authentic data from
          NASA's monitoring systems
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Tracked Objects</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-1">
            {stats.hazardous.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Potentially Hazardous</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {stats.thisMonth}
          </div>
          <div className="text-sm text-gray-400">This Month</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {stats.closeApproaches}
          </div>
          <div className="text-sm text-gray-400">Close Approaches</div>
        </div>
      </div>

      {/* NEO Tracking Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-cyan-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Near-Earth Object Tracking
          </h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Latest data from NASA's Center for Near Earth Object Studies (CNEOS)
        </p>

        {/* NEO Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  m-4">
          {neos.map((neo) => (
            <div
              key={neo.name}
              className="bg-black border border-gray-800 rounded-lg p-5 hover:border-cyan-900 transition-colors flex flex-col justify-between h-full m-4"
            >
              {/* Top Row */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="text-blue-400" size={24} />
                    </div>
                    <h4 className="text-lg font-semibold text-white">
                      {neo.name}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      neo.hazardous
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {neo.hazardous
                      ? "Potentially Hazardous"
                      : "Non-Hazardous"}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Next Approach:</span>
                    <span className="text-gray-300">{neo.next_approach}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Diameter:</span>
                    <span className="text-white">
                      {neo.diameter_min_m}m – {neo.diameter_max_m}m
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Distance:</span>
                    <span className="text-cyan-400">{neo.distance_au} AU</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Velocity:</span>
                    <span className="text-cyan-400">
                      {neo.velocity_kms} km/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* If there are no NEOs */}
        {neos.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Loading live NEO data...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveNEOSection;
