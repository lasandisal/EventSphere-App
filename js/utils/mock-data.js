/* Demo-mode fallback data. Every api/*.js call hits the real backend
   first; screens fall back to this only if the request fails (e.g. no
   backend running), so the UI stays fully browsable on its own. */
const EsMock = {
  categories: [
    { id: 1, name: 'Music', slug: 'music', icon: '🎵', cls: 'cat-music' },
    { id: 2, name: 'Technology', slug: 'technology', icon: '💡', cls: 'cat-tech' },
    { id: 3, name: 'Workshops', slug: 'workshops', icon: '✂️', cls: 'cat-workshop' },
    { id: 4, name: 'Sports', slug: 'sports', icon: '🏃', cls: 'cat-sports' },
    { id: 5, name: 'Community', slug: 'community', icon: '🤝', cls: 'cat-community' },
    { id: 6, name: 'Food & Lifestyle', slug: 'food', icon: '🍰', cls: 'cat-food' },
    { id: 7, name: 'Arts', slug: 'arts', icon: '🎨', cls: 'cat-arts' },
    { id: 8, name: 'Education', slug: 'education', icon: '📚', cls: 'cat-education' }
  ],

  events: [
    { id: 101, title: 'AI & Innovation Summit', category: 'Technology', pill: 'pill-blue', date: 'Sat, September 12', time: '9:00 AM', venue: 'Colombo', price: 2500, availability: 'high', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
    { id: 102, title: 'Golden Hour Acoustic Night', category: 'Music', pill: 'pill-blush', date: 'Fri, September 18', time: '6:30 PM', venue: 'Galle Face Green', price: 1800, availability: 'low', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80' },
    { id: 103, title: 'Ceramics & Slow Mornings', category: 'Workshops', pill: 'pill-lavender', date: 'Sun, September 20', time: '10:00 AM', venue: 'Barefoot Garden Cafe', price: 3200, availability: 'high', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80' },
    { id: 104, title: 'Colombo Coastal 10K', category: 'Sports', pill: 'pill-sage', date: 'Sat, September 26', time: '5:30 AM', venue: 'Marine Drive', price: 1200, availability: 'high', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80' },
    { id: 105, title: 'Neighbourhood Flea & Supper', category: 'Community', pill: 'pill-beige', date: 'Sat, October 3', time: '4:00 PM', venue: 'Independence Square', price: 0, availability: 'high', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80' },
    { id: 106, title: 'Sourdough & Slow Bakes', category: 'Food & Lifestyle', pill: 'pill-blush', date: 'Sun, October 4', time: '9:00 AM', venue: 'Colombo 7', price: 4500, availability: 'low', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80' },
    { id: 107, title: 'Watercolour & Wine', category: 'Arts', pill: 'pill-lavender', date: 'Fri, October 9', time: '5:00 PM', venue: 'Rio Cinema Lane', price: 2800, availability: 'high', img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80' },
    { id: 108, title: 'Product Thinking Masterclass', category: 'Education', pill: 'pill-blue', date: 'Sat, October 10', time: '1:00 PM', venue: 'WeWork Colombo', price: 5000, availability: 'high', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80' }
  ],

  ticketTypes: [
    { id: 1, name: 'General', price: 2500, available: 42 },
    { id: 2, name: 'VIP', price: 5000, available: 12 }
  ],

  bookings: [
    { id: 5001, event: 'AI & Innovation Summit', date: 'Sep 12, 2026', venue: 'Colombo', tickets: 2, status: 'confirmed', total: 5000, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80' },
    { id: 5002, event: 'Golden Hour Acoustic Night', date: 'Sep 18, 2026', venue: 'Galle Face Green', tickets: 1, status: 'pending', total: 1800, img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80' },
    { id: 5003, event: 'Ceramics & Slow Mornings', date: 'Jun 2, 2026', venue: 'Barefoot Garden Cafe', tickets: 1, status: 'completed', total: 3200, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80' },
    { id: 5004, event: 'Product Thinking Masterclass', date: 'May 14, 2026', venue: 'WeWork Colombo', tickets: 1, status: 'cancelled', total: 5000, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80' }
  ]
};
window.EsMock = EsMock;
