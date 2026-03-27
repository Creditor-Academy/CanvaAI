import React, { useState, useEffect } from "react";
import api from "../../services/api";
import userService from "../../services/UserDash/User.service";
import userdash from "../../assets/user-dash.webm";
import { useNavigate } from "react-router-dom";


export default function CreditsAnalytics() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usage, setUsage] = useState({
    ppt: {
      pptGeneration: 0,
      slideGeneration: 0,
      slideExpand: 0,
      imagesInsidePPT: 0
    },
    image: { aiGenerator: 0, editor: 0 },
    document: { aiGenerator: 0, editorImages: 0 }
  });


  const [wallet, setWallet] = useState({
    totalBalance: 0,
    usedBalance: 0,
    totalTokens: 0,
    remainingTokens: 0
  });


  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");


  const remainingBalance =
    Number(wallet.totalBalance || 0) - Number(wallet.usedBalance || 0);


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


    const fetchOrders = async () => {
      try {
        const data = await userService.getAllOrders();
        const orderList = data.orders || data.data || data || [];
        setOrders(Array.isArray(orderList) ? orderList : []);
      } catch (error) {
        console.error("Orders API error:", error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchProfile();
    fetchDashboard();
    fetchOrders();
  }, []);


  // const handleRenewPlan = async () => {
  //   try {
  //     const amount = Number(500);
  //     await userService.creditWallet(amount);


  //     const res = await userService.getWalletDashboard();
  //     const data = res.data;


  //     setWallet({
  //       totalBalance: data.totalBalance,
  //       usedBalance: data.usedBalance,
  //       remainingTokens: data.remainingTokens,
  //       totalTokens: data.totalTokens
  //     });
  //   } catch (error) {
  //     console.error("Renew plan failed:", error.message);
  //   }
  // };

  const handleRenewPlan = () => {
  navigate("/pricing");
};


  const percent =
    wallet.totalTokens > 0
      ? (wallet.remainingTokens / wallet.totalTokens) * 100
      : 0;


  const Row = ({ label, value }) => {
    const numericValue = Number(value?.toString().replace("$", "") || 0);
    const formattedValue = `$${numericValue.toFixed(4)}`;


    return (
      <div className="flex items-center justify-between gap-3  rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5 transition-all duration-200 hover:bg-white hover:shadow-sm">
        <span className="text-[12px] sm:text-[13px] font-medium text-slate-600 leading-snug">
          {label}
        </span>
        <span className="text-[13px] sm:text-[14px] font-semibold text-slate-900 shrink-0">
          {formattedValue}
        </span>
      </div>
    );
  };


  const Section = ({ title, icon, color, children }) => (
    <div className="group relative overflow-hidden rounded-[20px] lg:rounded-[22px] border border-slate-200/80 bg-white/85 shadow-[0_6px_20px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(30,41,59,0.09)]">
      <div className={`h-1.5 w-full ${color}`}></div>
      <div className="relative px-5 pt-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md ${color}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-[18px] lg:text-[19px] font-bold leading-none tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">Usage breakdown</p>
          </div>
        </div>
      </div>
      <div className="relative space-y-3 px-5 py-5">
        {children}
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-[#e9f4ff]
      pt-[88px] px-3 pb-[92px]
      sm:px-4 sm:pb-[96px]
      md:px-5 md:pb-[100px]
      lg:pt-[92px] lg:pb-8 lg:pl-[96px] lg:pr-6"
    >
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
          <div className="lg:col-span-3 relative rounded-[22px] border border-slate-200 bg-white/80 backdrop-blur-md p-4 sm:p-5 lg:p-5 shadow-sm overflow-hidden">
            <div className="absolute -top-20 -left-20 w-52 h-52 sm:w-64 sm:h-64 bg-blue-100/40 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-24 right-10 w-52 h-52 sm:w-64 sm:h-64 bg-indigo-100/40 blur-3xl rounded-full"></div>


            <div className="relative z-10 flex flex-col gap-4 lg:gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-slate-800 leading-tight break-words">
                    Hi, {userName || "User"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed max-w-[560px]">
                    Here’s your workspace usage and credit activity for this month.
                  </p>
                </div>


                <video
                  src={userdash}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-12 sm:h-14 lg:h-14 object-contain self-start sm:self-center shrink-0"
                />
              </div>


              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                  <span>Monthly Usage</span>
                  <span className="shrink-0">
                    {Number(wallet.remainingTokens || 0).toFixed(4)} /
                    {Number(wallet.totalTokens || 0).toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full bg-[#fbbf24] rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>


          <div className="relative overflow-hidden rounded-[22px] p-4 sm:p-5 lg:p-5 flex flex-col justify-center text-white shadow-xl bg-gradient-to-br from-[#bdc8d8] via-[#62b2e1] to-[#1e40af] min-h-[170px] lg:min-h-[190px]">
            <img
              src="https://pngimg.com/uploads/hourglass/hourglass_PNG3.png"
              alt="credits"
              className="pointer-events-none select-none absolute top-2 right-2 w-8 sm:w-9 opacity-90 mix-blend-soft-light"
            />
            <div className="absolute -top-24 -right-24 w-52 h-52 sm:w-64 sm:h-64 bg-white/20 blur-3xl rounded-full"></div>
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>


            <div className="relative z-10">
              <div className="text-xs sm:text-sm opacity-90">Remaining</div>
              <div className="text-[28px] sm:text-[34px] lg:text-[36px] font-bold tracking-tight break-words">
                ${remainingBalance.toFixed(4)}
              </div>
              <div className="text-[11px] sm:text-xs opacity-80">
                of ${Number(wallet.totalBalance || 0).toFixed(4)}
              </div>


              <button
                onClick={handleRenewPlan}
                className="mt-4 inline-flex items-center justify-center bg-white text-[#1e293b] font-semibold py-2 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md text-[13px] sm:text-sm w-auto min-w-[140px]"
              >
                RENEW PLAN
              </button>
            </div>
          </div>
        </div>


        {/* BOTTOM BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-[900px] mx-auto">
          <Section
            title="Presentation"
            color="bg-blue-800"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <path d="M8 20h8" />
              </svg>
            }
          >
            <Row label="PPT Generation" value={`$${usage.ppt.pptGeneration}`} />
            <Row label="Slide Generation" value={`$${usage.ppt.slideGeneration}`} />
            <Row label="Slide Expand" value={`$${usage.ppt.slideExpand}`} />
            <Row label="Images inside PPT" value={`$${usage.ppt.imagesInsidePPT}`} />
          </Section>


          <Section
            title="Images"
            color="bg-[#475569]"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            }
          >
            <Row label="AI Generator" value={`$${usage.image.aiGenerator}`} />
            <Row label="Editor Usage" value={`$${usage.image.editor}`} />
          </Section>


          {/* <Section
            title="Documents"
            color="bg-[#62b2e1]"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
                <path d="M14 2v6h6" />
              </svg>
            }
          >
            <Row label="AI Generator" value={`$${usage.document.aiGenerator}`} />
            <Row label="Editor Images" value={`$${usage.document.editorImages}`} />
          </Section> */}
        </div>

        {/* ORDER HISTORY */}
        <div className="mt-6 lg:mt-8 max-w-[900px] mx-auto">
          <div className="rounded-[20px] lg:rounded-[22px] border border-slate-200/80 bg-white/85 shadow-[0_6px_20px_rgba(15,23,42,0.05)] backdrop-blur-xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-800 to-indigo-600"></div>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md bg-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[18px] lg:text-[19px] font-bold leading-none tracking-tight text-slate-900">Order History</h3>
                  <p className="mt-1 text-[11px] text-slate-500">All your payment transactions</p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">No orders found.</div>
              ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Order ID</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order, idx) => (
                        <tr key={order._id || order.orderId || idx} className="hover:bg-slate-50/60 transition-colors duration-150">
                          <td className="py-3 px-3 text-[12px] text-slate-500 font-mono">
                            #{(order._id || order.orderId || "").toString().slice(-8).toUpperCase()}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-medium text-slate-700">
                            {order.planName || order.plan || order.description || "—"}
                          </td>
                          <td className="py-3 px-3 text-[13px] font-semibold text-slate-900">
                            ${Number(order.amount || order.price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              (order.status || "").toLowerCase() === "completed" || (order.status || "").toLowerCase() === "success" || (order.status || "").toLowerCase() === "succeeded" || (order.status || "").toLowerCase() === "paid"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : (order.status || "").toLowerCase() === "pending"
                                ? "bg-red-50 text-red-400 border border-red-200"
                                : "bg-red-100 text-red-700 border border-red-300"
                            }`}>
                              {order.status || "Unknown"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[12px] text-slate-500">
                            {order.createdAt || order.date
                              ? new Date(order.createdAt || order.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}