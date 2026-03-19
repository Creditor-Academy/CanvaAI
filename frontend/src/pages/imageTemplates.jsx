import React from "react";

const templates = [
{
id:1,
title:"Instagram Post",
img:"https://images.unsplash.com/photo-1542744173-8e7e53415bb0"
},
{
id:2,
title:"YouTube Thumbnail",
img:"https://images.unsplash.com/photo-1522199710521-72d69614c702"
},
{
id:3,
title:"Poster Design",
img:"https://images.unsplash.com/photo-1557683316-973673baf926"
},
{
id:4,
title:"Social Banner",
img:"https://images.unsplash.com/photo-1558655146-d09347e92766"
}
];

export default function ImageTemplates(){

return(

<div className="max-w-7xl mx-auto px-16 py-28">

<h1 className="text-3xl font-bold mb-8">
Image Templates
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

<button className="mt-3 text-sm bg-indigo-600 text-white px-3 py-1 rounded">
Use Template
</button>

</div>

</div>

))}

</div>

</div>

);

}