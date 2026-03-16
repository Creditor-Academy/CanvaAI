import React from "react";

const templates = [
{
id:1,
title:"Business Pitch",
img:"https://images.unsplash.com/photo-1557804506-669a67965ba0"
},
{
id:2,
title:"Startup Deck",
img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
},
{
id:3,
title:"Marketing Slides",
img:"https://images.unsplash.com/photo-1552664730-d307ca884978"
},
{
id:4,
title:"Product Presentation",
img:"https://images.unsplash.com/photo-1519389950473-47ba0277781c"
}
];

export default function PresentationTemplates(){

return(

<div className="max-w-7xl mx-auto px-6 py-10">

<h1 className="text-3xl font-bold mb-8">
Presentation Templates
</h1>

<div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">

{templates.map(t => (

<div
key={t.id}
className="border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
>

<img
src={t.img}
alt=""
className="w-full h-40 object-cover"
/>

<div className="p-4">

<h3 className="font-semibold">
{t.title}
</h3>

<button className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded">
Use Template
</button>

</div>

</div>

))}

</div>

</div>

);

}
