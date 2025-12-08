
import React, { useState } from 'react';
import { Button } from './Button';
import { Library, Lock, User, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (status: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
      if (username === 'shiro1729' && password === 'abc123') {
        onLogin(true);
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="bg-[#1e1b4b] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-indigo-900/50 p-3 rounded-xl mb-4 border border-indigo-400/20 backdrop-blur-sm shadow-inner">
              <Library className="w-10 h-10 text-indigo-50" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-1">LinguaLift</h1>
            <p className="text-indigo-200 text-sm font-medium tracking-widest uppercase">VCE English Assistant</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 text-white shadow-lg hover:shadow-xl transition-all"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Restricted Access • Authorized Educators Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
