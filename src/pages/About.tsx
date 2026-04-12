import SEOHead from '../components/SEOHead';

export default function About() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-20">
      <SEOHead
        title="About ProductTasks — AI PM Interview Prep Platform"
        description="Learn about ProductTasks, the AI-powered platform helping product managers prepare for interviews with 600+ questions and instant feedback."
        canonical="https://producttasks.com/about"
        keywords={[
          'about ProductTasks',
          'PM interview prep platform',
          'AI interview preparation',
        ]}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-5xl font-black text-white">About ProductTasks</h1>
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-10 shadow-lg shadow-black/20">
          <p className="text-lg text-slate-300 leading-relaxed mb-6">
            ProductTasks is an AI-powered platform built to help aspiring and practicing product managers prepare for PM interviews with confidence. We offer 600+ real interview questions, voice-based mock interviews with real-time AI feedback, and structured guidance on PM frameworks like CIRCLES, AARM, and STAR.
          </p>
          <p className="text-lg text-slate-300 leading-relaxed mb-6">
            Built for the Indian PM community, ProductTasks is designed to be affordable and accessible — because everyone deserves a fair shot at their dream PM role.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity duration-200"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
