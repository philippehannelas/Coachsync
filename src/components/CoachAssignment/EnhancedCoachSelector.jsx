import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ChevronDown, Check, Star, Users } from 'lucide-react';
import { coachNetworkApi } from '../../services/coachNetworkApi';
import { coachConnectionsApi } from '../../services/coachConnectionsApi';

/**
 * Enhanced searchable coach selector with team prioritization
 * @param {Object} props
 * @param {Object} props.selectedCoach - Currently selected coach
 * @param {Function} props.onSelect - Callback when coach is selected
 * @param {string} props.placeholder - Input placeholder
 */
const EnhancedCoachSelector = ({ selectedCoach, onSelect, placeholder = "Search for a coach..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCoaches, setAllCoaches] = useState([]);
  const [teamCoaches, setTeamCoaches] = useState([]);
  const [filteredAll, setFilteredAll] = useState([]);
  const [filteredTeam, setFilteredTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Load coaches on mount
  useEffect(() => {
    loadCoaches();
  }, []);

  // Filter coaches based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAll(allCoaches);
      setFilteredTeam(teamCoaches);
    } else {
      const query = searchQuery.toLowerCase();
      const filterCoach = (coach) => 
        coach.full_name?.toLowerCase().includes(query) ||
        coach.email?.toLowerCase().includes(query) ||
        coach.first_name?.toLowerCase().includes(query) ||
        coach.last_name?.toLowerCase().includes(query);
      
      setFilteredAll(allCoaches.filter(filterCoach));
      setFilteredTeam(teamCoaches.filter(filterCoach));
    }
  }, [searchQuery, allCoaches, teamCoaches]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all coaches
      const allResponse = await coachNetworkApi.listAllCoaches();
      const allCoachesList = allResponse.coaches || [];
      
      // Load team connections
      const teamResponse = await coachConnectionsApi.getConnections('accepted');
      const teamConnections = teamResponse.connections || [];
      
      // Extract team coach IDs
      const teamCoachIds = new Set(teamConnections.map(conn => conn.coach_id));
      
      // Separate team coaches from all coaches
      const team = [];
      const nonTeam = [];
      
      allCoachesList.forEach(coach => {
        if (teamCoachIds.has(coach.id)) {
          team.push({ ...coach, isTeamMember: true });
        } else {
          nonTeam.push({ ...coach, isTeamMember: false });
        }
      });
      
      setTeamCoaches(team);
      setAllCoaches(nonTeam);
      setFilteredTeam(team);
      setFilteredAll(nonTeam);
    } catch (err) {
      setError('Failed to load coaches');
      console.error('Error loading coaches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (coach) => {
    onSelect(coach);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && allCoaches.length === 0 && teamCoaches.length === 0) {
      loadCoaches();
    }
  };

  const CoachItem = ({ coach, showStar = false }) => (
    <div
      onClick={() => handleSelect(coach)}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
    >
      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
        {coach.first_name?.[0]}{coach.last_name?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {coach.full_name}
          </p>
          {showStar && (
            <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {coach.email}
        </p>
      </div>
      {selectedCoach?.id === coach.id && (
        <Check className="text-blue-600" size={18} />
      )}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Coach Display / Search Input */}
      <div
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent cursor-pointer bg-white"
        onClick={handleInputClick}
      >
        {selectedCoach ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {selectedCoach.first_name?.[0]}{selectedCoach.last_name?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {selectedCoach.full_name}
                </p>
                {selectedCoach.isTeamMember && (
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {selectedCoach.email}
              </p>
            </div>
            <ChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Search className="text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
          </div>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Loading coaches...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">{error}</p>
              <button
                onClick={loadCoaches}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* My Team Section */}
              {filteredTeam.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center gap-2">
                    <Star size={16} className="text-blue-600 fill-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      My Team ({filteredTeam.length})
                    </span>
                  </div>
                  {filteredTeam.map(coach => (
                    <CoachItem key={coach.id} coach={coach} showStar />
                  ))}
                </div>
              )}

              {/* All Coaches Section */}
              {filteredAll.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                    <Users size={16} className="text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      All Coaches ({filteredAll.length})
                    </span>
                  </div>
                  {filteredAll.map(coach => (
                    <CoachItem key={coach.id} coach={coach} />
                  ))}
                </div>
              )}

              {/* No Results */}
              {filteredTeam.length === 0 && filteredAll.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">
                    {searchQuery ? 'No coaches found' : 'No coaches available'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCoachSelector;
