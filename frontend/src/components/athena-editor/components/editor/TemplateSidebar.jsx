import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Briefcase, GraduationCap, Mail, FileSignature, Newspaper } from 'lucide-react';

const templates = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start from scratch',
    icon: FileText,
    category: 'General',
    content: '<h1>Untitled Document</h1><p>Start writing here...</p>',
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Professional resume template',
    icon: Briefcase,
    category: 'Professional',
    content: `<h1>Your Name</h1>
<p>Professional Title | email@example.com | (123) 456-7890</p>
<h2>Summary</h2>
<p>Experienced professional with expertise in...</p>
<h2>Experience</h2>
<h3>Job Title - Company Name</h3>
<p><em>Date - Present</em></p>
<ul><li>Key achievement or responsibility</li><li>Key achievement or responsibility</li></ul>
<h2>Education</h2>
<h3>Degree - University Name</h3>
<p><em>Graduation Year</em></p>
<h2>Skills</h2>
<ul><li>Skill 1</li><li>Skill 2</li><li>Skill 3</li></ul>`,
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Professional cover letter',
    icon: Mail,
    category: 'Professional',
    content: `<p>Your Name<br>Your Address<br>City, State ZIP<br>Email | Phone</p>
<p>Date</p>
<p>Hiring Manager's Name<br>Company Name<br>Company Address</p>
<p>Dear Hiring Manager,</p>
<p>I am writing to express my interest in the [Position] role at [Company Name]...</p>
<p>In my current role at [Current Company], I have...</p>
<p>I am particularly drawn to [Company Name] because...</p>
<p>Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.</p>
<p>Sincerely,<br>Your Name</p>`,
  },
  {
    id: 'essay',
    name: 'Essay',
    description: 'Academic essay structure',
    icon: GraduationCap,
    category: 'Academic',
    content: `<h1>Essay Title</h1>
<p><em>Your Name</em></p>
<h2>Introduction</h2>
<p>Begin with a hook to grab the reader's attention. Provide background information and end with your thesis statement.</p>
<h2>Body Paragraph 1</h2>
<p>Topic sentence introducing the first main point. Support with evidence and analysis.</p>
<h2>Body Paragraph 2</h2>
<p>Topic sentence introducing the second main point. Support with evidence and analysis.</p>
<h2>Body Paragraph 3</h2>
<p>Topic sentence introducing the third main point. Support with evidence and analysis.</p>
<h2>Conclusion</h2>
<p>Restate your thesis and summarize main points. End with a thought-provoking statement.</p>`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting notes',
    icon: FileSignature,
    category: 'Business',
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> [Date]</p>
<p><strong>Time:</strong> [Time]</p>
<p><strong>Attendees:</strong> [Names]</p>
<h2>Agenda</h2>
<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>
<h2>Discussion</h2>
<h3>Topic 1</h3>
<p>Notes and key points discussed...</p>
<h3>Topic 2</h3>
<p>Notes and key points discussed...</p>
<h2>Action Items</h2>
<ul><li>[ ] Action item 1 - Assigned to: [Name] - Due: [Date]</li><li>[ ] Action item 2 - Assigned to: [Name] - Due: [Date]</li></ul>
<h2>Next Meeting</h2>
<p>Date and agenda items for next meeting...</p>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter template',
    icon: Newspaper,
    category: 'Marketing',
    content: `<h1>Newsletter Title</h1>
<p><em>Issue #1 | Month Year</em></p>
<h2>Featured Story</h2>
<p>Your main story or announcement goes here. Make it engaging and informative.</p>
<h2>News & Updates</h2>
<h3>Update 1</h3>
<p>Brief description of the update...</p>
<h3>Update 2</h3>
<p>Brief description of the update...</p>
<h2>Upcoming Events</h2>
<ul><li><strong>Event 1:</strong> Date - Description</li><li><strong>Event 2:</strong> Date - Description</li></ul>
<h2>Quick Tips</h2>
<blockquote>Share a helpful tip or quote here!</blockquote>
<p><em>Thank you for reading! Contact us at email@example.com</em></p>`,
  },
];

export const TemplateSidebar = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Templates</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="grid gap-2">
                    {templates
                      .filter((t) => t.category === category)
                      .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            onSelectTemplate(template);
                            onClose();
                          }}
                          className={`flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-gray-100 transition-colors text-left w-full`}
                        >
                          <template.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};