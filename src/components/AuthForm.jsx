import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, User, Phone, Mail, Lock, UserCheck } from 'lucide-react';

const AuthForm = () => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const credentials = {
      password: loginData.password,
      ...(loginMethod === 'email' 
        ? { email: loginData.email }
        : { phone: loginData.phone }
      ),
    };

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!registerData.first_name || !registerData.last_name || !registerData.password || !registerData.role) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (!registerData.email && !registerData.phone) {
      setError('Please provide either email or phone number');
      setIsLoading(false);
      return;
    }

    if (registerData.phone && registerData.phone.length !== 8) {
      setError('Phone number must be exactly 8 digits');
      setIsLoading(false);
      return;
    }

    const result = await register(registerData);
    
    if (result.success) {
      setSuccess('Registration successful! Please login with your credentials.');
      setActiveTab('login');
      // Reset form
      setRegisterData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
      });
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const updateLoginData = (field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateRegisterData = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to CoachSync
          </CardTitle>
          <CardDescription>
            Your personal training management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Login Method Selection */}
                <Tabs value={loginMethod} onValueChange={setLoginMethod}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => updateLoginData('email', e.target.value)}
                        required
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 8-digit phone number"
                        value={loginData.phone}
                        onChange={(e) => updateLoginData('phone', e.target.value)}
                        maxLength={8}
                        pattern="[0-9]{8}"
                        required
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => updateLoginData('password', e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      placeholder="First name"
                      value={registerData.first_name}
                      onChange={(e) => updateRegisterData('first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      placeholder="Last name"
                      value={registerData.last_name}
                      onChange={(e) => updateRegisterData('last_name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={registerData.role} onValueChange={(value) => updateRegisterData('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coach">
                        <div className="flex items-center">
                          <UserCheck className="mr-2 h-4 w-4" />
                          Coach
                        </div>
                      </SelectItem>
                      <SelectItem value="customer">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Customer
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_email">Email Address (Optional)</Label>
                  <Input
                    id="reg_email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerData.email}
                    onChange={(e) => updateRegisterData('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_phone">Phone Number (Optional)</Label>
                  <Input
                    id="reg_phone"
                    type="tel"
                    placeholder="Enter 8-digit phone number"
                    value={registerData.phone}
                    onChange={(e) => updateRegisterData('phone', e.target.value)}
                    maxLength={8}
                    pattern="[0-9]{8}"
                  />
                  <p className="text-xs text-gray-500">
                    Provide either email or phone number (or both)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_password">Password *</Label>
                  <Input
                    id="reg_password"
                    type="password"
                    placeholder="Create a password"
                    value={registerData.password}
                    onChange={(e) => updateRegisterData('password', e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;

