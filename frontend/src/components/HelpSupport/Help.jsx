import React, { useState, useEffect, useRef } from 'react';
import './Help.css';
import ChatModal from './ChatModal'
import EmailSupport from './EmailSupport'
import PhoneSupport from './PhoneSupport';
import faqImage from "../../assets/faq-illustration.svg";

const Help = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const contactSectionRef = useRef(null);
  const contentRef = useRef(null);

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const renderModalContent = () => {
    if (!modalType) return null;

    if (modalType === 'chat') {
      return <ChatModal />;
    }

    if (modalType === 'email') {
      return <EmailSupport />;
    }

    if (modalType === 'phone') {
      return <PhoneSupport onClose={() => setModalType(null)} />;
    }

    return null;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedFilter, setSelectedFilter] = useState('FAQ');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const faqData = [
    {
      id: 1,
      question: "How do I create my first AI design?",
      answer: "Navigate to the AI Design Generator, enter a detailed prompt describing your vision, and let our AI create stunning designs for you. You can then refine and customize the results.",
      category: "Getting Started",

    },
    {
      id: 2,
      question: "What file formats are supported?",
      answer: "We support PNG, JPG, SVG, PDF for images, and MP4, MOV for videos. All exports maintain high quality for professional use.",
      category: "Getting Started",

    },
    {
      id: 3,
      question: "How do I collaborate with my team?",
      answer: "Use the Team workspace to invite members, share projects, and work together in real-time. You can assign roles, leave comments, and track changes.",
      category: "Team & Collaboration",

    },
    {
      id: 4,
      question: "Can I customize AI-generated content?",
      answer: "Absolutely! All AI-generated content can be edited, refined, and customized using our built-in tools. You have full control over the final output.",
      category: "AI Tools",

    },
    {
      id: 5,
      question: "How do I export my projects?",
      answer: "Click the export button in any project, choose your preferred format and quality settings, then download directly to your device or save to cloud storage.",
      category: "Getting Started",

    },

  ];

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

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All Categories' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch;
  });

  const filteredTutorials = tutorialData.filter(tutorial => {
    const matchesCategory = selectedCategory === 'All Categories' || tutorial.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
useEffect(() => {
  if (searchQuery === "") {
    setSelectedCategory("All Categories");
  }
}, [searchQuery]);
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // const handleContactSupport = () => {
  //   setSelectedFilter('Contact');
  // };

  const renderContent = () => {
    if (selectedFilter === 'FAQ') {
      return (
        <div className="faq-section">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="faq-list">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className={`faq-item ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
                <div
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <span className="question-text">{faq.question}</span>
                  <div className="faq-badges">
                    <span className={`expand-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
                {expandedFAQ === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (selectedFilter === 'getstarted') {
      return (
        <div className="faq-section">
          <h2 className="section-title">Getting Started</h2>
          <div className="faq-list">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className={`faq-item ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
                <div
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <span className="question-text">{faq.question}</span>
                  <div className="faq-badges">
                    <span className={`expand-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
                {expandedFAQ === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // if (selectedFilter === 'Tutorials') {
    //   return (
    //     <div className="tutorials-section">
    //       <h2 className="section-title">Tutorials</h2>
    //       <div className="tutorials-grid">
    //         {filteredTutorials.map((tutorial) => (
    //           <div key={tutorial.id} className="tutorial-card">
    //             <div className="tutorial-header">
    //               <h3 className="tutorial-title">{tutorial.title}</h3>
    //               <span className="tutorial-duration">{tutorial.duration}</span>
    //             </div>
    //             <p className="tutorial-description">{tutorial.description}</p>
    //             <div className="tutorial-footer">
    //               <span className="tutorial-category">{tutorial.category}</span>
    //               <button className="read-more-btn">Read More</button>
    //             </div>
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   );
    // }

    if (selectedFilter === 'Contact') {
      return (
        <div className="contact-section" ref={contactSectionRef}>
          <h2 className="section-title">Contact Support</h2>
          <div className="contact-options">
            <div className="contact-card">
              <div className="contact-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Get instant help from our support team</p>
              <button className="contact-btn" onClick={() => openModal('chat')}>Start Chat</button>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email Support</h3>
              <p>Send us a detailed message</p>
              <button className="contact-btn" onClick={() => openModal('email')}>Send Email</button>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📞</div>
              <h3>Phone Support</h3>
              <p>Speak directly with our team</p>
              <button className="contact-btn" onClick={() => openModal('phone')}>Call Now</button>
            </div>
          </div>
        </div>
      );
    }


    if (selectedFilter === 'Feedback') {
      return (
        <div className="feedback-section">
          <h2 className="section-title">Share Your Feedback</h2>
          <div className="feedback-form">
            <div className="form-group">
              <label htmlFor="feedback-type">Feedback Type</label>
              <select id="feedback-type" className="form-select">
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>General Feedback</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="feedback-message">Your Message</label>
              <textarea
                id="feedback-message"
                className="form-textarea"
                placeholder="Tell us what you think..."
                rows="5"
              ></textarea>
            </div>
            <button className="submit-feedback-btn">Submit Feedback</button>
          </div>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (selectedFilter === 'Contact' && contactSectionRef.current) {
      contactSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedFilter]);

  return (
    <div className="help-container">
      <div className="help-hero">
        <div className="hero-left">

          <h1 className="hero-title">How can we help you today?</h1>

          <p className="hero-sub">
            Search our knowledge base for answers to common questions
          </p>

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

          {/* <div className="hero-topics">
            <span>Common topics:</span>
            <button onClick={() => handleSearch("smtp")}>smtp</button>
            <button onClick={() => handleSearch("validation")}>validation</button>
            <button onClick={() => handleSearch("contacts")}>contacts</button>
          </div> */}

        </div>

        <div className="hero-right">
          <div className="hero-card">
            <h3>Getting Started</h3>
            <p>Learn everything you need to know to get started</p>
            <button
              className="hero-card-btn"
              onClick={() => {
                setSelectedFilter("getstarted");
                setSelectedCategory("All Categories");
              }}
            >
              Get started →
            </button>
          </div>
        </div>
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


      <div className="faq-layout">

        <div className="faq-left">
          {renderContent()}
        </div>

        <div className="faq-right">
          <img src={faqImage} alt="support" />
        </div>

      </div>

      {isModalOpen && (
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
      )}
    </div>
  );
};

export default Help;
