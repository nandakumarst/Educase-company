import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingScreen from './components/LandingScreen';
import LoginScreen from './components/LoginScreen';
import SignUp from './components/SignUp';
import Profile from './components/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/sign" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;