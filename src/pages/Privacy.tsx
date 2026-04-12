import SEOHead from '../components/SEOHead';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-20">
      <SEOHead
        title="Privacy Policy — ProductTasks"
        description="ProductTasks privacy policy. Learn how we collect, use, and protect your data."
        canonical="https://producttasks.com/privacy"
        keywords={['privacy policy', 'data protection', 'ProductTasks privacy']}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-5xl font-black text-white">Privacy Policy</h1>
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-10 shadow-lg shadow-black/20 space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">What data we collect</h2>
            <p className="text-slate-300 leading-relaxed">
              We collect your email address, usage data, and interview session details. If you choose to record voice responses, we may also store transcription data to provide feedback and improve the service.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">How we use it</h2>
            <p className="text-slate-300 leading-relaxed">
              We use this data to provide the ProductTasks service, deliver AI feedback, personalize your experience, and improve mock interview quality over time.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Third-party services</h2>
            <p className="text-slate-300 leading-relaxed">
              We use Supabase for data storage and authentication, and analytics tools such as Google Tag Manager and Microsoft Clarity to understand feature usage and improve performance.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Data retention and deletion</h2>
            <p className="text-slate-300 leading-relaxed">
              You can request deletion of your data at any time by contacting us. We retain data only as long as needed to provide the service and comply with legal obligations.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have privacy questions, email us at <a href="mailto:privacy@producttasks.com" className="text-cyan-400 hover:text-cyan-300">privacy@producttasks.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
