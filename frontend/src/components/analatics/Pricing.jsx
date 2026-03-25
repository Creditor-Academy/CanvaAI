import React, { useState } from "react";

const Pricing = () => {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const plans = [
    {
      name: "Free",
      monthly: 0,
      yearly: 0,
      description: "Best for beginners",
      features: [
        "Manual Presentation Creation",
        "Basic Templates",
        "Basic Image Editing",
        "5 AI PPT / month",
        "5 AI Image Edits / month",
        "Download Files",
        "Community Support",
      ],
      popular: false,
      button: "bg-blue-50 text-blue-700 hover:bg-blue-100",
      border: "border-blue-200",
    },
    {
      name: "Pro",
      monthly: 299,
      yearly: 2999,
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
      name: "Team",
      monthly: 799,
      yearly: 7999,
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

  const faqs = [
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes, you can cancel anytime from account settings.",
    },
    {
      q: "Will I be charged automatically?",
      a: "Yes, subscription renews automatically unless cancelled.",
    },
    {
      q: "Do you offer refunds?",
      a: "Refund available within 7 days of purchase.",
    },
    {
      q: "Can I upgrade later?",
      a: "Yes, you can upgrade anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#e9f4ff] py-26  font-[Inter]">

      {/* Header */}
      <div id="pricing-top" className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-[Georgia] text-[#1e40af] mb-4">
          Pricing Plans
        </h1>
        <p className="text-gray-600 mb-6">
          Choose our different plans according to your needs.
        </p>

        {/* Toggle */}
        <div className="flex justify-center items-center gap-4">
          <span className={!yearly ? "font-semibold text-blue-700" : ""}>
            Monthly
          </span>
          <div
            className="w-14 h-7 bg-yellow-300 rounded-full flex items-center cursor-pointer"
            onClick={() => setYearly(!yearly)}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow transform duration-300 ${
                yearly ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </div>
          <span className={yearly ? "font-semibold text-blue-700" : ""}>
            Yearly
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative rounded-2xl p-8 border ${plan.border}
            bg-white/70  backdrop-blur-lg shadow-lg
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
              ₹{yearly ? plan.yearly : plan.monthly}
              <span className="text-lg text-gray-500">
                {yearly ? "/year" : "/month"}
              </span>
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-gray-700">
                  ✔ {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-xl font-semibold shadow-md transition ${plan.button}`}>
              Choose Plan
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

      {/* FAQ - FIXED SMOOTH */}
      {/* <div className="max-w-4xl mx-auto mt-24">
        <h2 className="text-3xl font-[Georgia] text-center text-blue-900 mb-10">
          Pricing FAQs
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md border border-blue-100">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex justify-between items-center p-5 text-left"
              >
                <span className="font-semibold text-blue-800">{faq.q}</span>
                <span className="text-xl text-blue-500">
                  {openFaq === index ? "−" : "+"}
                </span>
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${
                openFaq === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-gray-600">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      

    </div>
  );
};

export default Pricing;