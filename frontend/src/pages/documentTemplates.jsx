import React from "react";

const templates = [
{
id:1,
title:"Project Report"
},
{
id:2,
title:"Resume Template"
},
{
id:3,
title:"Meeting Notes"
},
{
id:4,
title:"Business Proposal"
}
];

export default function DocumentTemplates(){

return(

<div className="max-w-7xl mx-auto px-6 py-10">

<h1 className="text-3xl font-bold mb-8">
Document Templates
</h1>

<div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">

{templates.map(t => (

<div
key={t.id}
className="border rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
>

<h3 className="font-semibold text-lg">
{t.title}
</h3>

<p className="text-sm text-gray-500 mt-2">
Editable document template
</p>

<button className="mt-4 bg-yellow-500 text-white px-3 py-1 rounded text-sm">
Use Template
</button>

</div>

))}

</div>

</div>

);

}
