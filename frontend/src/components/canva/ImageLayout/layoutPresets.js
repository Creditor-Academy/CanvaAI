/** Top-row quick actions for dashboard Create modal */
export const quickStartOptions = [
  {
    id: 'presentation',
    name: 'Presentation',
    route: '/presentation-editor-v3',
    width: 1920,
    height: 1080,
    thumbnail:
      'https://i.pinimg.com/736x/96/52/26/965226daa2d2a6aab40d6458646f34f4.jpg',
    accent: 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%)',
  },
  {
    id: 'ai-ppt',
    name: 'AI PPT',
    route: '/dashboard/ai-presentation',
    width: 1920,
    height: 1080,
    thumbnail:
      'https://i.pinimg.com/1200x/ee/df/40/eedf409776e505b5c1db7141dfff5317.jpg',
    accent: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
  },
];

/** Canvas size presets for "Create Fresh" — grouped like Canva's create flow */
export const layoutPresetSections = [
  {
    id: 'basic',
    title: 'Popular',
    items: [
      {
        id: 'default',
        name: 'Default Canvas',
        width: 800,
        height: 600,
        thumbnail:
          'https://cdn-icons-png.flaticon.com/512/4229/4229137.png',
      },
      {
        id: 'banner',
        name: 'Banner',
        width: 1200,
        height: 300,
        thumbnail:
          'https://content-management-files.canva.com/124e29b3-df94-49f5-abbc-038d6e4d3509/feature_clip-art_hero_EN.jpg',
      },
      {
        id: 'mobile',
        name: 'Mobile view',
        width: 1080,
        height: 1920,
        thumbnail:
          'https://img.magnific.com/free-vector/smartphone-cartoon_78370-590.jpg?semt=ais_hybrid&w=740&q=80',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social media',
    items: [
      {
        id: 'youtube-thumb',
        name: 'YouTube Thumbnail',
        width: 1280,
        height: 720,
        thumbnail:
          'https://static.vecteezy.com/system/resources/thumbnails/036/318/070/small/youtube-channel-cover-wireframe-youtube-banner-for-design-your-channel-youtube-channel-name-lower-third-free-vector.jpg',
      },
      {
        id: 'facebook-post',
        name: 'Facebook Post',
        width: 940,
        height: 788,
        thumbnail:
          'https://img.magnific.com/free-vector/social-media-facebook-post-frame_23-2150956454.jpg?semt=ais_hybrid&w=740&q=80',
      },
      {
        id: 'linkedin-bg',
        name: 'LinkedIn Background Photo',
        width: 1584,
        height: 396,
        thumbnail:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/LinkedIn_2021.svg/1920px-LinkedIn_2021.svg.png',
      },
      {
        id: 'instagram-story',
        name: 'Instagram Story',
        width: 1080,
        height: 1920,
        thumbnail: 'https://image.pngaaa.com/531/1654531-middle.png',
      },
      {
        id: 'whatsapp-status',
        name: 'WhatsApp Status',
        width: 1080,
        height: 1920,
        thumbnail:
          'https://cdn.iconscout.com/icon/free/png-256/free-add-whatsapp-status-icon-svg-download-png-6147340.png?f=webp&w=128',
      },
      {
        id: 'instagram-post-45',
        name: 'Instagram Post (4:5)',
        width: 1080,
        height: 1350,
        thumbnail:
          'https://thepreviewapp.com/wp-content/uploads/2020/01/instagram-sizes-portrait-photo.jpg',
      },
      {
        id: 'facebook-cover',
        name: 'Facebook Cover',
        subtitle: 'Landscape',
        width: 851,
        height: 315,
        thumbnail:
          'https://www.shoutmeloud.com/wp-content/uploads/2012/07/Create-Facebook-Cover.png',
      },
      {
        id: 'twitter-post',
        name: 'Twitter / X Post',
        width: 1600,
        height: 900,
        thumbnail:
          'https://static.vecteezy.com/system/resources/previews/027/880/346/non_2x/twitter-new-logo-twitter-icons-new-twitter-logo-x-2023-twitter-logo-x-free-vector.jpg',
      },
      {
        id: 'pinterest-pin',
        name: 'Pinterest Pin (2:3)',
        width: 1000,
        height: 1500,
        thumbnail: '/thumbnails/pinterest-pin.png',
      },
      {
        id: 'facebook-carousel',
        name: 'Facebook Carousel',
        subtitle: '1:1 per card',
        width: 1080,
        height: 1080,
        thumbnail:
          'https://img.magnific.com/free-vector/social-media-facebook-post-frame_23-2150956454.jpg?semt=ais_hybrid&w=740&q=80',
      },
    ],
  },
];

export const allLayoutPresets = layoutPresetSections.flatMap((s) => s.items);
