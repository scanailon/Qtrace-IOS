import React, { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import LoadingScreen from './screens/LoadingScreen';
import DashboardScreen from './screens/DashboardScreen';
import DeviceListScreen from './screens/DeviceListScreen';
import ReportFormScreen from './screens/ReportFormScreen';
import TripsListScreen from './screens/TripsListScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [screenParams, setScreenParams] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  const handleLoginSuccess = (profile) => {
    setUserProfile(profile);
    setCurrentScreen('loading');
  };

  const handleLoadingComplete = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
    setScreenParams({});
    setUserProfile(null);
  };

  const handleNavigate = (screen, params = {}) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const handleSelectDevice = (device) => {
    handleNavigate('report', { device });
  };

  if (currentScreen === 'loading') {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={userProfile}
      />
    );
  }

  if (currentScreen === 'devices') {
    return (
      <DeviceListScreen
        onNavigate={handleNavigate}
        onSelectDevice={handleSelectDevice}
        user={userProfile}
      />
    );
  }

  if (currentScreen === 'report') {
    return (
      <ReportFormScreen
        device={screenParams.device}
        onNavigate={handleNavigate}
        user={userProfile}
      />
    );
  }

  if (currentScreen === 'trips') {
    return <TripsListScreen onNavigate={handleNavigate} user={userProfile} />;
  }

  return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
}
