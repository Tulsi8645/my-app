"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';
import { Employee, Location, AttendanceRecord, Stats, Result, LoginForm } from './types';
import LoginScreen from './components/LoginScreen';
import CheckInTab from './components/CheckInTab';
import HistoryTab from './components/HistoryTab';
import ProfileTab from './components/ProfileTab';

function AttendanceApp() {
  const [activeTab, setActiveTab] = useState<'check-in' | 'history' | 'profile'>('check-in');
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      setEmployee(JSON.parse(savedEmployee));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && employee) {
      loadHistory();
    }
  }, [activeTab, employee]);

  useEffect(() => {
    if (activeTab === 'profile' && employee) {
      loadStats();
    }
  }, [activeTab, employee]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        setEmployee(data.employee);
        localStorage.setItem('employee', JSON.stringify(data.employee));
        setResult(null);
        // Silent login success
      } else {
        setResult({ success: false, message: data.error || 'Login failed' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    }

    setLoading(false);
  };

  const handleLogout = () => {
    setEmployee(null);
    localStorage.removeItem('employee');
    setActiveTab('check-in');
    setResult(null);
  };

  const loadHistory = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/history?employeeId=${employee._id}`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.records);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    setLoading(false);
  };

  const fetchTodayStatus = async () => {
    if (!employee) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/history?employeeId=${employee._id}`);
      const data = await response.json();

      if (response.ok && data.records.length > 0) {
        // Compare dates using local browser time to handle UTC conversion from backend
        const todayDateString = new Date().toDateString();
        const todayRecord = data.records.find((r: AttendanceRecord) =>
          new Date(r.date).toDateString() === todayDateString
        );

        if (todayRecord) {
          // Check if the last session is active
          // Note: The history API returns formatted times.
          // We need to look at the sessions array.
          const sessions = todayRecord.sessions || [];
          const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

          // If last session exists and checkOut is "Active", user is checked in.
          const isActive = lastSession && (lastSession.checkOut === 'Active' || !lastSession.checkOut);
          setIsCheckedIn(!!isActive);
        } else {
          setIsCheckedIn(false);
        }
      } else {
        setIsCheckedIn(false);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  useEffect(() => {
    if (employee) {
      fetchTodayStatus();
    }
  }, [employee]);

  const loadStats = async () => {
    if (!employee) return;
    try {
      const response = await fetch(`/api/attendance/stats?employeeId=${employee._id}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Fetch location on mount for UI display
  const fetchLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            address = data.display_name;
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }
        setLocation({ lat: latitude, lng: longitude, address });
      },
      (error) => {
        console.log("Error fetching initial location", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (activeTab === 'check-in' && !location) {
      fetchLocation();
    }
  }, [activeTab]);

  const handleVerifyLocation = () => {
    fetchLocation();
  };

  const handleCheckIn = (type: 'checkin' | 'checkout') => {
    if (!navigator.geolocation) {
      setResult({
        success: false,
        message: 'Geolocation is not supported by your browser'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            address = data.display_name;
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }

        setLocation({ lat: latitude, lng: longitude, address });

        if (!employee) return;

        try {
          const response = await fetch('/api/attendance/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employee._id,
              latitude,
              longitude,
              timestamp: Date.now(),
              type
            })
          });

          const data = await response.json();

          if (response.ok) {
            setResult({
              success: true,
              message: `${type === 'checkin' ? 'Check-in' : 'Check-out'} successful!`,
            });
            setIsCheckedIn(type === 'checkin');
            fetchTodayStatus(); // Refresh to be sure
          } else {
            setResult({
              success: false,
              message: data.error || 'Attendance marking failed',
              details: data
            });
          }
        } catch (error) {
          setResult({
            success: false,
            message: 'Error processing attendance. Please try again.'
          });
        }

        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable. Ensure GPS is enabled.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          errorMessage += ' (Note: Geolocation requires HTTPS on non-localhost connections)';
        }

        setResult({
          success: false,
          message: errorMessage
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
    );
  };

  if (!employee) {
    return (
      <LoginScreen
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
        loading={loading}
        result={result}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-md mx-auto bg-white shadow-xl">
        <div className="bg-white">
          {activeTab === 'check-in' && (
            <CheckInTab
              employee={employee}
              currentTime={currentTime}
              location={location}
              loading={loading}
              result={result}
              handleCheckIn={handleCheckIn}
              isCheckedIn={isCheckedIn}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              loading={loading}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab
              employee={employee}
              stats={stats}
              handleLogout={handleLogout}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-md mx-auto flex justify-around items-center h-12">
            <button
              onClick={() => setActiveTab('check-in')}
              className={`flex flex-col items-center justify-center space-y-1 px-6 py-2 transition-colors ${activeTab === 'check-in' ? 'text-blue-600' : 'text-gray-400'
                }`}
            >
              <MapPin className="w-6 h-6" />
              <span className="text-xs font-medium">Check In</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center space-y-1 px-6 py-2 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'
                }`}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-xs font-medium">History</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center space-y-1 px-6 py-2 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'
                }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceApp;