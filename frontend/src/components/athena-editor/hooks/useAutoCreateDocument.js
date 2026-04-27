/**
 * useAutoCreateDocument Hook
 * 
 * Production-level hook that automatically creates a new document
 * when user opens the editor without a document ID.
 * 
 * This follows Google Docs pattern where a document is created immediately,
 * ensuring zero data loss and persistent storage from the first millisecond.
 * 
 * @param {string} mongoId - Current document ID (null for new documents)
 * @param {Function} navigate - React Router navigate function
 * @param {string} templateType - Optional template type (blank, resume, report, etc.)
 * @returns {Object} { isCreating, error }
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';

/// Template content map for initial document content
const TEMPLATE_CONTENT = {
  blank: {
    html: '<p></p>'
  },
  'meeting-notes': {
    html: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()} &nbsp;|&nbsp; <strong>Time:</strong> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
<p><strong>Attendees:</strong> [Name 1], [Name 2], [Name 3]</p>
<hr/>
<h2>1. Agenda Overview</h2>
<ol>
  <li>Project Status Update</li>
  <li>Resource Allocation</li>
  <li>Upcoming Deadlines</li>
  <li>New Business</li>
</ol>
<h2>2. Discussion Points</h2>
<p><strong>Status Update:</strong> The project is currently on track for the Phase 1 milestone. No major blockers were identified during the sprint review.</p>
<p><strong>Resources:</strong> We discussed adding a dedicated QA engineer to the team for the final testing phase.</p>
<h2>3. Action Items</h2>
<table>
  <thead>
    <tr>
      <th>Task</th>
      <th>Owner</th>
      <th>Due Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Finalize requirements doc</td>
      <td>[Name]</td>
      <td>${new Date(Date.now() + 86400000 * 2).toLocaleDateString()}</td>
    </tr>
    <tr>
      <td>Review QA candidates</td>
      <td>[Name]</td>
      <td>${new Date(Date.now() + 86400000 * 5).toLocaleDateString()}</td>
    </tr>
  </tbody>
</table>
<h2>4. Next Meeting</h2>
<p><strong>Date:</strong> ${new Date(Date.now() + 86400000 * 7).toLocaleDateString()} &nbsp;|&nbsp; <strong>Topic:</strong> Sprint Planning</p>`
  },
  resume: {
    html: `<h1>YOUR NAME</h1>
<p style="text-align: center;">City, State &nbsp;|&nbsp; (123) 456-7890 &nbsp;|&nbsp; email@example.com &nbsp;|&nbsp; linkedin.com/in/yourname</p>
<hr/>
<h2>PROFESSIONAL SUMMARY</h2>
<p>Results-driven professional with over <strong>[X] years of experience</strong> in [Industry/Field]. Proven track record of delivering high-impact solutions and leading cross-functional teams. Expert in [Key Skill 1], [Key Skill 2], and [Key Skill 3].</p>
<h2>EXPERIENCE</h2>
<h3>Senior [Job Title] | [Company Name]</h3>
<p><em>Month Year – Present &nbsp;|&nbsp; City, State</em></p>
<ul>
  <li>Led a team of [X] to develop and launch a [Product/Service] that increased revenue by [X]%.</li>
  <li>Implemented [Process/System] that reduced operational costs by [X]% annually.</li>
  <li>Collaborated with stakeholders to define product roadmap and long-term strategy.</li>
</ul>
<h3>[Previous Job Title] | [Previous Company]</h3>
<p><em>Month Year – Month Year &nbsp;|&nbsp; City, State</em></p>
<ul>
  <li>Managed [Project/Department] with a budget of $[X], delivering all milestones on time.</li>
  <li>Improved team productivity by [X]% through the introduction of [Methodology/Tool].</li>
</ul>
<h2>EDUCATION</h2>
<h3>Bachelor of [Degree] in [Field]</h3>
<p><em>[University Name] &nbsp;|&nbsp; Graduation Year</em></p>
<h2>SKILLS</h2>
<p><strong>Technical:</strong> [Skill 1], [Skill 2], [Skill 3], [Skill 4]</p>
<p><strong>Certifications:</strong> [Certification Name], [Certification Name]</p>`
  },
  'cover-letter': {
    html: `<p><strong>Your Name</strong><br/>Your Address, City, State ZIP<br/>email@example.com | (123) 456-7890</p>
<p>${new Date().toLocaleDateString()}</p>
<p><strong>Hiring Manager's Name</strong><br/>[Title]<br/>[Company Name]<br/>[Address]</p>
<br/>
<p>Dear [Hiring Manager's Name],</p>
<p>I am writing to express my strong interest in the <strong>[Position Name]</strong> role at <strong>[Company Name]</strong> as advertised on [Where you saw the ad]. With my background in [Relevant Experience] and my passion for [Company's Mission/Industry], I am confident that I would be a valuable asset to your team.</p>
<p>In my previous role at [Previous Company], I [Specific Achievement related to the job]. This experience taught me the importance of [Relevant Skill] and how to effectively [Another Relevant Skill]. I am particularly drawn to [Company Name] because of your reputation for [Specific aspect of the company].</p>
<p>I am eager to bring my unique perspective and skills to [Company Name] and help drive [Specific Goal mentioned in job desc]. Thank you for your time and consideration. I look forward to the possibility of discussing my application with you further.</p>
<br/>
<p>Sincerely,</p>
<p><strong>Your Name</strong></p>`
  },
  'project-proposal': {
    html: `<h1>Project Proposal: [Project Name]</h1>
<p><strong>Prepared by:</strong> [Your Name] &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<hr/>
<h2>1. Executive Summary</h2>
<p>This proposal outlines the strategic plan for <strong>[Project Name]</strong>, which aims to address [Problem/Opportunity] by implementing [Solution]. The project is expected to deliver [Primary Benefit] within a [Timeline] period.</p>
<h2>2. Objectives</h2>
<ul>
  <li><strong>Objective 1:</strong> Achieve [Specific Goal] by [Date].</li>
  <li><strong>Objective 2:</strong> Improve [Metric] by [Percentage/Value].</li>
  <li><strong>Objective 3:</strong> Reduce [Problem] by [Percentage/Value].</li>
</ul>
<h2>3. Proposed Solution</h2>
<p>We propose a multi-phased approach to [Solution Description]. This includes integrating [Technology/Process] to ensure scalability and performance.</p>
<h2>4. Project Timeline</h2>
<table>
  <thead>
    <tr>
      <th>Phase</th>
      <th>Description</th>
      <th>Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>I. Research</td>
      <td>Requirements gathering and stakeholder interviews.</td>
      <td>2 weeks</td>
    </tr>
    <tr>
      <td>II. Design</td>
      <td>Architecture design and prototyping.</td>
      <td>3 weeks</td>
    </tr>
    <tr>
      <td>III. Build</td>
      <td>Implementation and internal testing.</td>
      <td>6 weeks</td>
    </tr>
    <tr>
      <td>IV. Launch</td>
      <td>Deployment and user training.</td>
      <td>2 weeks</td>
    </tr>
  </tbody>
</table>
<h2>5. Budget Estimate</h2>
<p>Estimated total investment: <strong>$[XX,XXX]</strong>. This covers personnel, hardware, and third-party services.</p>`
  },
  essay: {
    html: `<h1>The Impact of [Topic] on Modern Society</h1>
<p style="text-align: center;"><em>[Author Name] &nbsp;|&nbsp; [Course Name] &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</em></p>
<hr/>
<h2>Introduction</h2>
<p>The role of [Topic] has undergone significant transformation in recent decades. As society becomes increasingly reliant on [related factor], understanding the nuances of this change is critical. This essay argues that <strong>[Thesis Statement]</strong> because of [Point 1], [Point 2], and [Point 3].</p>
<h2>Theoretical Framework</h2>
<p>Historical perspectives on [Topic] suggest that [Context]. Major scholars such as [Name] have argued that [Theory]. This provides a foundation for analyzing current trends.</p>
<h2>Evidence and Analysis</h2>
<p>Data from [Source] indicates a clear correlation between [Factor A] and [Factor B]. This supports the claim that [Analysis]. Furthermore, [Additional Evidence] suggests that the trend is likely to continue.</p>
<h2>Counterarguments</h2>
<p>Critics often point out that [Counter-point]. While this perspective has merit in specific contexts, it fails to account for [Rebuttal Evidence].</p>
<h2>Conclusion</h2>
<p>In summary, the evidence demonstrates that [Summarized Thesis]. As we move forward, it is essential that [Final Thought/Implication].</p>
<h2>References</h2>
<p>[1] Author, A. (Year). <em>Title of Work</em>. Publisher.</p>
<p>[2] Researcher, B. (Year). "Title of Article." <em>Journal Name</em>, Vol(No).</p>`
  },
  'research-report': {
    html: `<h1>Investigation into [Subject Matter]</h1>
<p style="text-align: center;"><em>[Primary Researcher] &nbsp;|&nbsp; [Department/Institution] &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</em></p>
<hr/>
<h2>Abstract</h2>
<p>This study investigates the relationship between [Variable X] and [Variable Y]. Using a [Methodology] approach, we analyzed [Data Source] to determine [Key Question]. Findings suggest that [Primary Finding].</p>
<h2>1. Introduction</h2>
<p>Background context on the research subject. Statement of the research problem and the primary hypothesis being tested.</p>
<h2>2. Methodology</h2>
<p><strong>Design:</strong> Descriptive cross-sectional study.<br/><strong>Sample:</strong> [N] participants from [Target Population].<br/><strong>Instruments:</strong> [Description of tools/surveys used].</p>
<h2>3. Results</h2>
<p>The statistical analysis revealed a significant effect (p < 0.05). Table 1 summarizes the primary metrics observed during the trial.</p>
<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Control Group</th>
      <th>Test Group</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Metric A</td>
      <td>[Value]</td>
      <td>[Value]</td>
    </tr>
    <tr>
      <td>Metric B</td>
      <td>[Value]</td>
      <td>[Value]</td>
    </tr>
  </tbody>
</table>
<h2>4. Discussion</h2>
<p>Interpretations of findings in relation to existing literature. Limitations of the current study and recommendations for future research.</p>`
  },
  report: {
    html: `<h1>Quarterly Performance Report</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()} | <strong>Department:</strong> [Name]</p>
<h2>Executive Summary</h2>
<p>Overview of the quarter's achievements, challenges, and overall performance relative to targets.</p>
<h2>Key Metrics</h2>
<ul>
  <li>Revenue: $[Value] (↑ [X]%)</li>
  <li>Customer Acquisition: [Value]</li>
  <li>Retention Rate: [X]%</li>
</ul>
<h2>Strategic Initiatives</h2>
<p>Details on the primary projects undertaken this quarter and their current status.</p>
<h2>Financial Overview</h2>
<p>Summary of expenditures and budget utilization for the period.</p>`
  },
  newsletter: {
    html: `<h1>ATHENA CHRONICLE</h1>
<p style="text-align: center;"><em>Issue #${Math.floor(Math.random() * 50) + 1} &nbsp;|&nbsp; ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</em></p>
<hr/>
<h2>✦ Featured Story: The Future of [Topic]</h2>
<p>In this month's lead story, we explore how [Topic] is reshaping the industry. From new technologies to shifting consumer behaviors, we cover everything you need to know.</p>
<h2>What's New This Month</h2>
<h3>Product Updates</h3>
<p>We've launched several new features to help you be more productive. Check out the latest additions to our platform.</p>
<h3>Community Spotlight</h3>
<p>Meet [Name], a community member who is using Athena to achieve incredible results in [Field].</p>
<h2>Upcoming Events</h2>
<ul>
  <li><strong>Webinar:</strong> Master your workflow — [Date]</li>
  <li><strong>Networking:</strong> Virtual meetup — [Date]</li>
</ul>
<p><em>Thanks for being a part of our journey!</em></p>`
  },
  'press-release': {
    html: `<p><strong>FOR IMMEDIATE RELEASE</strong></p>
<p><strong>Media Contact:</strong><br/>[Name]<br/>[Email]<br/>[Phone]</p>
<br/>
<h1>[COMPANY NAME] ANNOUNCES MAJOR BREAKTHROUGH IN [AREA]</h1>
<p><strong>[CITY, STATE] — ${new Date().toLocaleDateString()}</strong> — [Company Name], a leader in [Industry], today announced a significant milestone in [specific area]. This development is expected to revolutionize how [Industry/User] approaches [Problem].</p>
<p>"We are thrilled to share this news with the world," said [Executive Name], [Title] at [Company Name]. "Our team has worked tirelessly to reach this point, and we believe this is just the beginning of a new era for [Industry]."</p>
<p>The new [Product/Service/Discovery] features [Key Feature 1] and [Key Feature 2], providing users with unprecedented [Benefit]. Availability is scheduled for [Date/Quarter].</p>
<h2>About [Company Name]</h2>
<p>[Company Name] is dedicated to [Mission]. Founded in [Year], the company has consistently pushed the boundaries of [Industry] through innovation and excellence.</p>
<p style="text-align: center;"><strong>###</strong></p>`
  },
  'blog-post': {
    html: `<h1>10 Ways to Master Your [Subject] Today</h1>
<p><em>By [Author Name] &nbsp;|&nbsp; ${new Date().toLocaleDateString()} &nbsp;|&nbsp; 5 min read</em></p>
<br/>
<p>Are you struggling with [Problem]? You're not alone. In this post, we'll dive deep into the best strategies for mastering [Subject] and achieving [Goal].</p>
<h2>1. Start with the Basics</h2>
<p>Before you can run, you must walk. Understanding the fundamental principles of [Subject] is the first step toward mastery.</p>
<h2>2. Consistency is Key</h2>
<p>It's not about doing it perfectly once; it's about doing it consistently. Set aside [Time] every day to focus on your progress.</p>
<blockquote>"The secret of getting ahead is getting started." — Mark Twain</blockquote>
<h2>3. Leverage the Right Tools</h2>
<p>Using tools like Athena can significantly speed up your workflow and help you stay organized.</p>
<h2>Summary</h2>
<p>By following these steps, you'll be well on your way to becoming an expert in [Subject]. What's your favorite tip? Let us know in the comments!</p>`
  },
  letter: {
    html: `<p>Your Name<br/>Your Address, City, State ZIP</p>
<p>${new Date().toLocaleDateString()}</p>
<br/>
<p>Dear [Recipient Name],</p>
<br/>
<p>I am writing to [Purpose of letter]. [Body paragraph 1].</p>
<p>[Body paragraph 2].</p>
<br/>
<p>Sincerely,</p>
<br/>
<p><strong>Your Name</strong></p>`
  }
};

export function useAutoCreateDocument(mongoId, navigate, templateType = 'blank') {
  const [isCreating, setIsCreating] = useState(false);
  const [createdDocId, setCreatedDocId] = useState(null);
  const [error, setError] = useState(null);
  const hasAttemptedCreation = useRef(false);

  useEffect(() => {
    // Convert "undefined" string to actual undefined
    const actualMongoId = (mongoId === 'undefined' || mongoId === null || mongoId === undefined) ? null : mongoId;
    
    console.log('🔍 useAutoCreateDocument called with:', { 
      mongoId, 
      actualMongoId,
      templateType,
      hasAttempted: hasAttemptedCreation.current, 
      isCreating 
    });
    
    // Only attempt creation if:
    // 1. No mongoId (new document)
    // 2. Haven't already attempted creation (prevent loops)
    // 3. Not currently creating (prevent duplicate calls)
    if (actualMongoId || hasAttemptedCreation.current || isCreating) {
      console.log('⏭️ Skipping document creation:', { 
        hasMongoId: !!actualMongoId, 
        hasAttempted: hasAttemptedCreation.current, 
        isCreating 
      });
      return;
    }

    const createNewDocument = async () => {
      // Mark as attempted to prevent infinite loops
      hasAttemptedCreation.current = true;
      setIsCreating(true);
      setError(null);

      try {
        console.log(`🆕 Auto-creating new document for persistence (template: ${templateType})...`);

        // Get template content or default to blank
        const effectiveTemplate = templateType || 'blank';
        const template = TEMPLATE_CONTENT[effectiveTemplate] || TEMPLATE_CONTENT.blank;
        const title = effectiveTemplate === 'blank' ? 'Untitled Document' : `New ${effectiveTemplate.charAt(0).toUpperCase() + effectiveTemplate.slice(1)}`;

        // Create document with template content
        const result = await TextEditorService.saveDocument({
          title,
          data: template,
          hasBeenEdited: false // Mark as not edited - will be cleaned up if user doesn't interact
        });

        console.log('📡 Backend response:', result);

        // 🔥 CRITICAL: Extract document ID from response (handle different response formats)
        // Backend returns: { message: 'Document saved successfully', documentId: '69e0c0e5eb7c41cee880f0f8' }
        const docId = result.documentId || result.id || result._id || result.document?.id || result.document?._id;
        
        console.log('✅ Extracted document ID:', docId);
        
        if (!docId) {
          console.error('❌ Backend did not return document ID. Response:', result);
          throw new Error('Backend did not return document ID');
        }
        
        // 🔥 CRITICAL: Store the created document ID
        setCreatedDocId(docId);
        
        // 🔥 CRITICAL: Also store in sessionStorage for persistence across refreshes
        sessionStorage.setItem('athena_current_doc_id', docId);
        console.log('💾 Stored document ID in sessionStorage:', docId);
        
        // 🔥 CRITICAL: Update URL and ensure navigation completes
        console.log('🔄 Navigating to /editor/', docId);
        
        // Navigate to the new document URL (replace to prevent back navigation to empty state)
        navigate(`/editor/${docId}`, { replace: true });
        
        console.log('✅ Navigation initiated');

        toast.success(`New ${effectiveTemplate} document created`);
      } catch (err) {
        console.error('❌ Failed to auto-create document:', err);
        setError(err);
        
        // Show user-friendly error
        toast.error('Failed to create new document. Please try again.', {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              hasAttemptedCreation.current = false;
              setIsCreating(false);
            }
          }
        });
      } finally {
        setIsCreating(false);
      }
    };

    // Small delay to ensure editor is ready before creating document
    const creationTimer = setTimeout(createNewDocument, 100);

    return () => {
      clearTimeout(creationTimer);
    };
  }, [mongoId, navigate, isCreating, templateType]);

  return { isCreating, createdDocId, error };
}

export default useAutoCreateDocument;
