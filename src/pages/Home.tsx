import { useState, useEffect } from 'react';
import {
  Rocket,
  Mic,
  MessageSquare,
  CheckCircle2,
  Users,
  Menu,
  X,
  ArrowRight,
  Zap,
  Brain,
  Star,
  Sparkles,
  LogOut,
  Shield,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/PaymentModal';

interface HomeProps {
  onNavigate?: (path: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ type: 'monthly' | 'yearly'; amount: number; display: string } | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "AI Mock Interview",
      description: "Practice with 600+ real PM interview questions. Get instant AI-powered feedback on clarity, content, completeness, and PM framework usage.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "600+ Interview Questions",
      description: "Comprehensive collection covering Product Design, Strategy, Metrics, Estimation, Behavioral, and Technical questions.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Feedback",
      description: "Get detailed feedback on your answers covering clarity, content quality, completeness, and PM framework application.",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-Time Transcription",
      description: "Speak your answers naturally. Our AI transcribes your responses in real-time and provides comprehensive feedback.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "PM Framework Mastery",
      description: "Learn to apply CIRCLES, AARM, STAR, and other essential PM frameworks correctly in your interview answers.",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Practice Anytime",
      description: "Record, pause, resume, and re-record your answers. Practice at your own pace with unlimited attempts.",
      gradient: "from-teal-500 to-cyan-500"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "Forever",
      description: "Perfect for getting started",
      features: [
        "Limited AI mock interviews",
        "Access to sample questions",
        "Basic feedback",
        "Community access"
      ],
      gradient: "from-slate-500 to-gray-500",
      buttonText: "Get Started Free",
      popular: false
    },
    {
      name: "Monthly",
      price: "₹800",
      period: "per month",
      description: "Best for focused preparation",
      features: [
        "50 AI interview questions per month",
        "Full AI-powered feedback",
        "Real-time transcription",
        "All 600+ questions access",
        "PM framework guidance",
        "Priority support"
      ],
      gradient: "from-blue-500 to-cyan-500",
      buttonText: "Start Monthly Plan",
      popular: true
    },
    {
      name: "Yearly",
      price: "₹6,000",
      period: "per year",
      description: "Best value for serious prep",
      features: [
        "600 AI interview questions per year",
        "Full AI-powered feedback",
        "Real-time transcription",
        "All 600+ questions access",
        "PM framework guidance",
        "Priority support",
        "Save ₹3,600 annually"
      ],
      gradient: "from-green-500 to-emerald-500",
      buttonText: "Start Yearly Plan",
      popular: false,
      savings: "Save 37%"
    }
  ];

  const stats = [
    { value: "600+", label: "Interview Questions" },
    { value: "AI", label: "Powered Feedback" },
    { value: "24/7", label: "Practice Anytime" },
    { value: "1000+", label: "Successful Candidates" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
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

      <nav className="fixed top-0 w-full bg-slate-950/50 backdrop-blur-xl z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ProductTasks
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate?.('/signup')}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-full font-semibold">
                    Get Started
                  </div>
                </button>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-300 hover:text-cyan-400 transition-colors font-medium">Features</a>
              <a href="#pricing" className="block text-slate-300 hover:text-cyan-400 transition-colors font-medium">Pricing</a>
              {user ? (
                <>
                  <div className="text-slate-400 text-sm pt-2 border-t border-slate-800">{user.email}</div>
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-red-600 text-white px-6 py-2 rounded-full font-semibold flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => onNavigate?.('/signup')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-full font-semibold"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 backdrop-blur-sm rounded-full px-5 py-2 mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/20 to-blue-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-cyan-300 relative z-10">Ace Your Product Management Interviews</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
              <span className="block mb-2">Master PM Interviews</span>
              <span className="block mb-2">with AI-Powered</span>
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 blur-2xl opacity-50"></span>
                <span className="relative bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-pulse">Mock Interviews</span>
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Practice with 600+ real PM interview questions. Get instant AI feedback on your answers, master PM frameworks, and land your dream product management role.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => onNavigate?.('/signup')}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition duration-500 group-hover:animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-10 py-5 rounded-full font-bold text-lg flex items-center space-x-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Mic className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </button>
              <a 
                href="#features"
                className="group relative bg-slate-900/50 border-2 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 backdrop-blur-sm flex items-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>See How It Works</span>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
              {stats.map((stat, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 group-hover:border-cyan-500/50 transition-all duration-300">
                    <div className="text-5xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-slate-400 font-medium text-sm">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black mb-6">
              Everything You Need to
              <span className="block mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Ace Your Interview</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Comprehensive interview preparation powered by AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-500 h-full cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="relative text-2xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors duration-300">{feature.title}</h3>
                  <p className="relative text-slate-400 leading-relaxed">{feature.description}</p>
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Choose Your Plan</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-black mb-6">
              Simple, Transparent
              <span className="block mt-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Pricing</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Start free, upgrade when you're ready. All plans include access to our comprehensive question bank.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`group relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      {plan.savings}
                    </div>
                  </div>
                )}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${plan.gradient} rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500 ${plan.popular ? 'opacity-20' : ''}`}></div>
                <div className={`relative bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border ${plan.popular ? 'border-cyan-500/50' : 'border-slate-800'} hover:border-cyan-500/50 transition-all duration-500 h-full flex flex-col`}>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-black bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-slate-400 text-lg">/{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 flex-1 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onNavigate?.('/signup')}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
                        : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm">
              All plans include access to our community and resources. No credit card required for free plan.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 z-10">
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-teal-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-16 border border-slate-800 text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-full px-5 py-2 mb-8">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">Start Your Journey Today</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-black mb-6 leading-tight">
              Ready to Ace Your
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">PM Interview?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
              Join thousands of candidates who have successfully landed their dream PM roles with ProductTasks
            </p>
            <button 
              onClick={() => onNavigate?.('/signup')}
              className="group relative inline-flex mb-8"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-12 py-6 rounded-full font-black text-xl flex items-center space-x-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Rocket className="w-6 h-6 relative z-10" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </button>
            <p className="text-slate-500 flex items-center justify-center space-x-4 flex-wrap gap-4">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-cyan-500" />
                <span>Start practicing immediately</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Cancel anytime</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-lg">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ProductTasks</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">Your complete platform for PM interview preparation</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Features</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>AI Mock Interviews</span></a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>600+ Questions</span></a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>AI Feedback</span></a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>PM Frameworks</span></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>About Us</span></a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>Contact</span></a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>Privacy Policy</span></a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>Terms of Service</span></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>Help Center</span></a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>FAQs</span></a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors flex items-center space-x-2 group"><ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /><span>Contact Support</span></a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-12 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2025 ProductTasks. All rights reserved. Built for aspiring product managers.</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          planType={selectedPlan.type}
          amount={selectedPlan.amount}
          amountDisplay={selectedPlan.display}
          onSuccess={() => {
            // Refresh page or update subscription status
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
