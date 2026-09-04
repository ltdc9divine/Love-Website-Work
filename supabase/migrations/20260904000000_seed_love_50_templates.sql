insert into public.templates (slug, name, price, tier, category, thumbnail_url, description, active)
values
  ('love-50-01', 'Bầu trời riêng', 50000, 'starter', 'love', '/templates/love-50/love-50-01/thumbnail.png', 'Chòm sao riêng nối những khoảnh khắc của hai bạn.', true),
  ('love-50-02', 'Lá thư riêng', 50000, 'starter', 'love', '/templates/love-50/love-50-02/thumbnail.png', 'Một lá thư mở ra câu chuyện dịu dàng của hai người.', true),
  ('love-50-03', 'Những khung hình', 50000, 'starter', 'love', '/templates/love-50/love-50-03/thumbnail.png', 'Những khung hình nhỏ ghép thành một câu chuyện lớn.', true),
  ('love-50-04', 'Thế giới bé xinh', 50000, 'starter', 'love', '/templates/love-50/love-50-04/thumbnail.png', 'Một thế giới bé xinh dành riêng cho tình yêu của hai bạn.', true),
  ('love-50-05', 'Khoảng lặng dịu dàng', 50000, 'starter', 'love', '/templates/love-50/love-50-05/thumbnail.png', 'Khoảng lặng tối giản để những lời thật lòng lên tiếng.', true),
  ('love-50-06', 'Nhật ký của đôi mình', 50000, 'starter', 'love', '/templates/love-50/love-50-06/thumbnail.png', 'Cuốn nhật ký lưu lại từng trang ký ức của hai người.', true),
  ('love-50-07', 'Tin nhắn yêu thương', 50000, 'starter', 'love', '/templates/love-50/love-50-07/thumbnail.png', 'Giao diện tin nhắn cho những điều muốn nói mỗi ngày.', true),
  ('love-50-08', 'Bức tường kỷ niệm', 50000, 'starter', 'love', '/templates/love-50/love-50-08/thumbnail.png', 'Một bức tường để ghim lại những khoảnh khắc đáng nhớ.', true),
  ('love-50-09', 'Thước phim của chúng ta', 50000, 'starter', 'love', '/templates/love-50/love-50-09/thumbnail.png', 'Câu chuyện tình yêu kể bằng những thước phim riêng.', true),
  ('love-50-10', 'Hoàng hôn đôi mình', 50000, 'starter', 'love', '/templates/love-50/love-50-10/thumbnail.png', 'Màu nắng cuối ngày giữ lại sự ấm áp của hai bạn.', true),
  ('love-50-11', 'Dòng chữ dành cho em', 50000, 'starter', 'love', '/templates/love-50/love-50-11/thumbnail.png', 'Một bức thư hiện ra từng dòng như đang được viết.', true),
  ('love-50-12', 'Lịch của chúng mình', 50000, 'starter', 'love', '/templates/love-50/love-50-12/thumbnail.png', 'Những ngày quan trọng được đánh dấu trong lịch riêng.', true),
  ('love-50-13', 'Kỷ niệm bay lên', 50000, 'starter', 'love', '/templates/love-50/love-50-13/thumbnail.png', 'Những kỷ niệm nhẹ nhàng bay lên trong bầu trời của hai bạn.', true),
  ('love-50-14', 'Bức thư bí mật', 50000, 'starter', 'love', '/templates/love-50/love-50-14/thumbnail.png', 'Một kho lưu trữ bí mật dành cho lời nhắn đặc biệt.', true),
  ('love-50-15', 'Vũ trụ của hai ta', 50000, 'starter', 'love', '/templates/love-50/love-50-15/thumbnail.png', 'Một vũ trụ nhỏ nơi những ký ức cùng quay quanh nhau.', true)
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  tier = excluded.tier,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  description = excluded.description,
  active = excluded.active;
