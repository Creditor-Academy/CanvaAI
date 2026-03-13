import React, { useState, useRef } from 'react'
import api from '../../../services/api'
import { jsPDF } from "jspdf";

const EXAMPLES = [
  'Create a landing page copy for a fitness app',
  'Write product description for wireless earbuds',
  'Generate SEO blog outline for digital marketing',
  'Write cold outreach email for web design services'
]

export default function ContentWriter() {
  const [brief, setBrief] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const resultRef = useRef(null);

  const downloadPDF = () => {
    if (!output) return;

    const doc = new jsPDF("p", "pt", "a4");

    // clean line breaks
    const text = output.replace(/\n{2,}/g, "\n\n");

    const marginX = 40;
    const marginY = 50;
    const pageWidth = doc.internal.pageSize.width - marginX * 2;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFont("Times", "Normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(text, pageWidth);

    let y = marginY;

    lines.forEach((line, i) => {
      if (y + 18 > pageHeight - marginY) {
        doc.addPage();
        y = marginY;
      }
      doc.text(line, marginX, y);
      y += 18;
    });

    doc.save("AI_Content.pdf");
  };

  const generate = async () => {
    if (!brief.trim()) return;

    setLoading(true);
    setOutput('');

    try {
      const data = await api.generateContent(brief);
      setOutput(data.result || 'No content');

      // wait for render then scroll
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 200);

    } catch (e) {
      setOutput('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="height:100vh pl-20 pt-20" style={{
      background: ' linear-gradient(-45deg, #b8e5ff, #f9fafb)',
      backgroundSize: '400% 400%',
      height: '100vh',
    }}>

      {/* HERO */}
      <section className="height:100vh px-6 py-8 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">AI Content Generator</h1>
          <p className="text-slate-500 mt-4">Describe what you want — AI will create ready‑to‑use content instantly</p>


          {/* TOP PROMPT */}
          {/* PROMPT AREA */}
          <div className="mt-8">

            {/* input box */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm px-6 py-5">

              <div className="flex items-end gap-4">

                <textarea
                  value={brief}
                  onChange={(e) => {
                    setBrief(e.target.value)
                    e.target.style.height = "56px"
                    e.target.style.height = e.target.scrollHeight + "px"
                  }}
                  rows={1}
                  placeholder="Create anything..."
                  className="flex-1 resize-none outline-none text-[17px] leading-relaxed max-h-[220px] text-slate-700 placeholder:text-slate-400"
                  style={{ height: "56px" }}
                />

                <button
                  onClick={generate}
                  disabled={loading || !brief.trim()}
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-[#0c4a6e] hover:bg-[#67abd2] transition disabled:opacity-40"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

              </div>

            </div>

            {/* example prompts */}
            <div className="mt-10 flex flex-wrap justify-start gap-3 max-w-3xl">
              {EXAMPLES.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setBrief(e)}
                  className="bg-white/80 hover:bg-white/20 border border-white/15 px-4 py-2 rounded-full text-sm backdrop-blur-md text-slate-700 hover:text-slate-900 transition  "
                >
                  {e}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="hidden md:block relative h-[520px] pointer-events-none select-none">
          {/* dark background overlay */}
          {/* <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0f1115] via-[#111318] to-[#0b0d10]"></div> */}

          {/* grid lines */}
          <div className="absolute right-24 top-16 w-[370px] h-[370px]">
            <div className="absolute inset-0 bg-[linear-gradient(#000_2px,transparent_2px),linear-gradient(90deg,#000_2px,transparent_2px)] bg-[size:32px_32px]"></div>
          </div>

          {/* big back card */}
          <div className="absolute right-8 top-6 w-[320px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <img src="https://images.unsplash.com/photo-1681505504714-4ded1bc247e7?w=500&auto=format&fit=crop&q=60" className="w-full h-full object-cover" />
          </div>

          {/* front overlapping card */}
          <div className="absolute left-19 bottom-16 w-[320px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <img src="https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=500&auto=format&fit=crop&q=60" className="w-full h-full object-cover" />
          </div>

        </div>
      </section>

      {/* PREVIEW SECTION SEPARATE */}
      {output && (
        <section ref={resultRef} className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-white rounded-2xl border shadow-xl p-6">
            <div className="flex justify-end gap-3 mb-4">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 rounded-lg border"
              >
                Download
              </button>
              <button className="px-4 py-2 rounded-lg text-white" style={{ background: 'var(--athena-btn-secondary)' }}>Open in Editor</button>
            </div>
            <pre className="whitespace-pre-wrap text-slate-700">{output}</pre>
          </div>
        </section>
      )}

    </div>
  )
}
