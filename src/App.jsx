import React from 'react';
import { AuthProvider } from './hooks/useAuth.jsx';
import AuthForm from './components/AuthForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AuthForm />
      </div>
    </AuthProvider>
  );
}

export default App;

