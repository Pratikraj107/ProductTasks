import { Wrench, Users, Target, FileText, Search, Plus, Download, Globe, Crosshair, Zap, DollarSign, BarChart3, Wallet, Megaphone, Shield } from 'lucide-react';
import { useRef, useState } from 'react';
import SEOHead from '../components/SEOHead';

type ToolKey = 'user_persona' | 'jtbd' | 'market_research' | 'product_details' | 'journey_map' | 'vision_board';

export default function Tools() {
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);

  const seo = (
    <SEOHead
      title="PM Productivity Tools — ProductTasks"
      description="Use ProductTasks built-in PM tools for personas, journey maps, research, product discovery, and more."
      canonical="https://producttasks.com/dashboard/tools"
      keywords={['product management tools', 'PM templates', 'productivity tools']}
    />
  );

  return (
    <main className="p-8">
      {seo}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Tools</h1>
        <p className="text-slate-400">Product management canvases to speed up your workflow</p>
      </div>

      {!activeTool && (
        <div className="grid md:grid-cols-3 gap-6">
          <ToolCard
            icon={<Users className="w-6 h-6" />}
            title="User Personas"
            description="Create detailed personas to understand your users."
            gradient="from-pink-600 to-rose-600"
            onOpen={() => setActiveTool('user_persona')}
          />
          <ToolCard
            icon={<Target className="w-6 h-6" />}
            title="Jobs To Be Done (JTBD)"
            description="Capture jobs, pains, and gains to frame problems."
            gradient="from-amber-600 to-orange-600"
            onOpen={() => setActiveTool('jtbd')}
          />
          <ToolCard
            icon={<Search className="w-6 h-6" />}
            title="Market Research"
            description="Analyze market, competitors, and positioning."
            gradient="from-blue-600 to-cyan-600"
            onOpen={() => setActiveTool('market_research')}
          />
          <ToolCard
            icon={<FileText className="w-6 h-6" />}
            title="Product Details"
            description="Capture core details about a product."
            gradient="from-violet-600 to-indigo-600"
            onOpen={() => setActiveTool('product_details')}
          />
          <ToolCard
            icon={<Wrench className="w-6 h-6" />}
            title="User Journey Map"
            description="Plot stages, touchpoints, emotions and opportunities."
            gradient="from-teal-600 to-emerald-600"
            onOpen={() => setActiveTool('journey_map')}
          />
          <ToolCard
            icon={<FileText className="w-6 h-6" />}
            title="Product Vision Board"
            description="Capture vision, target users, needs and business goals."
            gradient="from-fuchsia-600 to-pink-600"
            onOpen={() => setActiveTool('vision_board')}
          />
        </div>
      )}

      {activeTool === 'user_persona' && <UserPersona onBack={() => setActiveTool(null)} />}
      {activeTool === 'jtbd' && <JTBD onBack={() => setActiveTool(null)} />}
      {activeTool === 'market_research' && <MarketResearch onBack={() => setActiveTool(null)} />}
      {activeTool === 'product_details' && <ProductDetails onBack={() => setActiveTool(null)} />}
      {activeTool === 'journey_map' && <JourneyMap onBack={() => setActiveTool(null)} />}
      {activeTool === 'vision_board' && <ProductVisionBoard onBack={() => setActiveTool(null)} />}
    </div>
  );
}

function ToolCard({ icon, title, description, gradient, onOpen }: { icon: React.ReactNode; title: string; description: string; gradient: string; onOpen: () => void; }) {
  return (
    <div className="relative">
      <div className={`absolute -inset-0.5 bg-gradient-to-br ${gradient} rounded-3xl blur opacity-10`}></div>
      <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4`}>
          {icon}
        </div>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{description}</p>
        <button onClick={onOpen} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold">Open</button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
      <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
        <h3 className="text-white font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Field({ label, placeholder, textarea = false }: { label: string; placeholder: string; textarea?: boolean }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-semibold mb-2">{label}</label>
      {textarea ? (
        <textarea className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500" placeholder={placeholder} rows={4} />
      ) : (
        <input className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500" placeholder={placeholder} />
      )}
    </div>
  );
}

function Toolbar({ onBack, onExport }: { onBack: () => void; onExport?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button onClick={onBack} className="px-4 py-2 rounded-lg bg-slate-800 text-white">Back</button>
      <div className="flex items-center space-x-2">
        <button className="px-3 py-2 rounded-lg bg-slate-800 text-white">Reset</button>
        <button onClick={onExport} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Export</button>
      </div>
    </div>
  );
}

function UserPersona({ onBack }: { onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);
  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="grid lg:grid-cols-2 gap-6">
        <Section title="Basic Info">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Persona Name" placeholder="e.g., Priya (College Grad)" />
            <Field label="Age Range" placeholder="e.g., 22-28" />
            <Field label="Occupation / Job Title" placeholder="e.g., Product Analyst" />
            <Field label="Location" placeholder="e.g., Bangalore, India" />
          </div>
        </Section>
        <Section title="Demographics">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Education Level" placeholder="e.g., B.Tech in CS" />
            <Field label="Annual Income" placeholder="e.g., ₹6-12 LPA or $60K-$80K" />
            <Field label="Marital Status" placeholder="e.g., Single, Married, etc." />
            <Field label="Tech Savviness" placeholder="e.g., Beginner, Intermediate, Advanced" />
          </div>
        </Section>
        <Section title="Goals & Motivations">
          <Field label="Primary Goals" placeholder="What are they trying to achieve in their role/life?" textarea />
          <Field label="Motivations" placeholder="What motivates them? What drives their decisions?" textarea />
          <Field label="Success Metrics" placeholder="How do they measure success?" textarea />
        </Section>
        <Section title="Pain Points & Challenges">
          <Field label="Frustrations" placeholder="What frustrates them in their current workflow?" textarea />
          <Field label="Challenges" placeholder="What obstacles do they face?" textarea />
          <Field label="Current Workarounds" placeholder="How do they solve problems today?" textarea />
        </Section>
        <Section title="Behaviors & Habits">
          <Field label="Daily Routine" placeholder="Describe their typical day/week" textarea />
          <Field label="Tools & Technology" placeholder="What tools, apps, or platforms do they currently use?" textarea />
          <Field label="Information Sources" placeholder="Where do they get information? (blogs, forums, colleagues, etc.)" textarea />
        </Section>
        <Section title="Needs & Expectations">
          <Field label="Functional Needs" placeholder="What features/capabilities do they need?" textarea />
          <Field label="Emotional Needs" placeholder="What emotional outcomes are they seeking?" textarea />
          <Field label="Expectations" placeholder="What are their expectations from products/services?" textarea />
        </Section>
        <Section title="Decision-Making">
          <Field label="Decision Process" placeholder="How do they make purchasing/usage decisions?" textarea />
          <Field label="Influencers" placeholder="Who or what influences their decisions?" textarea />
          <Field label="Buying Criteria" placeholder="What factors are most important when choosing a solution?" textarea />
        </Section>
        <Section title="Quote & Personality">
          <Field label="Quotable Quote" placeholder="A memorable quote that captures this persona" textarea />
          <Field label="Personality Traits" placeholder="e.g., Analytical, Creative, Detail-oriented, etc." textarea />
        </Section>
      </div>
    </div>
  );
}

function JTBD({ onBack }: { onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);
  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="grid lg:grid-cols-2 gap-6">
        <Section title="Job Statement">
          <Field label="When..." placeholder="When I... (context)" textarea />
          <Field label="I want to..." placeholder="I want to... (motivation)" textarea />
          <Field label="So I can..." placeholder="So I can... (expected outcome)" textarea />
        </Section>
        <Section title="Forces Analysis">
          <Field label="Pains" placeholder="Current frustrations" textarea />
          <Field label="Gains" placeholder="Desired outcomes" textarea />
        </Section>
        <Section title="Acceptance Criteria">
          <Field label="How we know it's solved" placeholder="Success metrics / observable outcomes" textarea />
        </Section>
      </div>
    </div>
  );
}

function MarketResearch({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);

  const Item = ({ index, icon, title, children }: { index: number; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
      <div className="relative bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800">
        <button
          onClick={() => setOpen(open === index ? null : index)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="text-cyan-400">{icon}</div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <span className="text-slate-400">{open === index ? '▴' : '▾'}</span>
        </button>
        {open === index && (
          <div className="px-6 pb-6 space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="space-y-6">
        <Item index={0} icon={<Globe className="w-6 h-6" />} title="1. Market Overview">
          <Field label="Total Addressable Market (TAM)" placeholder="$XX billion" />
          <Field label="Market Growth Rate (YoY)" placeholder="XX%" />
          <Field label="Key Market Trends" placeholder="List major trends..." textarea />
          <Field label="Regulatory Considerations" placeholder="Any regulations to consider" textarea />
        </Item>

        <Item index={1} icon={<Crosshair className="w-6 h-6" />} title="2. Competitive Positioning Matrix">
          <CompetitiveMatrix />
        </Item>

        <Item index={2} icon={<Zap className="w-6 h-6" />} title="3. Feature Comparison">
          <Field label="Core Features" placeholder="List key features to compare" textarea />
          <Field label="Per-competitor Highlights" placeholder="Notable strengths/weaknesses by competitor" textarea />
        </Item>

        <Item index={3} icon={<DollarSign className="w-6 h-6" />} title="4. Pricing Strategy Analysis">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Pricing Model" placeholder="e.g., Subscription, Freemium, Usage-based" />
            <Field label="Anchor Price / Entry Price" placeholder="$ / ₹" />
          </div>
          <Field label="Discounts & Packaging" placeholder="Bundles, trials, discounts" textarea />
          <Field label="Notes" placeholder="Key rationale and risks" textarea />
        </Item>

        <Item index={4} icon={<Users className="w-6 h-6" />} title="5. Customer Research Findings">
          <Field label="Research Methods" placeholder="Surveys, interviews, usability tests" textarea />
          <Field label="Key Insights" placeholder="Top insights synthesized" textarea />
          <Field label="Verbatim Quotes" placeholder="Add memorable quotes (optional)" textarea />
        </Item>

        <Item index={5} icon={<BarChart3 className="w-6 h-6" />} title="6. Operational Metrics">
          <Field label="Primary KPIs" placeholder="Activation rate, retention, NPS, etc." textarea />
          <Field label="Operational Notes" placeholder="Operational constraints or SLAs" textarea />
        </Item>

        <Item index={6} icon={<Wallet className="w-6 h-6" />} title="7. Unit Economics">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="CAC" placeholder="$ / ₹" />
            <Field label="LTV" placeholder="$ / ₹" />
            <Field label="Contribution Margin" placeholder="%" />
          </div>
          <Field label="Assumptions" placeholder="Document key assumptions" textarea />
        </Item>

        <Item index={7} icon={<Megaphone className="w-6 h-6" />} title="8. Marketing & Acquisition Strategy">
          <Field label="Channels" placeholder="SEO, Paid, Partnerships, Community..." textarea />
          <Field label="Messaging / Positioning" placeholder="Core narrative to test" textarea />
          <Field label="Funnel Notes" placeholder="Top/mid/bottom funnel tactics" textarea />
        </Item>

        <Item index={8} icon={<Shield className="w-6 h-6" />} title="9. SWOT Analysis (Your Product)">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Strengths" placeholder="Internal advantages" textarea />
            <Field label="Weaknesses" placeholder="Internal limitations" textarea />
            <Field label="Opportunities" placeholder="External opportunities" textarea />
            <Field label="Threats" placeholder="External risks" textarea />
          </div>
        </Item>
      </div>
    </div>
  );
}

function CompetitiveMatrix() {
  const [companies, setCompanies] = useState<string[]>(['Blinkit', 'Zepto', 'Swiggy Instamart', 'BigBasket Now']);
  const [metrics, setMetrics] = useState<string[]>([
    'Delivery Speed',
    'Geographic Coverage',
    'Catalog Size',
    'Avg. Basket Size',
    'Dark Store Count',
    'App Rating',
    'Monthly Orders'
  ]);
  const [values, setValues] = useState<Record<string, string>>({});

  const keyFor = (row: number, col: number) => `${row}-${col}`;

  const updateCell = (row: number, col: number, val: string) => {
    setValues(prev => ({ ...prev, [keyFor(row, col)]: val }));
  };

  const updateCompany = (idx: number, val: string) => {
    const next = [...companies];
    next[idx] = val;
    setCompanies(next);
  };

  const updateMetric = (idx: number, val: string) => {
    const next = [...metrics];
    next[idx] = val;
    setMetrics(next);
  };

  const addCompany = () => setCompanies([...companies, `Company ${companies.length + 1}`]);
  const addMetric = () => setMetrics([...metrics, `Metric ${metrics.length + 1}`]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="X-Axis Label" placeholder="e.g., Feature-rich" />
        <Field label="Y-Axis Label" placeholder="e.g., Ease of use" />
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold">Editable Matrix</h4>
        <div className="space-x-2">
          <button onClick={addCompany} className="px-3 py-2 rounded-lg bg-slate-800 text-white">Add Company</button>
          <button onClick={addMetric} className="px-3 py-2 rounded-lg bg-slate-800 text-white">Add Metric</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr>
              <th className="text-left text-slate-300 text-sm px-3 py-2">Metric</th>
              {companies.map((c, ci) => (
                <th key={ci} className="px-3 py-2">
                  <input
                    value={c}
                    onChange={(e) => updateCompany(ci, e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 ${ci % 4 === 0 ? 'bg-blue-50/0' : ''}`}
                    placeholder={`Company ${ci + 1}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, ri) => (
              <tr key={ri}>
                <td className="px-3 py-2 w-64">
                  <input
                    value={m}
                    onChange={(e) => updateMetric(ri, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
                    placeholder={`Metric ${ri + 1}`}
                  />
                </td>
                {companies.map((_, ci) => (
                  <td key={ci} className="px-3 py-2">
                    <input
                      value={values[keyFor(ri, ci)] || ''}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500`}
                      placeholder={ri === 0 ? 'Minutes' : ri === 1 ? 'Cities' : ri === 2 ? 'SKUs' : ''}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductDetails({ onBack }: { onBack: () => void }) {
  const [marketShare, setMarketShare] = useState<number | ''>('');
  const marketShareVal = typeof marketShare === 'number' ? marketShare : 0;
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);

  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="grid lg:grid-cols-2 gap-6">
        <Section title="Basics">
          <Field label="Product Name" placeholder="e.g., Blinkit" />
          <Field label="Define the Product" placeholder="Short product definition" textarea />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Business Type</label>
              <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white">
                <option>B2C</option>
                <option>B2B</option>
                <option>Both</option>
              </select>
            </div>
            <Field label="Founded (Year)" placeholder="e.g., 2016" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Industry" placeholder="e.g., Quick Commerce" />
            <Field label="Country / Regions" placeholder="e.g., India" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Revenue" placeholder="e.g., $X million" />
            <Field label="Founder(s)" placeholder="Comma separated names" />
          </div>
        </Section>

        <Section title="Mission & Vision">
          <Field label="Mission" placeholder="Product mission" textarea />
          <Field label="Vision" placeholder="Product vision" textarea />
        </Section>

        <Section title="Market Share">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Market Share (%)</label>
              <input
                type="number"
                value={marketShare}
                onChange={(e) => setMarketShare(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                placeholder="e.g., 35"
                min={0}
                max={100}
              />
            </div>
            <div className="flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray={`${marketShareVal}, ${100 - marketShareVal}`}
                />
                <text x="18" y="20" className="rotate-90" textAnchor="middle" fill="#e2e8f0" fontSize="6">{marketShareVal}%</text>
              </svg>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// Utility: open a print window containing the provided element's HTML so user can export as PDF
function exportElement(element: HTMLElement | null) {
  if (!element) return;
  const printWindow = window.open('', 'PRINT', 'width=1024,height=768');
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head>${document.head.innerHTML}</head><body class="bg-white">`);
  printWindow.document.write(element.outerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

function JourneyMap({ onBack }: { onBack: () => void }) {
  const [stages, setStages] = useState<string[]>(['Awareness', 'Consideration', 'Signup', 'Onboarding', 'Retention']);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [thoughts, setThoughts] = useState<Record<string, string>>({});
  const [painPoints, setPainPoints] = useState<Record<string, string>>({});
  const [opportunities, setOpportunities] = useState<Record<string, string>>({});
  const [emotion, setEmotion] = useState<Record<string, number>>({}); // 0..100
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);

  const addStage = () => setStages([...stages, `Stage ${stages.length + 1}`]);
  const updateStage = (idx: number, val: string) => {
    const next = [...stages];
    next[idx] = val;
    setStages(next);
  };

  const Cell = ({ map, setMap, k, placeholder }: { map: Record<string, string>; setMap: (v: Record<string, string>) => void; k: string; placeholder: string; }) => (
    <textarea
      value={map[k] || ''}
      onChange={(e) => setMap({ ...map, [k]: e.target.value })}
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
      rows={3}
      placeholder={placeholder}
    />
  );

  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Journey Stages</h3>
          <button onClick={addStage} className="px-3 py-2 rounded-lg bg-slate-800 text-white">Add Stage</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr>
                {stages.map((s, i) => (
                  <th key={i} className="px-3 py-2 w-64">
                    <input
                      value={s}
                      onChange={(e) => updateStage(i, e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {stages.map((_, i) => (
                  <td key={`a-${i}`} className="align-top px-3 py-2">
                    <Cell map={actions} setMap={(v)=>setActions(v)} k={`s${i}`} placeholder="User actions / touchpoints" />
                  </td>
                ))}
              </tr>
              <tr>
                {stages.map((_, i) => (
                  <td key={`t-${i}`} className="align-top px-3 py-2">
                    <Cell map={thoughts} setMap={(v)=>setThoughts(v)} k={`s${i}`} placeholder="User thoughts / questions" />
                  </td>
                ))}
              </tr>
              <tr>
                {stages.map((_, i) => (
                  <td key={`p-${i}`} className="align-top px-3 py-2">
                    <Cell map={painPoints} setMap={(v)=>setPainPoints(v)} k={`s${i}`} placeholder="Pain points" />
                  </td>
                ))}
              </tr>
              <tr>
                {stages.map((_, i) => (
                  <td key={`o-${i}`} className="align-top px-3 py-2">
                    <Cell map={opportunities} setMap={(v)=>setOpportunities(v)} k={`s${i}`} placeholder="Opportunities / ideas" />
                  </td>
                ))}
              </tr>
              <tr>
                {stages.map((_, i) => (
                  <td key={`e-${i}`} className="px-3 py-4">
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={emotion[`s${i}`] ?? 50}
                        onChange={(e) => setEmotion({ ...emotion, [`s${i}`]: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="h-2 bg-slate-800 rounded">
                        <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded" style={{ width: `${emotion[`s${i}`] ?? 50}%` }} />
                      </div>
                      <div className="text-center text-slate-300 text-xs">Emotion: {emotion[`s${i}`] ?? 50}%</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <Section title="Notes">
          <Field label="Observations & Insights" placeholder="Key takeaways across the journey" textarea />
        </Section>
      </div>
    </div>
  );
}

function ProductVisionBoard({ onBack }: { onBack: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onExport = () => exportElement(ref.current);

  return (
    <div>
      <Toolbar onBack={onBack} onExport={onExport} />
      <div ref={ref} className="grid lg:grid-cols-2 gap-6">
        <Section title="Vision">
          <Field label="Product Vision" placeholder="The north star for your product" textarea />
          <Field label="Mission" placeholder="How you'll deliver the vision" textarea />
        </Section>
        <Section title="Target Group">
          <Field label="Primary Users" placeholder="Who is this for?" textarea />
          <Field label="Segments" placeholder="Key segments or ICPs" textarea />
        </Section>
        <Section title="User Needs / Problems">
          <Field label="Top Needs" placeholder="What problems are we solving?" textarea />
          <Field label="Current Alternatives" placeholder="What do users do today?" textarea />
        </Section>
        <Section title="Product / Features">
          <Field label="Positioning Statement" placeholder="For [user], our product [does] unlike [alternative]" textarea />
          <Field label="High-level Features" placeholder="Key capabilities to solve needs" textarea />
        </Section>
        <Section title="Business Goals & Metrics">
          <Field label="Business Goals" placeholder="Revenue, growth, retention, margin, etc." textarea />
          <Field label="Success Metrics" placeholder="How will we measure success?" textarea />
        </Section>
        <Section title="Constraints & Risks">
          <Field label="Constraints" placeholder="Tech, compliance, resources, time" textarea />
          <Field label="Risks & Unknowns" placeholder="Key risks and mitigation ideas" textarea />
        </Section>
        <Section title="Roadmap Snapshot (Optional)">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Now" placeholder="Immediate themes" textarea />
            <Field label="Next" placeholder="Near-term themes" textarea />
            <Field label="Later" placeholder="Future themes" textarea />
          </div>
        </Section>
        <Section title="Notes">
          <Field label="Additional Notes" placeholder="Anything else to align the team" textarea />
        </Section>
      </div>
    </div>
  );
}


