import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, ChevronRight, Search, Eye } from 'lucide-react';
import AthleteHubLogo from '../AthleteHubLogo';
import TrainingPlanBuilder from './TrainingPlanBuilder';
import TrainingPlanDetailModal from './TrainingPlanDetailModal';

function TrainingPlansPage({ userProfile }) {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPlanDetailModal, setShowPlanDetailModal] = useState(false);
  const [viewingPlan, setViewingPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch training plans
      const plansResponse = await fetch('https://coachsync-pro.onrender.com/api/coach/training-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setTrainingPlans(plansData);
      }
      
      // Fetch customers for assignment
      const customersResponse = await fetch('https://coachsync-pro.onrender.com/api/coach/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        // API returns array directly, not wrapped in .data
        setCustomers(Array.isArray(customersData) ? customersData : customersData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowBuilder(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setShowBuilder(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this training plan?')) return;
    
    try {
      const response = await fetch(`https://coachsync-pro.onrender.com/api/coach/training-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handlePlanSaved = () => {
    setShowBuilder(false);
    setSelectedPlan(null);
    loadData();
  };

  const filteredPlans = trainingPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showBuilder) {
    return (
      <TrainingPlanBuilder
        plan={selectedPlan}
        customers={customers}
        onSave={handlePlanSaved}
        onCancel={() => {
          setShowBuilder(false);
          setSelectedPlan(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AthleteHubLogo className="w-8 h-8" color="#0066FF" />
                Training Plans
              </h1>
              <p className="text-gray-600 mt-1">Create and manage workout programs for your clients</p>
            </div>
            <button
              onClick={handleCreatePlan}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create New Plan
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search training plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'active', 'upcoming', 'expired', 'draft'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 text-xs opacity-75">
                  ({trainingPlans.filter(p => p.status === status).length})
                </span>
              )}
              {status === 'all' && (
                <span className="ml-2 text-xs opacity-75">
                  ({trainingPlans.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{trainingPlans.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <AthleteHubLogo className="h-8 w-8" color="#0066FF" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trainingPlans.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Assigned to Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trainingPlans.reduce((sum, p) => sum + (p.assigned_customer_ids?.length || 0), 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Training Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading training plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AthleteHubLogo className="w-16 h-16 mx-auto mb-4" color="#CBD5E1" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Training Plans Yet</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No plans match your search.' : 'Create your first training plan to get started!'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreatePlan}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="training-plan-card-mobile"
              >
                {/* Mobile Header with Gradient */}
                <div className="training-plan-header-mobile">
                  <div className="training-plan-badges-mobile">
                    <span className="training-plan-badge-mobile">
                      {plan.status}
                    </span>
                    <span className="training-plan-badge-mobile">
                      {plan.difficulty}
                    </span>
                  </div>
                </div>

                {/* Mobile Body */}
                <div className="training-plan-body-mobile">
                  <h3 className="training-plan-title-mobile">{plan.name}</h3>
                  <p className="training-plan-description-mobile">{plan.description}</p>

                  {/* Mobile Meta Grid */}
                  <div className="training-plan-meta-mobile">
                    <div className="training-plan-meta-item-mobile">
                      <div className="training-plan-meta-label-mobile">Duration</div>
                      <div className="training-plan-meta-value-mobile">{plan.duration_weeks} weeks</div>
                    </div>
                    <div className="training-plan-meta-item-mobile">
                      <div className="training-plan-meta-label-mobile">Assigned</div>
                      <div className="training-plan-meta-value-mobile">
                        {plan.assigned_customer_ids?.length || 0} clients
                      </div>
                    </div>
                  </div>

                  {/* Validity Period */}
                  {(plan.start_date || plan.end_date) && (
                    <div style={{padding: '12px', background: '#FEF3C7', borderRadius: '8px', marginBottom: '16px'}}>
                      <div style={{fontSize: '13px', color: '#92400E', fontWeight: 500}}>
                        📅 {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'Not set'}
                        {' → '}
                        {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : 'Not set'}
                      </div>
                    </div>
                  )}

                  {/* Mobile Actions */}
                  <div className="training-plan-actions-mobile">
                    <button
                      onClick={() => {
                        setViewingPlan(plan);
                        setShowPlanDetailModal(true);
                      }}
                      className="btn-mobile-secondary"
                      style={{background: '#EDE9FE', color: '#7C3AED', border: 'none', flex: 1}}
                    >
                      <Eye size={20} />
                      View
                    </button>
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="btn-mobile-primary"
                      style={{flex: 1}}
                    >
                      <Edit size={20} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="btn-mobile-icon"
                      style={{background: '#FEE2E2', color: '#EF4444', border: 'none'}}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Plan Detail Modal */}
      {showPlanDetailModal && viewingPlan && (
        <TrainingPlanDetailModal
          plan={viewingPlan}
          onClose={() => {
            setShowPlanDetailModal(false);
            setViewingPlan(null);
          }}
          onEdit={(plan) => {
            setShowPlanDetailModal(false);
            handleEditPlan(plan);
          }}
        />
      )}
    </div>
  );
}

export default TrainingPlansPage;

