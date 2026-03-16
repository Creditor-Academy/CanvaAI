import React, { useState, useEffect } from "react";
import api from "../../services/api";
import userService from "../../services/UserDash/User.service";

export default function CreditsAnalytics() {
  const [usage, setUsage] = useState({
    ppt: { pptGeneration: 0, slideGeneration: 0, slideExpand: 0, imagesInsidePPT: 0 },
    image: { aiGenerator: 0, editor: 0 },
    document: { aiGenerator: 0, editorImages: 0 }
  });

  const [TOTAL_CREDITS, setTotalCredits] = useState(0);
  const [wallet, setWallet] = useState({
    totalBalance: 0,
    usedBalance: 0,
    totalTokens: 0,
    remainingTokens: 0
  });
  const [loading, setLoading] = useState(true);


  const [userName, setUserName] = useState("");
  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();

        const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
        setUserName(fullName);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    const fetchDashboard = async () => {
      try {

        const res = await userService.getWalletDashboard();

        const data = res.data;
        console.log(data)

        setTotalCredits(res.totalTokens);

        setUsage({
          ppt: {
            pptGeneration: data.presentation.pptGeneration,
            slideGeneration: data.presentation.slideGeneration,
            slideExpand: data.presentation.slideExpand,
            imagesInsidePPT: data.presentation.imagesInsidePPT
          },
          image: {
            aiGenerator: data.image.aiImageGenerator,
            editor: data.image.imageEditorUsage
          },
          document: {
            aiGenerator: data.document.aiDocumentGenerator,
            editorImages: data.document.editorImageGeneration
          }
        });
        setWallet({
          totalBalance: data.totalBalance,
          usedBalance: data.usedBalance,
          remainingTokens: data.remainingTokens,
          totalTokens: data.totalTokens

        });
        setLoading(false);

      } catch (error) {
        console.error("Dashboard API error:", error);
      }
    };

    fetchProfile();
    fetchDashboard();

  }, []);


  const percent =
    wallet.totalBalance > 0
      ? (wallet.usedBalance / wallet.totalBalance) * 100
      : 0;

  const Row = ({ label, value, color }) => {

    const numericValue = Number(value?.toString().replace("$", "") || 0);
    const formattedValue = `$${numericValue.toFixed(3)}`;// 3 decimal places

    const p = Math.min(100, numericValue * 100);

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[13px]">
          <span className="text-slate-600">{label}</span>
          <span className="font-semibold text-slate-900">{formattedValue}</span>
        </div>

        <div className="h-[6px] rounded-full bg-slate-200 overflow-hidden">
          <div
            style={{ width: `${p}%` }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
      </div>
    );
  };

  const Section = ({ title, icon, color, children }) => (
    <div
      className="group relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
    >
      {/* top bar */}
      <div className={`h-2 w-full ${color}`}></div>

      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
            {icon}
          </div>
          <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
        </div>

      </div>

      <div className="px-6 py-6 space-y-5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-22 bg-[#f8fafc]">
      {/* HEADER */}
      <div
        className="max-w-6xl mx-auto mb-10 grid md:grid-cols-4 gap-4"
      >
        <div className="col-span-3 relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-md p-7 shadow-sm overflow-hidden">

          {/* subtle decorative background */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-100/40 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-24 right-10 w-72 h-72 bg-indigo-100/40 blur-3xl rounded-full"></div>

          <div className="relative z-10 flex flex-col gap-6">

            {/* TOP ROW */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">



                {/* greeting */}
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 leading-tight">
                    {userName || "User"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Your AI workspace activity overview
                  </p>
                </div>
              </div>

              {/* animated gif */}
              <img
                src="https://i.pinimg.com/originals/5b/09/47/5b0947323a888e2f07376109961c78da.gif"
                alt="analytics"
                className="w-14 h-14 object-contain opacity-90"
              />
            </div>





            {/* USAGE */}
            <div className="space-y-2">

              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>Monthly Usage</span>
                <span>
                  {Number(wallet.remainingTokens || 0).toFixed(3)} /
                  {Number(wallet.totalTokens || 0).toFixed(3)}
                </span>
              </div>

              {/* FULL WIDTH BAR */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${percent}%` }}
                  className="h-full bg-[#fbbf24] rounded-full"
                />
              </div>



            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl p-6 flex flex-col justify-center text-white shadow-xl
                bg-gradient-to-br from-[#bdc8d8] via-[#62b2e1] to-[#1e40af]">

          {/* floating image */}
          <img
            src="https://pngimg.com/uploads/hourglass/hourglass_PNG3.png"
            alt="credits"
            className="pointer-events-none select-none absolute top-2 right-2 w-10 opacity-90 mix-blend-soft-light"
          />

          {/* soft glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/20 blur-3xl rounded-full"></div>

          {/* subtle glass layer */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>

          <div className="relative z-10">
            <div className="text-sm opacity-90">Remaining</div>
            <div className="text-4xl font-bold tracking-tight">
              ${Number(wallet.usedBalance || 0).toFixed(3)}
            </div>
            <div className="text-xs opacity-80">
              of  ${wallet.totalBalance}
            </div>

            <button className="mt-5 w-full bg-white text-[#1e293b] font-semibold py-2.5 rounded-xl
                   hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-md">
              RENEW PLAN
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

        <Section
          title="Presentation"
          color="bg-blue-800"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 20h8" /></svg>}
        >
          <Row label="PPT Generation" value={`$${usage.ppt.pptGeneration}`} color="bg-blue-800" />
          <Row label="Slide Generation" value={`$${usage.ppt.slideGeneration}`} color="bg-blue-800" />
          <Row label="Slide Expand" value={`$${usage.ppt.slideExpand}`} color="bg-blue-800" />
          <Row label="Images inside PPT" value={`$${usage.ppt.imagesInsidePPT}`} color="bg-blue-800" />
        </Section>

        <Section
          title="Images"
          color="bg-[#475569]"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>}
        >
          <Row label="AI Generator" value={`$${usage.image.aiGenerator}`} color="bg-[#475569]" />
          <Row label="Editor Usage" value={`$${usage.image.editor}`} color="bg-[#475569]" />
        </Section>

        <Section
          title="Documents"
          color="bg-[#62b2e1]"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" /><path d="M14 2v6h6" /></svg>}
        >
          <Row label="AI Generator" value={`$${usage.document.aiGenerator}`} color="bg-[#62b2e1]" />
          <Row label="Editor Images" value={`$${usage.document.editorImages}`} color="bg-[#62b2e1]" />
        </Section>

      </div>
    </div>
  );
}
