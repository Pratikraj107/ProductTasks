import SEOHead from '../components/SEOHead';

export default function Terms() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-20">
      <SEOHead
        title="Terms of Service — ProductTasks"
        description="ProductTasks terms of service. Review the terms governing your use of our PM interview prep platform."
        canonical="https://producttasks.com/terms"
        keywords={['terms of service', 'ProductTasks terms', 'user agreement']}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        <h1 className="text-5xl font-black text-white">Terms of Service</h1>
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-10 shadow-lg shadow-black/20 space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Acceptance of terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By using ProductTasks, you agree to these terms and the policies that govern your access to our AI-powered PM interview preparation platform.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Description of service</h2>
            <p className="text-slate-300 leading-relaxed">
              ProductTasks provides AI mock interviews, interview practice content, resume assistance, and related productivity tools for product management candidates.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">User accounts and responsibilities</h2>
            <p className="text-slate-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for any activity on your account. Use the platform ethically and follow applicable laws.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Subscription and billing</h2>
            <p className="text-slate-300 leading-relaxed">
              Paid plans start at ₹800/month or ₹6,000/year. You may cancel anytime through your account settings. Fees are charged in INR and are non-refundable after the billing period begins, except as required by law.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Intellectual property</h2>
            <p className="text-slate-300 leading-relaxed">
              All ProductTasks content, branding, and software is owned by ProductTasks or its licensors. You may not copy, redistribute, or resell our materials without permission.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Limitation of liability</h2>
            <p className="text-slate-300 leading-relaxed">
              ProductTasks is provided as-is. We are not liable for indirect damages, lost opportunities, or interview outcomes. Liability is limited to the maximum extent permitted by law.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For legal questions, contact us at <a href="mailto:legal@producttasks.com" className="text-cyan-400 hover:text-cyan-300">legal@producttasks.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
