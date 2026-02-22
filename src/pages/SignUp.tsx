import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Rocket, CheckCircle2 /* , Smartphone */ } from 'lucide-react';
// import MobileAuthForm from '../components/MobileAuth/MobileAuthForm'; // uncomment when re-enabling phone signup

type SignUpTab = 'email' | 'phone';

interface SignUpProps {
  onNavigate?: (path: string) => void;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const [tab, setTab] = useState<SignUpTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { user, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) onNavigate?.('/dashboard');
  }, [user, onNavigate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message || 'Failed to create account');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative flex items-center justify-center px-4 py-12">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
          <div
            className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            style={{
              left: `${mousePosition.x - 192}px`,
              top: `${mousePosition.y - 192}px`,
              transition: 'all 0.3s ease-out'
            }}
          ></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        {/* Logo in top left corner */}
        <div className="fixed top-6 left-6 z-20">
          <button
            onClick={() => onNavigate?.('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ProductTasks
            </span>
          </button>
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-800 text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Account Created!
              </h1>
              <p className="text-slate-400 text-sm mb-6">
                Your account has been created successfully. You can now sign in.
              </p>
              <button 
                onClick={() => onNavigate?.('/signin')}
                className="relative group inline-flex"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold">
                  Go to Sign In
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
            transition: 'all 0.3s ease-out'
          }}
        ></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Logo in top left corner */}
      <div className="fixed top-6 left-6 z-20">
        <button
          onClick={() => onNavigate?.('/')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ProductTasks
          </span>
        </button>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-center mb-5">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Create Account
            </h1>
            <p className="text-center text-slate-400 text-sm mb-5">
              Start your PM learning journey today
            </p>

            {/* Sign up with Google */}
            <button
              type="button"
              onClick={async () => {
                setGoogleLoading(true);
                setError('');
                const { error } = await signInWithGoogle();
                if (error) {
                  setError(error.message || 'Google sign in failed');
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-900/80 text-slate-400">or sign up with email</span>
              </div>
            </div>

            {/* Email / Phone tabs - phone option commented out for now, will add back later */}
            <div className="flex rounded-lg bg-slate-800/50 p-1 mb-5">
              <button
                type="button"
                onClick={() => { setTab('email'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${tab === 'email' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <UserPlus className="w-4 h-4" />
                Email
              </button>
              {/* Phone tab - uncomment to re-enable phone signup
              <button
                type="button"
                onClick={() => { setTab('phone'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${tab === 'phone' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" />
                Phone
              </button>
              */}
            </div>

            {/* Phone signup - uncomment to re-enable
            {tab === 'phone' && (
              <MobileAuthForm
                onSuccess={() => onNavigate?.('/dashboard')}
                onBack={() => setTab('email')}
              />
            )}
            */}

            {tab === 'email' && (
              <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Creating account...' : 'Create Account'}
                </div>
              </button>
            </form>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <button 
                  onClick={() => onNavigate?.('/signin')}
                  className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
