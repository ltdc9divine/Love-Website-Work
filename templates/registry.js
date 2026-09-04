(function () {
  const tiers = [
    { tier: 50, price: 50000, ids: ['love-50-01','love-50-02','love-50-03','love-50-04','love-50-05','love-50-06','love-50-07','love-50-08','love-50-09','love-50-10','love-50-11','love-50-12','love-50-13','love-50-14','love-50-15'], names: ['Love Light','Sweet Day','Minimal Love','Pink Heart','Warm Hug','Little Love','Blossom','First Date','Pure Love','Sunshine','You & Me','Love Diary','Sky Love','Together','Simple Heart'] },
    { tier: 150, price: 150000, ids: ['love-150-01','love-150-02','love-150-03','love-150-04','love-150-05','love-150-06','love-150-07','love-150-08','love-150-09','love-150-10'], names: ['Love Journey','Our Story','Memory Lane','Love in Paris','Heartbeat','Starry Night','Garden Love','Dancing Love','Ocean Love','Romantic Ride'] },
    { tier: 300, price: 300000, ids: ['love-300-01','love-300-02','love-300-03','love-300-04','love-300-05'], names: ['Love Galaxy','Eternal Love','Floating Hearts','Love Castle','Golden Memories'] },
    { tier: 500, price: 500000, ids: ['love-500-01','love-500-02'], names: ['Love Fantasy','Love Universe'] }
  ];

  const names = [
    { id: 'name1', label: 'Tên người thứ nhất', type: 'text', required: true, placeholder: 'Ví dụ: Minh', section: 'Danh tính' },
    { id: 'name2', label: 'Tên người thứ hai', type: 'text', required: true, placeholder: 'Ví dụ: Ngọc', section: 'Danh tính' }
  ];
  const message = { id: 'message', label: 'Điều bạn muốn nhắn ở phần mở đầu', type: 'textarea', placeholder: 'Viết một lời nhắn ngắn dành cho người ấy.', section: 'Nội dung' };
  const letter = { id: 'letter', label: 'Lá thư dành cho người ấy', type: 'textarea', placeholder: 'Viết những điều bạn muốn giữ lại.', section: 'Nội dung' };
  const date = { id: 'startDate', label: 'Ngày bắt đầu câu chuyện', type: 'date', section: 'Ngày tháng' };
  const gallery = { id: 'album', label: 'Những bức ảnh muốn lưu giữ', type: 'image-list', accept: 'image/*', multiple: true, section: 'Hình ảnh' };
  const memories = { id: 'timeline', label: 'Những kỷ niệm muốn lưu lại', type: 'timeline', section: 'Kỷ niệm' };
  const finalMessage = { id: 'finalMessage', label: 'Lời nhắn cuối trang', type: 'textarea', placeholder: 'Một câu dịu dàng để khép lại câu chuyện.', section: 'Đoạn kết' };
  const avatars = [
    { id: 'photo1', label: 'Ảnh đại diện người thứ nhất', type: 'image', accept: 'image/*', section: 'Hình ảnh' },
    { id: 'photo2', label: 'Ảnh đại diện người thứ hai', type: 'image', accept: 'image/*', section: 'Hình ảnh' }
  ];
  const legacyFields = [...names, ...avatars, message, letter, date, gallery, finalMessage];
  const music = { id: 'music', label: 'Bài nhạc của hai bạn', type: 'music', accept: 'audio/*', section: 'Âm thanh' };

  const contract = (fields) => fields.map((field) => ({ ...field }));
  const templateContracts = {
    'love-50-01': contract([...names, ...avatars, message, letter, date, gallery, memories, music, finalMessage]),
    'love-50-02': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-03': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-04': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-05': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-06': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-07': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-08': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-09': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-10': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-11': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-12': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-13': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-14': contract([...names, message, letter, date, gallery, memories, finalMessage]),
    'love-50-15': contract([...names, message, letter, date, gallery, memories, finalMessage])
  };
  templateContracts['love-50-13'].find((field) => field.id === 'timeline').maxItems = 10;
  templateContracts['love-50-15'].find((field) => field.id === 'timeline').maxItems = 8;

  const vietnameseNames = ['Bầu trời riêng', 'Lá thư riêng', 'Những khung hình', 'Thế giới bé xinh', 'Khoảng lặng dịu dàng', 'Nhật ký của đôi mình', 'Tin nhắn yêu thương', 'Bức tường kỷ niệm', 'Thước phim của chúng ta', 'Hoàng hôn đôi mình', 'Dòng chữ dành cho em', 'Lịch của chúng mình', 'Kỷ niệm bay lên', 'Bức thư bí mật', 'Vũ trụ của hai ta'];
  const descriptions = ['Chòm sao riêng nối những khoảnh khắc của hai bạn.', 'Một lá thư mở ra câu chuyện dịu dàng của hai người.', 'Những khung hình nhỏ ghép thành một câu chuyện lớn.', 'Một thế giới bé xinh dành riêng cho tình yêu của hai bạn.', 'Khoảng lặng tối giản để những lời thật lòng lên tiếng.', 'Cuốn nhật ký lưu lại từng trang ký ức của hai người.', 'Giao diện tin nhắn cho những điều muốn nói mỗi ngày.', 'Một bức tường để ghim lại những khoảnh khắc đáng nhớ.', 'Câu chuyện tình yêu kể bằng những thước phim riêng.', 'Màu nắng cuối ngày giữ lại sự ấm áp của hai bạn.', 'Một bức thư hiện ra từng dòng như đang được viết.', 'Những ngày quan trọng được đánh dấu trong lịch riêng.', 'Những kỷ niệm nhẹ nhàng bay lên trong bầu trời của hai bạn.', 'Một kho lưu trữ bí mật dành cho lời nhắn đặc biệt.', 'Một vũ trụ nhỏ nơi những ký ức cùng quay quanh nhau.'];

  const templates = tiers.flatMap((tier) => tier.ids.map((id, index) => ({
    id,
    name: tier.tier === 50 ? vietnameseNames[index] : tier.names[index],
    tier: tier.tier,
    price: tier.price,
    category: 'love',
    categoryLabel: 'Tình yêu',
    description: tier.tier === 50 ? descriptions[index] : `${tier.names[index]} - không gian lưu giữ câu chuyện của hai người.`,
    features: ['Câu chuyện riêng', 'Hình ảnh', 'Kỷ niệm', 'Lời nhắn cuối'],
    thumbnail: tier.tier === 50 ? `/templates/love-50/${id}/thumbnail.png` : 'love',
    thumbnailStatus: tier.tier === 50 ? 'ready' : 'legacy',
    badge: tier.tier === 50 && index === 0 ? 'Nổi bật' : '',
    preview: `/templates/${tier.tier === 50 ? 'love-50' : `love-${tier.tier}`}/${id}/index.html`,
    path: `/templates/${tier.tier === 50 ? 'love-50' : `love-${tier.tier}`}/${id}/`,
    status: 'published',
    enabled: true,
    fields: tier.tier === 50 ? templateContracts[id] : legacyFields.map((field) => ({ ...field }))
  })));

  window.LuuButTemplateRegistry = Object.freeze(templates);
})();
