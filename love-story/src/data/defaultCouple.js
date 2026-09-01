/**
 * ════════════════════════════════════════════════════════════════
 *  💘  DEFAULT COUPLE — DEMO "Minh ❤️ Ngọc" (bản mẫu mặc định)
 * ════════════════════════════════════════════════════════════════
 *
 *  Đây là dữ liệu DEMO của template "Sweet Love" (150.000đ):
 *    · /  và  /demo   → hiển thị website này nguyên vẹn (quay TikTok)
 *    · /create        → khách nhập thông tin mới, preview thay đổi realtime
 *
 *  Template UI KHÔNG bao giờ hard-code dữ liệu — mọi chữ hiển thị
 *  đều lấy từ object này (hoặc từ coupleData khách hàng tạo ở /create).
 */

const defaultCouple = {
  /** Slug URL của demo: /demo hoặc /minh-ngoc */
  slug: "minh-ngoc",

  /** Template đang dùng — tra trong src/templates/index.js */
  templateId: "sweet-love",

  /** Tên bạn nam (bên trái trái tim) */
  name1: "Minh",
  /** Tên bạn nữ (bên phải trái tim) */
  name2: "Ngọc",

  /** Ngày bắt đầu yêu — định dạng "YYYY-MM-DD" */
  startDate: "2025-02-14",

  /** Dòng chữ nhỏ dưới tên ở màn hình đầu */
  heroSubtitle: "365 ngày bên nhau",

  /** Dòng giới thiệu ngắn khi chia sẻ link (Zalo, Messenger…) */
  message: "Cảm ơn em đã xuất hiện trong cuộc đời anh ❤️",

  /** Ảnh bìa (dùng làm ảnh đại diện khi chia sẻ link) — demo để trống */
  coverImage: "",

  /** Nhạc nền — file demo: love.wav. Khi làm bản cho khách:
   *  copy bài hát vào public/music/ (vd love.mp3) rồi sửa đường dẫn này. */
  musicUrl: "/music/love.wav",

  /**
   * ẢNH GALLERY (10–20 ảnh)
   * Copy ảnh vào public/photos/ rồi thêm đường dẫn vào đây.
   */
  photos: [
    "/photos/1.svg",
    "/photos/2.svg",
    "/photos/3.svg",
    "/photos/4.svg",
    "/photos/5.svg",
    "/photos/6.svg",
    "/photos/7.svg",
    "/photos/8.svg",
    "/photos/9.svg",
    "/photos/10.svg",
    "/photos/11.svg",
    "/photos/12.svg",
  ],

  /**
   * TIMELINE "Chuyện của chúng mình" — thêm/bớt sự kiện tuỳ ý.
   * date: hiển thị nguyên văn (định dạng tự do: "14.02.2025", "Tháng 3, 2025"…)
   */
  timeline: [
    {
      date: "14.02.2025",
      title: "Ngày chúng mình bắt đầu",
      description:
        "Ngày lễ tình nhân, khi một lời tỏ tình nhút nhát được đáp lại bằng một nụ cười. Mọi thứ bắt đầu từ đây.",
      image: "/photos/1.svg",
    },
    {
      date: "28.03.2025",
      title: "Lần đầu cùng nhau đi chơi",
      description:
        "Bàn tay đương nhiên nắm lấy bàn tay này. Cả thành phố như chậm lại để chúng mình bước cùng nhau.",
      image: "/photos/3.svg",
    },
    {
      date: "15.06.2025",
      title: "Chuyến đi đáng nhớ",
      description:
        "Một chuyến đi, trăm tấm ảnh, và ngàn tiếng cười. Ngày ấy nhận ra: chỉ cần ở cạnh nhau, đi đâu cũng là kỳ diệu.",
      image: "/photos/6.svg",
    },
    {
      date: "02.10.2025",
      title: "Cơn mưa đầu mùa",
      description:
        "Chỉ có một chiếc ô, nên cả hai cùng ướt nửa vai — và cùng cười suốt con đường về.",
      image: "/photos/9.svg",
    },
    {
      date: "14.02.2026",
      title: "Kỷ niệm 1 năm",
      description:
        "365 ngày yêu thương, đúng như lời hứa ngày đầu. Và đây mới chỉ là khởi đầu của câu chuyện dài phía trước.",
      image: "/photos/12.svg",
    },
  ],

  /**
   * MEMORY CARDS "Những điều anh yêu ở em" (4–6 thẻ).
   * icon: tên icon lucide-react ("smile", "heart", "star", "sun", "flower", "moon"…)
   */
  memories: [
    {
      title: "Nụ cười của em",
      description: "Điều anh thích nhất mỗi khi nhìn thấy em.",
      icon: "smile",
    },
    {
      title: "Cách em quan tâm anh",
      description: "Những tin nhắn dặn dò nhỏ nhặt nhưng ấm áp khủng khiếp.",
      icon: "heart",
    },
    {
      title: "Những lúc em giận",
      description: "Giận dỗi xong lại cười, để rồi anh thương còn hơn trước.",
      icon: "sparkles",
    },
    {
      title: "Những lần mình cùng đi chơi",
      description: "Đi đâu cũng được, miễn là có em ngồi cạnh.",
      icon: "sun",
    },
    {
      title: "Giọng nói khi em gọi anh",
      description: "Chỉ hai tiếng 'anh ơi' mà cả ngày anh thấy nhẹ tênh.",
      icon: "flower",
    },
    {
      title: "Bàn tay nhỏ của em",
      description: "Nhỏ thôi mà, cầm chặt cả thế giới của anh vào trong.",
      icon: "star",
    },
  ],

  /** THƯ TÌNH 💌 */
  loveLetter: {
    title: "Anh có vài điều muốn nói...",
    button: "Mở thư 💗",
    /** \n để xuống dòng. Có thể chứa emoji. */
    content:
      "Em à,\n\nCảm ơn em vì đã xuất hiện trong cuộc đời anh.\n\nCảm ơn những ngày vui, những lần giận dỗi,\nvà cả những khoảnh khắc rất bình thường\nnhưng khi ở bên em lại trở nên đặc biệt.\n\nAnh không biết tương lai sẽ như thế nào,\nnhưng anh hy vọng trong những ngày tháng\nsắp tới vẫn có em ở bên cạnh.\n\nYêu em ❤️",
    signature: "Người yêu em,",
    signatureName: "Minh",
  },

  /** PHẦN BẤT NGỜ CUỐI */
  final: {
    intro: "Và còn một điều nữa...",
    reveal: "Anh yêu em ❤️",
    button: "Nhấn vào đây ❤️",
    modalTitle: "Anh chỉ muốn nói rằng...",
    modalMessage: "Anh yêu em rất nhiều ❤️",
  },

  /** CARD QR CODE cuối trang */
  qr: {
    title: "Muốn lưu lại kỷ niệm này? ❤️",
    subtitle: "Tạo mã QR để gửi đến người thương nhé",
    button: "Tạo QR",
    download: "Tải QR",
  },
};

export default defaultCouple;