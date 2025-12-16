import React from 'react';

import { LoginForm, Result } from '../types';

interface LoginScreenProps {
    loginForm: LoginForm;
    setLoginForm: (form: LoginForm) => void;
    handleLogin: (e: React.FormEvent) => void;
    loading: boolean;
    result: Result | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    loginForm,
    setLoginForm,
    handleLogin,
    loading,
    result
}) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4">
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6">
                            <img
                                src="/image.png"
                                alt="Tecobit Technology Pvt. Ltd."
                                className="h-24 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tecobit Technology Pvt. Ltd.</h1>
                        <p className="text-gray-500 mt-2 text-sm">Attendance App</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                required
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-gray-50 focus:bg-white"
                                placeholder="name@tecobit.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all bg-gray-50 focus:bg-white"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-6 p-4 rounded-xl border ${result.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                            } flex items-center justify-center text-sm font-medium`}>
                            {result.message}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} Tecobit Technology Pvt. Ltd.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
