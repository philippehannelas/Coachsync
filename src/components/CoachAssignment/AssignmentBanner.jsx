import React from 'react';
import { Info, Calendar, User } from 'lucide-react';

/**
 * Banner component to display temporary coach assignment to customers
 * @param {Object} props
 * @param {Object} props.assignment - Current assignment object
 */
const AssignmentBanner = ({ assignment }) => {
  if (!assignment) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Info className="text-blue-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Temporary Coach Assignment
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Your coach <span className="font-medium">{assignment.primary_coach?.name}</span> is temporarily unavailable.
            {assignment.reason && ` (${assignment.reason})`}
          </p>
          
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              {assignment.substitute_coach?.profile_photo_url ? (
                <img
                  src={assignment.substitute_coach.profile_photo_url}
                  alt={assignment.substitute_coach.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={24} />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {assignment.substitute_coach?.name}
                </p>
                <p className="text-sm text-gray-600">
                  Your temporary coach
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              <span>
                {formatDate(assignment.start_date)} - {assignment.end_date ? formatDate(assignment.end_date) : 'Until further notice'}
              </span>
            </div>
          </div>

          <p className="text-xs text-blue-700">
            You can book sessions and communicate with {assignment.substitute_coach?.name?.split(' ')[0]} during this period.
            Your training plan and progress will be maintained.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentBanner;
