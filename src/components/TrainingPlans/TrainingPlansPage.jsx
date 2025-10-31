import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Dumbbell, Calendar, ChevronRight, Search } from 'lucide-react';
import TrainingPlanBuilder from './TrainingPlanBuilder';

function TrainingPlansPage({ userProfile }) {
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredPlans = trainingPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Dumbbell className="w-8 h-8 text-purple-600" />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{trainingPlans.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Dumbbell className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {trainingPlans.filter(p => p.is_active).length}
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
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Plan Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      plan.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {plan.difficulty}
                    </span>
                  </div>
                </div>

                {/* Plan Stats */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">{plan.duration_weeks} weeks</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Assigned</p>
                      <p className="font-semibold text-gray-900">
                        {plan.assigned_customer_ids?.length || 0} clients
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainingPlansPage;

