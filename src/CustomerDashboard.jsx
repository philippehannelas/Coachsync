import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { customerAPI } from '../../services/api';
import { User, CreditCard, Calendar, BookOpen, Phone, Mail } from 'lucide-react';

const CustomerDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, bookingsRes, plansRes] = await Promise.allSettled([
        customerAPI.getProfile(),
        customerAPI.getBookings(),
        customerAPI.getTrainingPlans()
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
        setProfileData(profileRes.value.data);
      }
      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value.data || []);
      }
      if (plansRes.status === 'fulfilled') {
        setTrainingPlans(plansRes.value.data || []);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await customerAPI.updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      setEditingProfile(false);
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.start_time) > new Date() && booking.status === 'confirmed'
  ).slice(0, 3);

  const recentBookings = bookings.filter(booking => 
    new Date(booking.start_time) <= new Date()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.first_name}!</p>
            </div>
            <Button onClick={onLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {loading && !profile ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading your dashboard...</div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Session Credits</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(profile?.session_credits || 0) <= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                    {profile?.session_credits || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(profile?.session_credits || 0) <= 2 ? 'Running low - contact your coach' : 'Credits remaining'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {upcomingBookings.length > 0 ? 'Sessions scheduled' : 'No upcoming sessions'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Training Plans</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trainingPlans.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {trainingPlans.length > 0 ? 'Active plans' : 'No plans assigned'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="plans">Training Plans</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Next Session */}
                {upcomingBookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Next Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {new Date(upcomingBookings[0].start_time).toLocaleDateString()} at{' '}
                              {new Date(upcomingBookings[0].start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </h3>
                            <p className="text-gray-600">
                              Duration: {upcomingBookings[0].duration || 60} minutes
                            </p>
                            {upcomingBookings[0].notes && (
                              <p className="text-sm text-gray-500 mt-2">
                                Notes: {upcomingBookings[0].notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Confirmed
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Coach Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Coach</CardTitle>
                    <CardDescription>Contact information for your personal trainer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{profile?.coach_name || 'Coach Name'}</span>
                      </div>
                      {profile?.coach_email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <a href={`mailto:${profile.coach_email}`} className="text-blue-600 hover:underline">
                            {profile.coach_email}
                          </a>
                        </div>
                      )}
                      {profile?.coach_phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <a href={`tel:${profile.coach_phone}`} className="text-blue-600 hover:underline">
                            {profile.coach_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button className="h-16" disabled>
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Session (Coming Soon)
                      </Button>
                      <Button variant="outline" className="h-16" disabled>
                        <BookOpen className="h-5 w-5 mr-2" />
                        View Workout (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Manage your personal information</CardDescription>
                      </div>
                      {!editingProfile && (
                        <Button onClick={() => setEditingProfile(true)}>
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingProfile ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                              id="first_name"
                              value={profileData.first_name}
                              onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                              id="last_name"
                              value={profileData.last_name}
                              onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email || ''}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone || ''}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <p className="text-lg">{profile?.first_name}</p>
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <p className="text-lg">{profile?.last_name}</p>
                          </div>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-lg">{profile?.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <p className="text-lg">{profile?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label>Member Since</Label>
                          <p className="text-lg">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>View your session history and upcoming appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No bookings yet. Contact your coach to schedule your first session!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingBookings.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Upcoming Sessions</h3>
                            {upcomingBookings.map((booking) => (
                              <div key={booking.id} className="border rounded-lg p-4 bg-blue-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">
                                      {new Date(booking.start_time).toLocaleDateString()} at{' '}
                                      {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Duration: {booking.duration || 60} minutes
                                    </p>
                                    {booking.notes && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Notes: {booking.notes}
                                      </p>
                                    )}
                                  </div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {recentBookings.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-lg mb-3 mt-6">Recent Sessions</h3>
                            {recentBookings.map((booking) => (
                              <div key={booking.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">
                                      {new Date(booking.start_time).toLocaleDateString()} at{' '}
                                      {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Duration: {booking.duration || 60} minutes
                                    </p>
                                    {booking.notes && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Notes: {booking.notes}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plans">
                <Card>
                  <CardHeader>
                    <CardTitle>Training Plans</CardTitle>
                    <CardDescription>Coming in Stage 3 - View your personalized workout plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Training plan features will be available in Stage 3</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

