(function () {
  const tiers = [
    { tier: 50, price: 50000, ids: ['love-50-01','love-50-02','love-50-03','love-50-04','love-50-05','love-50-06','love-50-07','love-50-08','love-50-09','love-50-10','love-50-11','love-50-12','love-50-13','love-50-14','love-50-15'], names: ['Love Light','Sweet Day','Minimal Love','Pink Heart','Warm Hug','Little Love','Blossom','First Date','Pure Love','Sunshine','You & Me','Love Diary','Sky Love','Together','Simple Heart'] },
    { tier: 150, price: 150000, ids: ['love-150-01','love-150-02','love-150-03','love-150-04','love-150-05','love-150-06','love-150-07','love-150-08','love-150-09','love-150-10'], names: ['Love Journey','Our Story','Memory Lane','Love in Paris','Heartbeat','Starry Night','Garden Love','Dancing Love','Ocean Love','Romantic Ride'] },
    { tier: 300, price: 300000, ids: ['love-300-01','love-300-02','love-300-03','love-300-04','love-300-05'], names: ['Love Galaxy','Eternal Love','Floating Hearts','Love Castle','Golden Memories'] },
    { tier: 500, price: 500000, ids: ['love-500-01','love-500-02'], names: ['Love Fantasy','Love Universe'] }
  ];

  const schema = [
    { id: 'name1', label: 'Tên người thứ nhất', type: 'text', required: true },
    { id: 'name2', label: 'Tên người thứ hai', type: 'text', required: true },
    { id: 'photo1', label: 'Ảnh người thứ nhất', type: 'file', accept: 'image/*' },
    { id: 'photo2', label: 'Ảnh người thứ hai', type: 'file', accept: 'image/*' },
    { id: 'album', label: 'Album ảnh', type: 'file', accept: 'image/*', multiple: true },
    { id: 'message', label: 'Lời nhắn', type: 'textarea' },
    { id: 'letter', label: 'Lá thư', type: 'textarea' },
    { id: 'startDate', label: 'Ngày đặc biệt', type: 'date' },
    { id: 'music', label: 'Nhạc nền', type: 'file', accept: 'audio/*' }
  ];

  const templates = tiers.flatMap((tier) => tier.ids.map((id, index) => ({
    id,
    name: tier.names[index],
    tier: tier.tier,
    price: tier.price,
    category: 'love',
    categoryLabel: 'Tình yêu',
    description: `${tier.names[index]} - không gian lưu giữ câu chuyện của hai người.`,
    features: ['Hero', 'Love story', 'Gallery', 'Timeline', 'Final message'],
    thumbnail: 'love',
    badge: tier.tier === 50 && index === 0 ? 'Nổi bật' : '',
    preview: `/templates/${tier.tier === 50 ? 'love-50' : `love-${tier.tier}`}/${id}/index.html`,
    path: `/templates/${tier.tier === 50 ? 'love-50' : `love-${tier.tier}`}/${id}/`,
    status: 'published',
    enabled: true,
    schema
  })));

  window.LuuButTemplateRegistry = Object.freeze(templates);
})();
