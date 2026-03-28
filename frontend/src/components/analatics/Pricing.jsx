import React, { useState } from "react";
import api from "../../services/api";

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const plans = [
    {
      name: "Basic",
      price: 10,
      description: "Best for beginners",
      features: [
        "Manual Presentation Creation",
        "Basic Templates",
        "Basic Image Editing",
        "5 AI PPT",
        "5 AI Image Edits",
        "Download Files",
        "Community Support",
      ],
      popular: false,
      button: "bg-blue-50 text-blue-700 hover:bg-blue-100",
      border: "border-blue-200",
    },
    {
      name: "Pro",
      price: 20,
      description: "Best for students & professionals",
      features: [
        "Unlimited Presentations",
        "AI Presentation Generation",
        "AI Image Editing",
        "Premium Templates",
        "Advanced Editing Tools",
        "Download PDF, PPTX, PNG",
        "Fast AI Generation",
        "Priority Support",
      ],
      popular: true,
      button: "bg-yellow-400 text-white hover:bg-yellow-500",
      border: "border-yellow-300",
    },
    {
      name: "Elite",
      price: 30,
      description: "Best for teams & businesses",
      features: [
        "Everything in Pro",
        "Team Collaboration",
        "Shared Workspace",
        "Team Templates",
        "Admin Controls",
        "Cloud Storage",
        "Priority Support",
      ],
      popular: false,
      button: "bg-blue-500 text-white hover:bg-blue-600",
      border: "border-blue-300",
    },
  ];

  const features = [
    { name: "Manual Presentation Creation", free: true, pro: true, team: true },
    { name: "AI Presentation Generation", free: "Limited", pro: true, team: true },
    { name: "AI Image Editing", free: "Limited", pro: true, team: true },
    { name: "Premium Templates", free: false, pro: true, team: true },
    { name: "Download PPT/PDF/PNG", free: true, pro: true, team: true },
    { name: "Cloud Storage", free: false, pro: true, team: true },
    { name: "Team Collaboration", free: false, pro: false, team: true },
    { name: "Priority Support", free: false, pro: true, team: true },
  ];
  const handlePayment = async (planName) => {
    try {
      setLoading(true);

      const planMapping = {
        Basic: "Basic_Test",
        Pro: "Pro_Test",
        Elite: "Elite_Test",
      };

      const planId = planMapping[planName];

      const res = await api.createPayment(planId);

      if (res.checkoutUrl) {
        // Tab open AFTER API response
        window.open(res.checkoutUrl, "_blank");
        setLoading(false);
      } else {
        setLoading(false);
        console.log("Checkout URL not found");
      }

    } catch (error) {
      console.error("Payment error:", error);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#e9f4ff] 
  pt-[100px] 
  pl-[90px] 
  pr-4 
  pb-10 
  font-[Inter]">

      {/* Header */}
      <div id="pricing-top" className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-[Georgia] text-[#1e40af] mb-4">
          Pricing Plans
        </h1>
        <p className="text-gray-600 mb-6">
          Choose our different plans according to your needs.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative rounded-2xl p-8 border ${plan.border}
            bg-white/70 backdrop-blur-lg shadow-lg
            transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl
            flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2
              bg-yellow-400 text-white px-4 py-1 text-sm rounded-full shadow">
                Most Popular
              </div>
            )}

            <h2 className="text-2xl font-[Georgia] text-blue-800">{plan.name}</h2>
            <p className="text-gray-500 mb-4">{plan.description}</p>

            <div className="text-4xl font-bold text-blue-900 mb-6">
              ${plan.price}

            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-gray-700">
                  ✔ {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={loading}
              onClick={() => handlePayment(plan.name)}
              className={`w-full py-3 rounded-xl font-semibold shadow-md transition ${plan.button}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                "Choose Plan"
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto mt-24 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-100 py-4 text-center text-2xl font-[Georgia] text-blue-900">
          Compare Plans
        </div>

        <table className="w-full text-center">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-4 text-left">Features</th>
              <th>Free</th>
              <th>Pro</th>
              <th>Team</th>
            </tr>
          </thead>

          <tbody>
            {features.map((feature, index) => (
              <tr key={index} className="border-t hover:bg-blue-50">
                <td className="p-4 text-left">{feature.name}</td>
                <td>
                  {feature.free === true && <span className="text-green-500 font-bold">✔</span>}
                  {feature.free === false && <span className="text-red-400 font-bold">✖</span>}
                  {feature.free === "Limited" && <span className="text-yellow-500">Limited</span>}
                </td>
                <td>
                  {feature.pro === true && <span className="text-green-500 font-bold">✔</span>}
                  {feature.pro === false && <span className="text-red-400 font-bold">✖</span>}
                </td>
                <td>
                  {feature.team === true && <span className="text-green-500 font-bold">✔</span>}
                  {feature.team === false && <span className="text-red-400 font-bold">✖</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">

            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-blue-900 font-semibold">Redirecting to secure checkout...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;