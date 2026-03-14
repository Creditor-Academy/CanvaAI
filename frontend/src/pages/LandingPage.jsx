import React, { useEffect } from "react";
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';


import HowItWorks from '../components/landing/HowItWorks';





import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import Navbar from '../components/landing/Navbar';
import { initScrollReveal } from '../components/landing/ScrollReveal';

const LandingPage = () => {
  useEffect(() => {
    initScrollReveal(document);
    const root = document.querySelector('.landing-page');
    const savedTheme = localStorage.getItem('landingTheme');
    if (root && savedTheme === 'dark') root.classList.add('dark');
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
   
    
   
      
     
      
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
