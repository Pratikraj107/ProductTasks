import { FileText, Plus, X, Download, Mail, Phone, MapPin, Linkedin, Globe, Image as ImageIcon, Layout, Upload, Sparkles } from 'lucide-react';
import { useRef, useState, memo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

// Move Field component outside to prevent recreation
const Field = memo(({ label, value, onChange, placeholder, textarea = false, type = 'text' }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  textarea?: boolean;
  type?: string;
}) => (
  <div>
    <label className="block text-slate-300 text-sm font-semibold mb-2">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        placeholder={placeholder}
        rows={3}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        placeholder={placeholder}
      />
    )}
  </div>
));

// Move Section component outside
const Section = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
    <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
      <h3 className="text-white font-bold text-lg mb-4">{title}</h3>
      {children}
    </div>
  </div>
));

type TemplateType = 'classic' | 'minimalist' | 'creative' | 'professional';

// Configure PDF.js worker - use local worker file from public folder
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default function Resume() {
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeUploadRef = useRef<HTMLInputElement>(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([{
    id: '1',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  }]);

  const [educations, setEducations] = useState<Education[]>([{
    id: '1',
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: ''
  }]);

  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState<Project[]>([{
    id: '1',
    name: '',
    description: '',
    technologies: ''
  }]);

  const [certifications, setCertifications] = useState<Certification[]>([{
    id: '1',
    name: '',
    issuer: '',
    date: '',
    url: ''
  }]);

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const addEducation = () => {
    setEducations([...educations, {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: ''
    }]);
  };

  const removeEducation = (id: string) => {
    if (educations.length > 1) {
      setEducations(educations.filter(edu => edu.id !== id));
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addProject = () => {
    setProjects([...projects, {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: ''
    }]);
  };

  const removeProject = (id: string) => {
    if (projects.length > 1) {
      setProjects(projects.filter(proj => proj.id !== id));
    }
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setProjects(projects.map(proj => 
      proj.id === id ? { ...proj, [field]: value } : proj
    ));
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      url: ''
    }]);
  };

  const removeCertification = (id: string) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter(cert => cert.id !== id));
    }
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setCertifications(certifications.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    ));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Better text extraction preserving line structure
        let pageText = '';
        let lastY = -1;
        
        textContent.items.forEach((item: any) => {
          const y = item.transform[5]; // Y coordinate
          if (lastY !== -1 && Math.abs(y - lastY) > 5) {
            pageText += '\n'; // New line if Y position changed significantly
          }
          pageText += item.str + ' ';
          lastY = y;
        });
        
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF:', error);
      throw error;
    }
  };

  const parseResumeData = (text: string) => {
    const data: any = {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        portfolio: '',
        summary: ''
      },
      experiences: [],
      educations: [],
      skills: '',
      projects: [],
      certifications: []
    };

    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      data.personalInfo.email = emailMatch[0];
    }

    // Extract phone (various formats including international)
    const phonePatterns = [
      /\+\d{1,3}[-.\s]?\d{6,14}/, // International format like +91 7544803884
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\d{10}/ // Simple 10 digit
    ];
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        data.personalInfo.phone = phoneMatch[0].trim();
        break;
      }
    }

    // Extract LinkedIn URL
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/company\/)[\w-]+/i);
    if (linkedinMatch) {
      data.personalInfo.linkedin = linkedinMatch[0];
    }

    // Extract website/portfolio (exclude LinkedIn)
    const websiteMatches = text.match(/https?:\/\/[^\s\n]+/g);
    if (websiteMatches) {
      const portfolio = websiteMatches.find(url => !url.includes('linkedin'));
      if (portfolio) {
        data.personalInfo.portfolio = portfolio;
      }
    }

    // Extract name (handle both Title Case and ALL CAPS)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    if (lines.length > 0) {
      // Look for name pattern - can be Title Case or ALL CAPS
      for (const line of lines.slice(0, 10)) {
        const cleanLine = line.replace(/\s+/g, ' ').trim();
        // Skip if it's clearly not a name (has email, phone, URL, or too long)
        if (cleanLine.includes('@') || cleanLine.match(/\+?\d{10,}/) || cleanLine.includes('http') || cleanLine.length > 60) {
          continue;
        }
        // Match: 2-4 words, either Title Case or ALL CAPS
        if (cleanLine.match(/^[A-Z][A-Z\s]{2,40}$/) || cleanLine.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/)) {
          // Convert ALL CAPS to Title Case for better display
          if (cleanLine === cleanLine.toUpperCase() && cleanLine.length < 30) {
            data.personalInfo.fullName = cleanLine.split(' ').map(word => 
              word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ');
          } else {
            data.personalInfo.fullName = cleanLine;
          }
          break;
        }
      }
      // Fallback: use first substantial line if no pattern match
      if (!data.personalInfo.fullName && lines[0] && !lines[0].includes('@') && !lines[0].match(/\d{10}/)) {
        data.personalInfo.fullName = lines[0].substring(0, 50);
      }
    }

    // Extract location (City, State or City, Country format)
    const locationPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*[A-Z]{2}\b/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*[A-Z][a-z]+\b/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*[A-Z][a-z]+/ // More flexible
    ];
    for (const pattern of locationPatterns) {
      const locationMatch = text.match(pattern);
      if (locationMatch && !locationMatch[0].toLowerCase().includes('university') && 
          !locationMatch[0].toLowerCase().includes('college')) {
        data.personalInfo.location = locationMatch[0].trim();
        break;
      }
    }

    // Extract summary/objective - improved to stop at SKILLS section
    const summaryPatterns = [
      /(?:summary|objective|profile|about|overview)[:\s\n]+(.*?)(?=skills|experience|education|work|employment|$)/is,
      /(?:professional\s+summary|executive\s+summary)[:\s\n]+(.*?)(?=skills|experience|education|work|$)/is
    ];
    for (const pattern of summaryPatterns) {
      const summaryMatch = text.match(pattern);
      if (summaryMatch) {
        let summary = summaryMatch[1].trim();
        // Remove "SKILLS" if it appears in the summary (common parsing error)
        summary = summary.replace(/\s*SKILLS.*$/i, '');
        summary = summary.replace(/\s+/g, ' ').substring(0, 500);
        data.personalInfo.summary = summary;
        break;
      }
    }

    // Extract work experience - improved parsing
    const experienceSection = text.match(/(?:work\s+experience|employment|professional\s+experience|experience|career)[:\s\n]+(.*?)(?=education|skills|certification|projects|$)/is);
    if (experienceSection) {
      const expText = experienceSection[1];
      
      // Split by date patterns or new lines with position titles
      const entries = expText.split(/(?=\d{1,2}\/\d{4}|\d{4}\s*[-–]|\w+\s+\d{4}\s*[-–]|^[A-Z][a-z]+\s+[A-Z]|^[A-Z][A-Z\s]{5,})/m);
      
      entries.slice(0, 10).forEach((entry, idx) => {
        const cleanEntry = entry.trim();
        if (cleanEntry.length < 15) return; // Skip very short entries
        
        const lines = cleanEntry.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length >= 1) {
          // First line is usually position or company
          const firstLine = lines[0];
          let position = '';
          let company = '';
          
          // Try to identify position (often has "Manager", "Engineer", "Developer", etc.)
          const positionKeywords = /(Manager|Engineer|Developer|Analyst|Designer|Lead|Director|Specialist|Consultant|Coordinator)/i;
          if (positionKeywords.test(firstLine)) {
            position = firstLine.substring(0, 100);
            company = lines[1] || '';
          } else {
            // Might be company first, then position
            company = firstLine.substring(0, 100);
            position = lines[1] || '';
          }
          
          // Extract dates
          const dateMatch = cleanEntry.match(/(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4})\s*[-–]\s*(\d{1,2}\/\d{4}|\d{4}|\w+\s+\d{4}|present|current)/i);
          
          // Extract description (remaining lines)
          const descriptionLines = lines.slice(2).filter(l => 
            !l.match(/^\d{4}$/) && // Not just a year
            !l.match(/^(present|current)$/i) && // Not just "present"
            l.length > 10 // Substantial content
          );
          
          if (position || company) {
            data.experiences.push({
              id: `extracted-${Date.now()}-${idx}`,
              position: position || 'Position',
              company: company || 'Company',
              startDate: dateMatch ? dateMatch[1] : '',
              endDate: dateMatch && !dateMatch[2].toLowerCase().includes('present') && !dateMatch[2].toLowerCase().includes('current') ? dateMatch[2] : '',
              current: dateMatch ? (dateMatch[2].toLowerCase().includes('present') || dateMatch[2].toLowerCase().includes('current')) : false,
              description: descriptionLines.join(' ').substring(0, 500)
            });
          }
        }
      });
    }

    // Extract education - improved parsing
    const educationSection = text.match(/(?:education|academic|qualifications)[:\s\n]+(.*?)(?=experience|skills|certification|projects|work|objective|$)/is);
    if (educationSection) {
      const eduText = educationSection[1];
      // Split by common patterns: degree indicators, years, or new lines with capital letters
      const entries = eduText.split(/(?=\b(?:MSc|BSc|MS|BS|MBA|PhD|Bachelor|Master|Diploma|Degree|in)\b|\d{4}|^[A-Z][a-z]+\s+University|^[A-Z][a-z]+\s+College)/i);
      
      entries.slice(0, 5).forEach((entry, idx) => {
        const cleanEntry = entry.trim();
        if (cleanEntry.length < 10) return; // Skip very short entries
        
        // Extract degree (MSc, BSc, MS, etc.)
        const degreeMatch = cleanEntry.match(/\b(MSc|BSc|MS|BS|MBA|PhD|Bachelor|Master|Diploma|Degree)[\s\.]*(?:in|of)?\s*([^\n]+?)(?:\s+University|\s+College|\d{4}|$)/i);
        
        // Extract institution (University, College patterns)
        const institutionMatch = cleanEntry.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College|Institute|School|Academy))/i);
        
        // Extract location (city name before or after institution)
        const locationMatch = cleanEntry.match(/\b([A-Z][a-z]+)\b(?=\s*$|\s*\d{4})/);
        
        // Extract year
        const yearMatch = cleanEntry.match(/\b(19|20)\d{2}\b/);
        
        // Extract GPA
        const gpaMatch = cleanEntry.match(/GPA[:\s]+([\d.]+)/i);
        
        if (degreeMatch || institutionMatch) {
          let degree = '';
          let field = '';
          
          if (degreeMatch) {
            degree = (degreeMatch[1] || '').trim();
            field = (degreeMatch[2] || '').trim();
            // Clean up field - remove institution name if present
            if (institutionMatch) {
              field = field.replace(institutionMatch[1], '').trim();
            }
          }
          
          data.educations.push({
            id: `extracted-edu-${Date.now()}-${idx}`,
            degree: degree || field || 'Degree',
            institution: institutionMatch ? institutionMatch[1].trim() : '',
            field: field && field !== degree ? field : '',
            startDate: '',
            endDate: yearMatch ? yearMatch[0] : '',
            gpa: gpaMatch ? gpaMatch[1] : ''
          });
        }
      });
    }

    // Extract skills - improved to handle comma-separated and multiline
    const skillsSection = text.match(/(?:skills|technical\s+skills|competencies|core\s+competencies)[:\s\n]+(.*?)(?=experience|education|work|employment|certification|projects|$)/is);
    if (skillsSection) {
      let skillsText = skillsSection[1].trim();
      
      // Clean up: remove extra whitespace, normalize separators
      skillsText = skillsText.replace(/\s+/g, ' ');
      skillsText = skillsText.replace(/\s*,\s*/g, ', ');
      skillsText = skillsText.replace(/\s*&\s*/g, ' & ');
      
      // Remove common trailing text
      skillsText = skillsText.replace(/\s*&?\s*Met.*$/i, '');
      skillsText = skillsText.replace(/\s*\.\.\..*$/, '');
      
      // Limit length but try to end at a comma
      if (skillsText.length > 500) {
        const truncated = skillsText.substring(0, 500);
        const lastComma = truncated.lastIndexOf(',');
        if (lastComma > 400) {
          data.skills = truncated.substring(0, lastComma);
        } else {
          data.skills = truncated;
        }
      } else {
        data.skills = skillsText;
      }
    }

    return data;
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsExtracting(true);
    try {
      const text = await extractTextFromPDF(file);
      const extractedData = parseResumeData(text);

      // Pre-fill form with extracted data
      setPersonalInfo(prev => ({
        fullName: extractedData.personalInfo.fullName || prev.fullName,
        email: extractedData.personalInfo.email || prev.email,
        phone: extractedData.personalInfo.phone || prev.phone,
        location: extractedData.personalInfo.location || prev.location,
        linkedin: extractedData.personalInfo.linkedin || prev.linkedin,
        portfolio: extractedData.personalInfo.portfolio || prev.portfolio,
        summary: extractedData.personalInfo.summary || prev.summary
      }));
      
      if (extractedData.experiences.length > 0) {
        setExperiences(extractedData.experiences);
      }
      if (extractedData.educations.length > 0) {
        setEducations(extractedData.educations);
      }
      if (extractedData.skills) {
        setSkills(extractedData.skills);
      }

      alert('Resume data extracted successfully! Please review and edit the fields.');
    } catch (error) {
      console.error('Error processing resume:', error);
      alert('Error extracting data from resume. Please try again or fill manually.');
    } finally {
      setIsExtracting(false);
      if (resumeUploadRef.current) {
        resumeUploadRef.current.value = '';
      }
    }
  };

  const exportToPDF = () => {
    if (!previewRef.current) return;
    const printWindow = window.open('', 'PRINT', 'width=1024,height=768');
    if (!printWindow) return;
    
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');
    
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          ${styles}
          <style>
            @media print {
              body { background: white; color: black; padding: 0; margin: 0; }
              .resume-preview { box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body style="background: white; padding: 40px;">
          ${previewRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleAIReview = async () => {
    // Check if there's any resume data
    const hasData = personalInfo.fullName || 
                    experiences.some(exp => exp.company || exp.position) ||
                    educations.some(edu => edu.institution || edu.degree) ||
                    skills.trim();

    if (!hasData) {
      alert('Please fill in some resume information before requesting an AI review.');
      return;
    }

    setIsReviewing(true);
    try {
      const resumeData = {
        personalInfo,
        experiences,
        educations,
        skills,
        projects,
        certifications
      };

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/resume/review-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setReviewResult(result);
      
      // Scroll to review results
      setTimeout(() => {
        const reviewElement = document.getElementById('ai-review-results');
        if (reviewElement) {
          reviewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error: any) {
      console.error('Error getting AI review:', error);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      alert(`Error getting AI review: ${error.message || `Make sure the backend is running on ${API_BASE_URL}`}`);
    } finally {
      setIsReviewing(false);
    }
  };

  const templates = [
    { id: 'classic' as TemplateType, name: 'Classic', supportsPhoto: true, description: 'Traditional layout with photo' },
    { id: 'minimalist' as TemplateType, name: 'Minimalist', supportsPhoto: false, description: 'Clean and simple design' },
    { id: 'creative' as TemplateType, name: 'Creative', supportsPhoto: true, description: 'Modern with color accents' },
    { id: 'professional' as TemplateType, name: 'Professional', supportsPhoto: true, description: 'Corporate style layout' },
  ];

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'classic':
        return <ClassicTemplate data={{ personalInfo, experiences, educations, skills, projects, certifications, profilePhoto }} />;
      case 'minimalist':
        return <MinimalistTemplate data={{ personalInfo, experiences, educations, skills, projects, certifications }} />;
      case 'creative':
        return <CreativeTemplate data={{ personalInfo, experiences, educations, skills, projects, certifications, profilePhoto }} />;
      case 'professional':
        return <ProfessionalTemplate data={{ personalInfo, experiences, educations, skills, projects, certifications, profilePhoto }} />;
      default:
        return <ClassicTemplate data={{ personalInfo, experiences, educations, skills, projects, certifications, profilePhoto }} />;
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Resume Builder</h1>
            <p className="text-slate-400">Create and export your professional resume</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => resumeUploadRef.current?.click()}
              disabled={isExtracting}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-500 disabled:to-emerald-500 text-white font-semibold transition-all"
            >
              {isExtracting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Resume</span>
                </>
              )}
            </button>
            <input
              ref={resumeUploadRef}
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <button
              onClick={handleAIReview}
              disabled={isReviewing}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-500 disabled:to-pink-500 text-white font-semibold transition-all"
            >
              {isReviewing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>AI Review</span>
                </>
              )}
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
            >
              <Download className="w-5 h-5" />
              <span>Download Resume</span>
            </button>
          </div>
        </div>
        
        {/* Template Selector */}
        <div className="flex items-center space-x-4 mb-4">
          <Layout className="w-5 h-5 text-slate-400" />
          <span className="text-slate-300 font-semibold">Template:</span>
          <div className="flex items-center space-x-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedTemplate === template.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left Side - Form */}
        <div className="overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          <Section title="Personal Information">
            {templates.find(t => t.id === selectedTemplate)?.supportsPhoto && (
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-semibold mb-2">Profile Photo</label>
                <div className="flex items-center space-x-4">
                  {profilePhoto ? (
                    <>
                      <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500" />
                      <button
                        onClick={removePhoto}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                      >
                        Upload Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Name"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                placeholder="John Doe"
              />
              <Field
                label="Location"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
              <Field
                label="Phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                placeholder="(555) 123-4567"
                type="tel"
              />
              <Field
                label="Email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                placeholder="john.doe@email.com"
                type="email"
              />
              <Field
                label="LinkedIn"
                value={personalInfo.linkedin}
                onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                placeholder="linkedin.com/in/johndoe"
              />
              <Field
                label="Website / Portfolio"
                value={personalInfo.portfolio}
                onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                placeholder="johndoe.com"
              />
            </div>
            <div className="mt-4">
              <Field
                label="Objective / Summary"
                value={personalInfo.summary}
                onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                placeholder="Brief summary of your professional background and key strengths..."
                textarea
              />
            </div>
          </Section>

          <Section title="Work Experience">
            {experiences.map((exp, idx) => (
              <div key={exp.id} className={idx > 0 ? 'mt-6 pt-6 border-t border-slate-700' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-cyan-400 font-semibold">Experience {idx + 1}</h4>
                  {experiences.length > 1 && (
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="Company Name"
                  />
                  <Field
                    label="Position"
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                    placeholder="Product Manager"
                  />
                  <Field
                    label="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    placeholder="MM/YYYY"
                  />
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">End Date</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder="MM/YYYY"
                      />
                      <label className="flex items-center space-x-2 text-slate-300">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                          className="rounded w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="text-sm">Current</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Field
                    label="Description"
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and key achievements..."
                    textarea
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addExperience}
              className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Experience</span>
            </button>
          </Section>

          <Section title="Education">
            {educations.map((edu, idx) => (
              <div key={edu.id} className={idx > 0 ? 'mt-6 pt-6 border-t border-slate-700' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-cyan-400 font-semibold">Education {idx + 1}</h4>
                  {educations.length > 1 && (
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                    placeholder="University Name"
                  />
                  <Field
                    label="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="Bachelor's, Master's, etc."
                  />
                  <Field
                    label="Field of Study"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    placeholder="Computer Science, Business, etc."
                  />
                  <Field
                    label="GPA (Optional)"
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                    placeholder="3.8/4.0"
                  />
                  <Field
                    label="Start Date"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                    placeholder="MM/YYYY"
                  />
                  <Field
                    label="End Date"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                    placeholder="MM/YYYY"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addEducation}
              className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education</span>
            </button>
          </Section>

          <Section title="Skills">
            <Field
              label="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Product Management, Agile, SQL, Figma, Data Analysis..."
              textarea
            />
          </Section>

          <Section title="Projects (Optional)">
            {projects.map((proj, idx) => (
              <div key={proj.id} className={idx > 0 ? 'mt-6 pt-6 border-t border-slate-700' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-cyan-400 font-semibold">Project {idx + 1}</h4>
                  {projects.length > 1 && (
                    <button
                      onClick={() => removeProject(proj.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <Field
                    label="Project Name"
                    value={proj.name}
                    onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                    placeholder="Project Name"
                  />
                  <Field
                    label="Description"
                    value={proj.description}
                    onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                    placeholder="Describe the project and your role..."
                    textarea
                  />
                  <Field
                    label="Technologies Used"
                    value={proj.technologies}
                    onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                    placeholder="React, Node.js, PostgreSQL..."
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addProject}
              className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </Section>

          <Section title="Certifications (Optional)">
            {certifications.map((cert, idx) => (
              <div key={cert.id} className={idx > 0 ? 'mt-6 pt-6 border-t border-slate-700' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-cyan-400 font-semibold">Certification {idx + 1}</h4>
                  {certifications.length > 1 && (
                    <button
                      onClick={() => removeCertification(cert.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Certification Name"
                    value={cert.name}
                    onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                    placeholder="Certified Product Manager"
                  />
                  <Field
                    label="Issuing Organization"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                    placeholder="Organization Name"
                  />
                  <Field
                    label="Date Earned"
                    value={cert.date}
                    onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                    placeholder="MM/YYYY"
                  />
                  <Field
                    label="Credential URL (Optional)"
                    value={cert.url || ''}
                    onChange={(e) => updateCertification(cert.id, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addCertification}
              className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certification</span>
            </button>
          </Section>

          {/* AI Review Results */}
          {reviewResult && (
            <div id="ai-review-results" className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl blur opacity-10"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">AI Resume Review</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400">Score</span>
                      <span className="text-2xl font-bold text-purple-400">{reviewResult.score}/100</span>
                    </div>
                    <button
                      onClick={() => setReviewResult(null)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 ml-2">
                      {reviewResult.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-sm">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewResult.improvements && reviewResult.improvements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-orange-400 font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                      Areas for Improvement
                    </h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 ml-2">
                      {reviewResult.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="text-sm">{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewResult.suggestions && reviewResult.suggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-cyan-400 font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                      Suggestions
                    </h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-1 ml-2">
                      {reviewResult.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {reviewResult.analysis && (
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      Detailed Analysis
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{reviewResult.analysis}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Resume Preview */}
        <div className="overflow-y-auto pl-2 custom-scrollbar">
          <div ref={previewRef} className="resume-preview bg-white text-black p-8 rounded-lg shadow-2xl min-h-full border-2 border-gray-200" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '8.5in' }}>
            {renderTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Components
interface TemplateData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
    summary: string;
  };
  experiences: Experience[];
  educations: Education[];
  skills: string;
  projects: Project[];
  certifications: Certification[];
  profilePhoto?: string | null;
}

function ClassicTemplate({ data }: { data: TemplateData }) {
  const { personalInfo, experiences, educations, skills, projects, certifications, profilePhoto } = data;
  
  return (
    <>
      {/* Header */}
      <div className={`flex ${profilePhoto ? 'justify-between' : 'flex-col'} items-center mb-6 border-b-2 border-gray-300 pb-4`}>
        <div className={profilePhoto ? 'flex-1' : 'text-center w-full'}>
          <h1 className="text-3xl font-bold mb-3 text-gray-900">{personalInfo.fullName || 'Your Name'}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{personalInfo.phone}</span>}
            {personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{personalInfo.email}</span>}
            {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{personalInfo.location}</span>}
            {personalInfo.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-4 h-4" />{personalInfo.linkedin}</span>}
            {personalInfo.portfolio && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{personalInfo.portfolio}</span>}
          </div>
        </div>
        {profilePhoto && (
          <div className="ml-4">
            <img src={profilePhoto} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-300" />
          </div>
        )}
      </div>

      {/* Objective */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-2 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Objective</h2>
          <p className="text-sm leading-relaxed text-gray-700 mt-2">{personalInfo.summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {experiences.some(exp => exp.company || exp.position) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-3 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Work Experience</h2>
          {experiences.map((exp, idx) => {
            if (!exp.company && !exp.position) return null;
            return (
              <div key={exp.id} className={idx > 0 ? 'mt-4' : ''}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-gray-900">{exp.position || 'Position'}</h3>
                    <p className="text-gray-700 font-semibold text-sm">{exp.company || 'Company'}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600 font-medium whitespace-nowrap ml-4">
                    {exp.startDate && <span>{exp.startDate}</span>}
                    {exp.startDate && (exp.endDate || exp.current) && <span> - </span>}
                    {exp.current ? <span>Present</span> : exp.endDate && <span>{exp.endDate}</span>}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Education */}
      {educations.some(edu => edu.institution || edu.degree) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-3 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Education</h2>
          {educations.map((edu, idx) => {
            if (!edu.institution && !edu.degree) return null;
            return (
              <div key={edu.id} className={idx > 0 ? 'mt-4' : ''}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{edu.degree || 'Degree'}</h3>
                    <p className="text-gray-700 font-semibold text-sm">{edu.institution || 'Institution'}</p>
                    {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {edu.startDate && <span>{edu.startDate}</span>}
                    {edu.startDate && edu.endDate && <span> - </span>}
                    {edu.endDate && <span>{edu.endDate}</span>}
                    {edu.gpa && <p className="mt-1">GPA: {edu.gpa}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects */}
      {projects.some(proj => proj.name || proj.description) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-3 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Projects</h2>
          {projects.map((proj, idx) => {
            if (!proj.name && !proj.description) return null;
            return (
              <div key={proj.id} className={idx > 0 ? 'mt-4' : ''}>
                <h3 className="font-bold text-base text-gray-900">{proj.name || 'Project Name'}</h3>
                {proj.description && (
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-line">{proj.description}</p>
                )}
                {proj.technologies && (
                  <p className="text-sm text-gray-600 mt-1 italic">Technologies: {proj.technologies}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-3 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Skills</h2>
          <p className="text-sm text-gray-700">{skills}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.some(cert => cert.name || cert.issuer) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-orange-600 mb-3 border-b-2 border-orange-600 pb-1 uppercase tracking-wide">Certifications</h2>
          {certifications.map((cert, idx) => {
            if (!cert.name && !cert.issuer) return null;
            return (
              <div key={cert.id} className={idx > 0 ? 'mt-2' : ''}>
                <p className="font-semibold text-sm">{cert.name || 'Certification Name'}</p>
                {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                {cert.date && <p className="text-sm text-gray-600">{cert.date}</p>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function MinimalistTemplate({ data }: { data: TemplateData }) {
  const { personalInfo, experiences, educations, skills, projects, certifications } = data;
  
  return (
    <>
      <div className="text-center mb-8 border-b border-gray-400 pb-6">
        <h1 className="text-4xl font-light mb-2 text-gray-900 tracking-wide">{personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 mt-3">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.email && <span>•</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.location && <span>•</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
      </div>

      {personalInfo.summary && (
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-600 italic leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {experiences.some(exp => exp.company || exp.position) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest">Experience</h2>
          {experiences.map((exp, idx) => {
            if (!exp.company && !exp.position) return null;
            return (
              <div key={exp.id} className={idx > 0 ? 'mt-6' : ''}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{exp.position || 'Position'}</h3>
                    <p className="text-xs text-gray-600">{exp.company || 'Company'}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {exp.startDate} {exp.endDate || exp.current ? '-' : ''} {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {educations.some(edu => edu.institution || edu.degree) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest">Education</h2>
          {educations.map((edu, idx) => {
            if (!edu.institution && !edu.degree) return null;
            return (
              <div key={edu.id} className={idx > 0 ? 'mt-4' : ''}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{edu.degree || 'Degree'}</h3>
                    <p className="text-xs text-gray-600">{edu.institution || 'Institution'}</p>
                  </div>
                  <span className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {skills && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest">Skills</h2>
          <p className="text-xs text-gray-600">{skills}</p>
        </div>
      )}
    </>
  );
}

function CreativeTemplate({ data }: { data: TemplateData }) {
  const { personalInfo, experiences, educations, skills, projects, certifications, profilePhoto } = data;
  
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{personalInfo.fullName || 'Your Name'}</h1>
            <div className="flex flex-wrap gap-3 text-sm">
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.email && <span>•</span>}
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.location && <span>•</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
          </div>
          {profilePhoto && (
            <img src={profilePhoto} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
          )}
        </div>
      </div>

      {personalInfo.summary && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
          <h2 className="text-sm font-bold text-blue-900 mb-2 uppercase">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {experiences.some(exp => exp.company || exp.position) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-blue-600 mb-3 border-l-4 border-blue-600 pl-2">Experience</h2>
              {experiences.map((exp, idx) => {
                if (!exp.company && !exp.position) return null;
                return (
                  <div key={exp.id} className={idx > 0 ? 'mt-4' : ''}>
                    <h3 className="font-bold text-sm text-gray-900">{exp.position || 'Position'}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{exp.company || 'Company'}</p>
                    <p className="text-xs text-gray-500">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                    {exp.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {educations.some(edu => edu.institution || edu.degree) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-blue-600 mb-3 border-l-4 border-blue-600 pl-2">Education</h2>
              {educations.map((edu, idx) => {
                if (!edu.institution && !edu.degree) return null;
                return (
                  <div key={edu.id} className={idx > 0 ? 'mt-4' : ''}>
                    <h3 className="font-bold text-sm text-gray-900">{edu.degree || 'Degree'}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{edu.institution || 'Institution'}</p>
                    <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {skills && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-blue-600 mb-3 border-l-4 border-blue-600 pl-2">Skills</h2>
              <p className="text-xs text-gray-600">{skills}</p>
            </div>
          )}

          {projects.some(proj => proj.name || proj.description) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-blue-600 mb-3 border-l-4 border-blue-600 pl-2">Projects</h2>
              {projects.map((proj, idx) => {
                if (!proj.name && !proj.description) return null;
                return (
                  <div key={proj.id} className={idx > 0 ? 'mt-4' : ''}>
                    <h3 className="font-bold text-sm text-gray-900">{proj.name || 'Project Name'}</h3>
                    {proj.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{proj.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProfessionalTemplate({ data }: { data: TemplateData }) {
  const { personalInfo, experiences, educations, skills, projects, certifications, profilePhoto } = data;
  
  return (
    <>
      <div className="flex items-start gap-6 mb-6 pb-6 border-b-2 border-gray-800">
        {profilePhoto && (
          <img src={profilePhoto} alt="Profile" className="w-32 h-32 rounded object-cover border-2 border-gray-300" />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{personalInfo.fullName || 'Your Name'}</h1>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>
        </div>
      </div>

      {personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-400 pb-1">Professional Summary</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {experiences.some(exp => exp.company || exp.position) && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3 uppercase tracking-wider border-b border-gray-400 pb-1">Professional Experience</h2>
          {experiences.map((exp, idx) => {
            if (!exp.company && !exp.position) return null;
            return (
              <div key={exp.id} className={idx > 0 ? 'mt-5' : ''}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{exp.position || 'Position'}</h3>
                    <p className="text-sm text-gray-700 font-semibold">{exp.company || 'Company'}</p>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.description && (
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                    {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                      <li key={i}>{line.trim()}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {educations.some(edu => edu.institution || edu.degree) && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 uppercase tracking-wider border-b border-gray-400 pb-1">Education</h2>
            {educations.map((edu, idx) => {
              if (!edu.institution && !edu.degree) return null;
              return (
                <div key={edu.id} className={idx > 0 ? 'mt-4' : ''}>
                  <h3 className="font-bold text-sm text-gray-900">{edu.degree || 'Degree'}</h3>
                  <p className="text-sm text-gray-700">{edu.institution || 'Institution'}</p>
                  <p className="text-xs text-gray-600">{edu.startDate} - {edu.endDate}</p>
                </div>
              );
            })}
          </div>
        )}

        {skills && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-3 uppercase tracking-wider border-b border-gray-400 pb-1">Core Competencies</h2>
            <p className="text-sm text-gray-700">{skills}</p>
          </div>
        )}
      </div>
    </>
  );
}
