import React, { useState } from 'react';
import { UserCheck, Trash2, StickyNote, Tag, History } from 'lucide-react';

/**
 * Card component for displaying team members (accepted connections)
 * @param {Object} props
 * @param {Object} props.connection - Connection object
 * @param {Function} props.onRemove - Callback when connection is removed
 * @param {Function} props.onAssign - Callback when assign is clicked
 * @param {Function} props.onViewHistory - Callback when view history is clicked
 * @param {Function} props.onUpdateNotes - Callback when notes are updated
 */
const TeamMemberCard = ({ connection, onRemove, onAssign, onViewHistory, onUpdateNotes }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(connection.notes || '');
  const [tags, setTags] = useState(connection.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const coach = connection.coach || {};
  const initials = `${coach.first_name?.[0] || ''}${coach.last_name?.[0] || ''}`;

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      await onUpdateNotes(connection.id, notes, tagArray);
      setShowNotes(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Coach Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {coach.full_name || 'Unknown Coach'}
          </h3>
          <p className="text-sm text-gray-600 truncate">{coach.email}</p>
          
          {/* Tags */}
          {connection.tags && connection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {connection.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Preview */}
      {connection.notes && !showNotes && (
        <div className="bg-gray-50 rounded-lg p-2 mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">{connection.notes}</p>
        </div>
      )}

      {/* Notes Editor */}
      {showNotes && (
        <div className="mb-3 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Private Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this coach..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., vacation-sub, nutrition, strength"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowNotes(false);
                setNotes(connection.notes || '');
                setTags(connection.tags?.join(', ') || '');
              }}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onAssign && onAssign(coach)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserCheck size={16} />
          Assign
        </button>
        
        <button
          onClick={() => onViewHistory && onViewHistory(connection)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <History size={16} />
          History
        </button>
        
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <StickyNote size={16} />
          {showNotes ? 'Close' : 'Notes'}
        </button>
        
        <button
          onClick={() => onRemove && onRemove(connection.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    </div>
  );
};

export default TeamMemberCard;
