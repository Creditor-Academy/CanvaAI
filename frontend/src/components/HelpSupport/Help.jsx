import React, { useState } from 'react';
import './Help.css';
import animateGif from "../../assets/animate.gif";
// import ChatModal from './ChatModal'
// import EmailSupport from './EmailSupport'
// import PhoneSupport from './PhoneSupport';


const Help = () => {
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [modalType, setModalType] = useState(null);
  // const contactSectionRef = useRef(null);
  // const contentRef = useRef(null);

  // const openModal = (type) => {
  //   setModalType(type);
  //   setIsModalOpen(true);
  // };


  // const closeModal = () => {
  //   setIsModalOpen(false);
  //   setModalType(null);
  // };

  // const renderModalContent = () => {
  //   if (!modalType) return null;

  //   if (modalType === 'chat') {
  //     return <ChatModal />;
  //   }

  //   if (modalType === 'email') {
  //     return <EmailSupport />;
  //   }

  //   if (modalType === 'phone') {
  //     return <PhoneSupport onClose={() => setModalType(null)} />;
  //   }

  //   return null;
  // };

  const [searchQuery, setSearchQuery] = useState('');
  // const [selectedCategory, setSelectedCategory] = useState('All Categories');
  // const [selectedFilter, setSelectedFilter] = useState('FAQ');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  // const [searchResults, setSearchResults] = useState([]);
  // const [isSearching, setIsSearching] = useState(false);

  // const categories = [
  //   'All Categories',
  //   'Getting Started',
  //   'AI Tools',
  //   'Team & Collaboration'
  // ];

  // const quickFilters = [
  //   'FAQ',
  //   'Tutorials',
  //   'Contact',
  //   'Feedback'
  // ];

  /*-------------------FAQ DATA----------------------- */

  const faqData = [
    {
      id: 1,
      question: "How do I create a new presentation?",
      answer: "Go to the dashboard and click on “Create Presentation.” You can choose to create it manually or generate it using AI by entering a topic.",
      category: "Getting Started",

    },
    {
      id: 2,
      question: "How can I edit images on the platform?",
      answer: "Open the image editor from the dashboard, upload your image, and use the available tools or AI features to edit and enhance your image.",
      category: "Getting Started",

    },
    {
      id: 3,
      question: "How do I save my work?",
      answer: "Your work is automatically saved on the platform. You can also manually save your presentation or image using the save button.",
      category: "Team & Collaboration",

    },
    {
      id: 4,
      question: "Can I download my presentation or image?",
      answer: "Yes, open your project and click on the download button to download your presentation or edited image.",
      category: "AI Tools",

    },
    {
      id: 5,
      question: "What should I do if something is not working?",
      answer: "If you face any issue, try refreshing the page. If the problem continues, contact support through the Help & Support section.",
      category: "Getting Started",

    },

  ];

  /*-------------------TUTORIALS DATA----------------------- */

  const tutorialData = [
    {
      id: 1,
      title: "Getting Started with AI Design",
      duration: "5 min read",
      category: "Getting Started",
      description: "Learn the basics of creating stunning designs with AI"
    },
    {
      id: 2,
      title: "Advanced Customization Techniques",
      duration: "8 min read",
      category: "AI Tools",
      description: "Master advanced editing and customization features"
    },
    {
      id: 3,
      title: "Team Collaboration Guide",
      duration: "6 min read",
      category: "Team & Collaboration",
      description: "Set up and manage team workspaces effectively"
    }
  ];


  /*-------------------SEARCH FILTER FUNCTION----------------------- */
  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const filteredTutorials = tutorialData.filter(tutorial => {
    const matchesSearch =
      searchQuery === '' ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });
  // useEffect(() => {
  //   if (searchQuery === "") {
  //     setSelectedCategory("All Categories");
  //   }
  // }, [searchQuery]);

  /*-------------------SEARCH FUNCTION----------------------- */
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  /*-------------------TOGGLE FUNCTION----------------------- */

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // const handleContactSupport = () => {
  //   setSelectedFilter('Contact');
  // };


  //   if (selectedFilter === 'FAQ') {
  //     return (
  //       <>
  //         <div className="faq-section">
  //           <h2 className="section-title">Frequently asked questions</h2>

  //           <div className="faq-list">
  //             {filteredFAQs.map((faq) => (
  //               <div key={faq.id} className={`faq-item ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
  //                 <div
  //                   className="faq-question"
  //                   onClick={() => toggleFAQ(faq.id)}
  //                 >
  //                   <span className="question-text">{faq.question}</span>
  //                   <span className={`expand-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
  //                     ▼
  //                   </span>
  //                 </div>

  //                 {expandedFAQ === faq.id && (
  //                   <div className="faq-answer">
  //                     <p>{faq.answer}</p>
  //                   </div>
  //                 )}
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //       </>
  //     );
  //   }

  //   if (selectedFilter === 'getstarted') {
  //     return (
  //       <div className="faq-section">
  //         <h2 className="section-title">Getting Started</h2>
  //         <div className="faq-list">
  //           {filteredFAQs.map((faq) => (
  //             <div key={faq.id} className={`faq-item ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
  //               <div
  //                 className="faq-question"
  //                 onClick={() => toggleFAQ(faq.id)}
  //               >
  //                 <span className="question-text">{faq.question}</span>
  //                 <div className="faq-badges">
  //                   <span className={`expand-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
  //                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //                       <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  //                     </svg>
  //                   </span>
  //                 </div>
  //               </div>
  //               {expandedFAQ === faq.id && (
  //                 <div className="faq-answer">
  //                   <p>{faq.answer}</p>

  //                 </div>
  //               )}
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     );
  //   }


  //   // if (selectedFilter === 'Contact') {
  //   //   return (
  //   //     <div className="contact-section" ref={contactSectionRef}>
  //   //       <h2 className="section-title">Contact Support</h2>
  //   //       <div className="contact-options">
  //   //         <div className="contact-card">
  //   //           <div className="contact-icon">💬</div>
  //   //           <h3>Live Chat</h3>
  //   //           <p>Get instant help from our support team</p>
  //   //           <button className="contact-btn" onClick={() => openModal('chat')}>Start Chat</button>
  //   //         </div>

  //   //         <div className="contact-card">
  //   //           <div className="contact-icon">📧</div>
  //   //           <h3>Email Support</h3>
  //   //           <p>Send us a detailed message</p>
  //   //           <button className="contact-btn" onClick={() => openModal('email')}>Send Email</button>
  //   //         </div>

  //   //         <div className="contact-card">
  //   //           <div className="contact-icon">📞</div>
  //   //           <h3>Phone Support</h3>
  //   //           <p>Speak directly with our team</p>
  //   //           <button className="contact-btn" onClick={() => openModal('phone')}>Call Now</button>
  //   //         </div>
  //   //       </div>
  //   //     </div>
  //   //   );
  //   // }


  //   // if (selectedFilter === 'Feedback') {
  //   //   return (
  //   //     <div className="feedback-section">
  //   //       <h2 className="section-title">Share Your Feedback</h2>
  //   //       <div className="feedback-form">
  //   //         <div className="form-group">
  //   //           <label htmlFor="feedback-type">Feedback Type</label>
  //   //           <select id="feedback-type" className="form-select">
  //   //             <option>Feature Request</option>
  //   //             <option>Bug Report</option>
  //   //             <option>General Feedback</option>
  //   //             <option>Other</option>
  //   //           </select>
  //   //         </div>
  //   //         <div className="form-group">
  //   //           <label htmlFor="feedback-message">Your Message</label>
  //   //           <textarea
  //   //             id="feedback-message"
  //   //             className="form-textarea"
  //   //             placeholder="Tell us what you think..."
  //   //             rows="5"
  //   //           ></textarea>
  //   //         </div>
  //   //         <button className="submit-feedback-btn">Submit Feedback</button>
  //   //       </div>
  //   //     </div>
  //   //   );
  //   // }

  //   return null;
  // };

  // useEffect(() => {
  //   if (selectedFilter === 'Contact' && contactSectionRef.current) {
  //     contactSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  // }, [selectedFilter]);


  return (

    /*-------------------HEADER----------------------- */
    <div className="help-container ">
      <div className="help-inner">
        <div className="help-hero">
          <div className="hero-left">

            <h1 className="hero-title">How can we help you today?</h1>

            <p className="hero-sub">
              Search our knowledge base for answers to common questions
            </p>
            <button
              className="hero-card-btn hero-start-btn"
              onClick={() =>
                document.getElementById("faq-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Get started →
            </button>
          </div>
          <div className="hero-right" aria-hidden="true">
            <img src="https://images.unsplash.com/vector-1761384690980-b218fa986838?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJ1c2luZXNzfGVufDB8MHwwfHx8Mg%3D%3D" />
          </div>

          <div className="hero-search">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" />
            </svg>

            <input
              type="text"
              placeholder="Search our articles"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <button className="hero-search-btn">Search</button>
          </div>



          {/* <div className="hero-right">
          <div className="hero-card">
            <h3>Getting Started</h3>
            <p>Learn everything you need to know to get started</p>
            <button
              className="hero-card-btn"
              onClick={() =>
                document.querySelector(".faq-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Get started →
            </button>
          </div>
        </div> */}
        </div>

        {/* <div className="filters-section">
        <div className="filters-container">
          <div className="quick-filters">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                className={`quick-filter-btn ${selectedFilter === filter ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* 👇 Hide category filters when Contact or Feedback is selected */}
        {/* {selectedFilter !== 'Contact' && selectedFilter !== 'Feedback' && (
            <div
              className={`category-filters ${selectedFilter === 'Contact' || selectedFilter === 'Feedback' ? 'hidden' : ''
                }`}
            >
              {selectedFilter !== 'Contact' && selectedFilter !== 'Feedback' &&
                categories.map((category) => (
                  <button
                    key={category}
                    className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
            </div>

          )}
        </div>
      </div> */}

        {/*-------------------FAQ SECTION----------------------- */}
        <div className="faq-wrapper" id="faq-section">

          <div className="faq-intro">

            <h2 className="faq-heading">
              Frequently Asked <span>Questions</span>
            </h2>

            <p className="faq-desc">
              Create presentations, edit images, and generate designs faster with our AI-powered tools.
            </p>

            <div className="faq-cta">

              <img
                src={animateGif}
                alt="FAQ Illustration"
                className="faq-gif"
              />

            </div>
          </div>


          {/* RIGHT QUESTIONS */}
          <div className="faq-cards">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className={`faq-card ${expandedFAQ === faq.id ? "open" : ""}`}
                onClick={() => toggleFAQ(faq.id)}
              >
                <div className="faq-card-head">
                  <span>{faq.question}</span>
                  <div className="faq-arrow">
                    {expandedFAQ === faq.id ? "▲" : "▼"}
                  </div>
                </div>

                <div className="faq-card-body">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
        {/* ---------------- Tutorials Section ---------------- */}


        <div className="tutorial-wrapper">
          <div className="tutorial-section">
            <h2 className="section-title">Tutorials</h2>

            <div className="tutorial-grid">
              {filteredTutorials.map((tutorial) => (
                <div key={tutorial.id} className="tutorial-card">
                  <div className="tutorial-icon">📘</div>

                  <h3>{tutorial.title}</h3>
                  <p>{tutorial.description}</p>

                  <div className="tutorial-footer">
                    <span>{tutorial.duration}</span>
                    <button>Learn more →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= Support CTA Section ================= */}
        <div className="support-cta">
          <div className="support-cta-inner">

            <div className="support-icon">
              <img
                src="https://cdn-icons-png.flaticon.com/128/14865/14865140.png"
                alt="Support Illustration"
              />
            </div>

            <div className="support-content">
              <h2>Still have questions?</h2>
              <p>
                Our Customer Experience Team is here for you!
                Looking for help with a project? We can match you with the right certified partner.
              </p>

              <div className="support-actions">
                <button className="support-primary">Submit a request</button>
              </div>
            </div>

          </div>
        </div>

        {/* {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {renderModalContent()}
          </div>
        </div>
      )} */}
      </div>
    </div>
  );
};

export default Help;
