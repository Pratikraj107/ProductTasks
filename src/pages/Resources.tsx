import { Link, BookOpen, Video, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SEOHead from '../components/SEOHead';
import type { Resource } from '../lib/database.types';

interface CategoryConfig {
  title: string;
  type: string;
  icon: JSX.Element;
  gradient: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories: CategoryConfig[] = [
    {
      title: 'Case Studies',
      type: 'Case Studies',
      icon: <BookOpen className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Articles & Blogs',
      type: 'Articles',
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Video Content',
      type: 'Video',
      icon: <Video className="w-6 h-6" />,
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      title: 'Tools & Templates',
      type: 'Templates',
      icon: <Link className="w-6 h-6" />,
      gradient: 'from-orange-500 to-amber-500'
    },
  ];

  useEffect(() => {
    async function fetchResources() {
      try {
        const { data, error } = await supabase
          .from('product_resource')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching resources:', error);
        } else {
          setResources(data || []);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  const getResourcesByType = (type: string) => {
    return resources.filter(resource => resource.type === type);
  };

  const seo = (
    <SEOHead
      title="Product Management Resources — ProductTasks"
      description="Access curated PM resources, case studies, templates, and videos to support your product management interview and career preparation."
      canonical="https://producttasks.com/dashboard/resources"
      keywords={['product management resources', 'PM templates', 'product management reading']}
    />
  );

  const handleResourceClick = (resourceLink: string | null) => {
    if (resourceLink) {
      window.open(resourceLink, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleCategoryExpansion = (categoryType: string) => {
    setExpandedCategory(expandedCategory === categoryType ? null : categoryType);
  };

  if (loading) {
    return (
      <main className="p-8">
        {seo}
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      {seo}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Product Resources</h1>
        <p className="text-slate-400">Curated collection of the best PM resources</p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => {
          const categoryResources = getResourcesByType(category.type);
          const isExpanded = expandedCategory === category.type;
          const displayResources = isExpanded ? categoryResources : categoryResources.slice(0, 3);
          const hasMore = categoryResources.length > 3;

          if (categoryResources.length === 0) return null;

          return (
            <div key={category.type} className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                  <span className="text-slate-400 text-sm">({categoryResources.length})</span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayResources.map((resource) => (
                    <div
                      key={resource.id}
                      onClick={() => handleResourceClick(resource.resource_link)}
                      className="group relative bg-slate-800/50 hover:bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                    >
                      {resource.pic_url && (
                        <div className="mb-3">
                          <img 
                            src={resource.pic_url} 
                            alt={resource.title || 'Resource image'}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1 group-hover:text-cyan-400 transition-colors">
                            {resource.title || 'Untitled Resource'}
                          </h3>
                          {resource.description && (
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{resource.description}</p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                      </div>
                      {resource.type && (
                        <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-semibold">
                          {resource.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => toggleCategoryExpansion(category.type)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all duration-300"
                    >
                      <span>{isExpanded ? 'Show Less' : `See More (${categoryResources.length - 3} more)`}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-600 to-rose-600 rounded-3xl blur opacity-20"></div>
        <div className="relative bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-xl rounded-3xl p-8 border border-pink-500/30">
          <h3 className="text-2xl font-bold text-white mb-4">Want to Add a Resource?</h3>
          <p className="text-slate-300 mb-6">Know a great PM resource that should be here? Share it with the community!</p>
          <a 
            href="https://discord.gg/kMCjN45F" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all inline-block"
          >
            Suggest a Resource
          </a>
        </div>
      </div>
    </div>
  );
}
