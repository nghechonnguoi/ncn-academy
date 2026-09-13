/**
 * Generate PDF: Nguyễn Thành Vinh — NCN-2159
 * FIX: Sửa ngày sinh từ 07/05/2025 → 07/05/2015, Life Path từ 3 → 2
 * 
 * Profile: INFP | Holland: ESA
 * LP:2 Soul:9 Mission:1 Talent:7 Passion:5
 * Top 5: Nhà báo/Truyền thông · Marketing/KD · Nhà đào tạo · Nghệ sĩ/Thiết kế · Lập trình viên
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join('D:\\NCN-Academy\\apps\\web\\public', 'bao-cao-pdf-template.html');
const OUTPUT_PATH   = 'D:\\NCN-Academy\\BaoCao_NguyenThanhVinh_NCN2159_Fixed.pdf';
const CHROME_PATH   = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── Dữ liệu hồ sơ Nguyễn Thành Vinh (đã sửa ngày sinh + LP) ─────────────────
const data = {
  HOTEN:         "Nguyễn Thành Vinh",
  EMAIL:         "kakaxebuyt@gmail.com",
  DIEN_THOAI:    "0947374563",
  NGAY_SINH:     "07/05/2015",   // ✅ SỬA: từ 2025 → 2015
  MA_SO_HO_SO:   "NCN-2159",
  NGAY_XUAT_BAN: "10/8/2026",

  // Holland RIASEC scores (ESA)
  R_PCT: 10,
  I_PCT: 20,
  A_PCT: 80,
  S_PCT: 90,
  E_PCT: 100,
  C_PCT: 15,

  MBTI:     "INFP",
  LIFEPATH: 2,    // ✅ SỬA: từ 3 → 2 (theo năm sinh 2015)
  SOUL:     9,
  MISSION:  1,
  TALENT:   7,
  PASSION:  5,
  HOLLAND:  "ESA",

  // Top 5 nghề
  TOP1_TITLE:      "Nhà báo / Người làm truyền thông (quản lý quan hệ công chúng (PR) cho thương hiệu, xây dựng & điều hành kênh mạng xã hội doanh nghiệp, tổ chức sự kiện truyền thông & press tour)",
  TOP1_NICHE:      "Nhà sáng tạo Nội dung Số & Chiến lược gia Kênh Đa nền tảng",
  TOP1_REF:        "Truyền thông đa phương tiện",
  TOP1_FIELD:      "Đa ngành",
  TOP1_ICI:        98.11,
  TOP1_ICI_DETAIL: "Id:92 · Ni:100 · Mk:86.1",
  TOP1_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",

  TOP2_TITLE:      "Chuyên gia Marketing / Kinh doanh (bán hàng & phát triển khách hàng B2B, đàm phán & ký kết hợp đồng thương mại, xây dựng mạng lưới đối tác chiến lược)",
  TOP2_NICHE:      "CEO Startup & Nhà sáng lập Khởi nghiệp",
  TOP2_REF:        "Quản trị & Marketing",
  TOP2_FIELD:      "Đa ngành",
  TOP2_ICI:        95.73,
  TOP2_ICI_DETAIL: "Id:87 · Ni:100 · Mk:96.9",
  TOP2_SUBJECTS:   "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)",

  TOP3_TITLE:      "Nhà đào tạo / Facilitator Doanh nghiệp (đào tạo kỹ năng lãnh đạo & văn hóa doanh nghiệp, thiết kế workshop & chương trình phát triển nhân viên, hướng nghiệp và định vị nghề nghiệp cho người lớn)",
  TOP3_NICHE:      "Chuyên gia Chiến lược Định vị Nghề nghiệp & Thương hiệu Cá nhân",
  TOP3_REF:        "Giáo dục & Đào tạo",
  TOP3_FIELD:      "Đa ngành",
  TOP3_ICI:        93.73,
  TOP3_ICI_DETAIL: "Id:93 · Ni:100 · Mk:86.2",
  TOP3_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",

  TOP4_TITLE:      "Nghệ sĩ / Nhà Thiết kế (điều hành studio sáng tạo & agency thiết kế, kinh doanh tác phẩm nghệ thuật & IP sáng tạo, xây dựng thương hiệu nghệ sĩ & phân phối tác phẩm)",
  TOP4_NICHE:      "Đạo diễn Phim ngắn TVC & Branded Content",
  TOP4_REF:        "Nghệ thuật & Sáng tạo",
  TOP4_FIELD:      "Đa ngành",
  TOP4_ICI:        93.48,
  TOP4_ICI_DETAIL: "Id:84 · Ni:100 · Mk:87.2",
  TOP4_SUBJECTS:   "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)",

  TOP5_TITLE:      "Lập trình viên / Kỹ sư Phần mềm (dẫn dắt dự án công nghệ lớn, tư vấn chuyển đổi số doanh nghiệp, xây dựng startup công nghệ)",
  TOP5_NICHE:      "CTO & VP Engineering Lãnh đạo Công nghệ",
  TOP5_REF:        "Công nghệ Thông tin",
  TOP5_FIELD:      "Đa ngành",
  TOP5_ICI:        91.77,
  TOP5_ICI_DETAIL: "Id:88.5 · Ni:95 · Mk:99.5",
  TOP5_SUBJECTS:   "A00 / A01 (Toán - Lý - Hóa / Toán - Lý - Anh)",

  RISK_NOW: "Ngay hôm nay, Vinh nên viết ra 3 việc nhỏ có thể hoàn thành trong tuần này để rèn thói quen hành động thay vì chỉ nghĩ và mơ mộng.",
};

// ── Nội dung AI (trích từ báo cáo gốc) ───────────────────────────────────────
const aiTexts = {
  // Chương I — Bạn Là Ai?
  AI_PAGE3_P1: "Điểm sáng nhất ở Vinh là trái tim ấm áp và khả năng kết nối với mọi người xung quanh. Bạn luôn để ý đến cảm xúc của người khác, dễ đồng cảm và sẵn sàng giúp đỡ mà không cần ai nhắc. Chính sự chân thành này khiến bạn trở thành người mà ai cũng muốn tâm sự, muốn gần gũi và tin tưởng.",
  AI_PAGE3_P2: "Vinh vừa nhạy cảm, giàu tưởng tượng, vừa có năng lượng giao tiếp mạnh mẽ và thích đứng trước đám đông. Sự pha trộn này giúp bạn vừa hiểu người khác sâu sắc, vừa biết cách truyền cảm hứng và dẫn dắt họ một cách tự nhiên, không gượng ép.",
  AI_PAGE3_P3: "Vinh sẽ phát huy tốt nhất ở môi trường năng động, nhiều người, được tự do sáng tạo và không bị gò bó bởi khuôn khổ cứng nhắc. Những nơi đề cao tinh thần đội nhóm, coi trọng ý tưởng mới và cho phép bạn thể hiện cá tính riêng sẽ là bệ phóng lý tưởng.",

  AI_PAGE4_P1: "Khi đứng trước một vấn đề, Vinh không thích đi theo lối mòn mà luôn tìm cách nhìn nhận vấn đề theo góc độ mới mẻ, gắn liền với cảm xúc và giá trị con người. Bạn ít khi quyết định dựa trên lý trí lạnh lùng, mà thường lắng nghe trực giác và những gì bạn tin là đúng đắn, ý nghĩa.",
  AI_PAGE4_P2: "Vinh mang trong mình khả năng truyền cảm hứng và dẫn dắt người khác đi theo những điều tốt đẹp. Không chỉ dừng lại ở việc hoàn thành công việc, bạn có thể trở thành người mở đường, người tiên phong giúp cộng đồng xung quanh nhìn thấy hướng đi mới, sống tích cực hơn và tin vào những giá trị nhân văn. Đây là món quà quý mà không phải ai cũng có được.",
  AI_PAGE4_P3: "Khi áp lực dồn nén, Vinh dễ rơi vào trạng thái hoài nghi bản thân, thu mình lại và né tránh xung đột thay vì đối mặt trực tiếp. Bạn cũng có xu hướng ôm đồm cảm xúc của người khác, khiến mình kiệt sức mà không nhận ra, dẫn đến mất phương hướng trong những giai đoạn căng thẳng kéo dài.",
  AI_PAGE4_RECOVERY: "Hãy cho phép bản thân nghỉ ngơi, viết ra cảm xúc thật của mình và chia sẻ với người bạn tin tưởng thay vì giữ trong lòng một mình.",

  AI_PAGE5_P1: "Ẩn sâu bên trong Vinh là một nguồn năng lượng sáng tạo dồi dào, luôn thôi thúc bạn tìm tòi cái mới và thể hiện bản thân theo cách riêng. Bạn có khả năng nhìn ra vẻ đẹp trong những điều bình dị mà người khác dễ bỏ qua, biến chúng thành ý tưởng độc đáo, giàu màu sắc cá nhân. Khả năng này không chỉ nằm ở nghệ thuật mà còn thể hiện trong cách bạn giao tiếp, kể chuyện, thuyết phục người khác. Khi được nuôi dưỡng đúng cách, đây chính là vũ khí giúp Vinh tạo ra dấu ấn riêng, khác biệt hoàn toàn so với số đông, và khiến người khác phải nhớ đến bạn như một người đầy màu sắc, sáng tạo và chân thật.",
  AI_PAGE5_P2: "Vinh sinh ra với khả năng khơi nguồn cảm hứng và mang năng lượng tích cực lan tỏa đến những người xung quanh. Nếu kiên trì theo đuổi con đường mình tin tưởng, bạn hoàn toàn có thể trở thành người truyền lửa cho cả một cộng đồng, giúp nhiều người tìm lại niềm tin vào chính mình. Giá trị bạn để lại không nằm ở những gì hữu hình, mà ở những thay đổi tích cực trong tâm hồn người khác, những điều sẽ còn mãi theo thời gian.",
  AI_CLOSING_MESSAGE: "Vinh à, con đường phía trước có thể còn nhiều thử thách, nhưng đừng bao giờ nghi ngờ sức mạnh của sự chân thành và sáng tạo trong con người bạn. Hãy tin vào bản thân, dám thể hiện cá tính riêng và không ngừng học hỏi. Một ngày nào đó, chính bạn sẽ là nguồn cảm hứng cho rất nhiều người khác trên hành trình họ đi tìm chính mình.",

  // Chương III — Điểm yếu
  WEAKNESS_1_TITLE: "Suy nghĩ quá nhiều, làm quá ít",
  WEAKNESS_1_DESC:  "Vinh có xu hướng nghĩ rất sâu, tưởng tượng ra đủ kịch bản trước khi bắt tay vào làm, nên nhiều lúc ý tưởng hay bị bỏ dở giữa chừng. Cách vượt qua là đặt deadline ngắn cho từng bước nhỏ, chấp nhận làm chưa hoàn hảo rồi sửa dần thay vì chờ suy nghĩ chín muồi mới hành động.",
  WEAKNESS_2_TITLE: "Ngại đối đầu, dễ nhường nhịn quá mức",
  WEAKNESS_2_DESC:  "Vì coi trọng sự hòa hợp và cảm xúc người khác, Vinh dễ im lặng cho qua chuyện dù bản thân không thoải mái, lâu dần dồn nén mệt mỏi. Hãy tập nói ra quan điểm ngay lúc nó xuất hiện, bắt đầu bằng những việc nhỏ để quen dần với việc bảo vệ ý kiến của mình.",
  WEAKNESS_3_TITLE: "Dễ chán khi thiếu cảm hứng",
  WEAKNESS_3_DESC:  "Khi công việc trở nên lặp lại, thiếu ý nghĩa hay không truyền cảm hứng, Vinh dễ mất động lực và bỏ ngang dù đã đầu tư nhiều công sức. Nên chủ động tìm ý nghĩa mới trong việc đang làm hoặc chia nhỏ mục tiêu thành các cột mốc thú vị để duy trì lửa nhiệt tình lâu dài.",

  // Risk
  RISK_SHORT_TERM:  "Trong 6 tháng tới, hãy chủ động tham gia các hoạt động nhóm, câu lạc bộ truyền thông hoặc kinh doanh để luyện khả năng giao tiếp và thuyết phục người khác.",
  RISK_LONG_TERM:   "Từ 6–24 tháng, Vinh cần xây dựng kỷ luật cá nhân bằng cách theo đuổi ít nhất một dự án dài hơi đến khi hoàn thành, để chứng minh mình có thể kiên trì chứ không chỉ giỏi bắt đầu.",

  // Chương IV — Môi trường & Kỹ năng
  IDEAL_ENVIRONMENT: "Vinh sẽ phát huy tốt nhất trong môi trường năng động, đề cao sự sáng tạo và kết nối con người, nơi mọi người được tự do đưa ý tưởng, có không gian thể hiện cá tính và ít bị gò bó bởi quy trình cứng nhắc.",
  TOXIC_ENVIRONMENT: "Ngược lại, môi trường quá cứng nhắc, nhiều thủ tục, ít giao tiếp cảm xúc hoặc chỉ tập trung vào số liệu khô khan sẽ khiến Vinh nhanh chóng cảm thấy tù túng và mất động lực làm việc.",

  // Culture Fit Matrix
  MNC_FIT:      "55%",
  MNC_DESC:     "Vinh có thể thích nghi nếu công ty có văn hóa cởi mở, nhưng dễ cảm thấy gò bó bởi quy trình và cấp bậc quá rõ ràng của các tập đoàn lớn.",
  SOLO_FIT:     "80%",
  SOLO_DESC:    "Với khả năng sáng tạo và giao tiếp tốt, Vinh phù hợp để tự làm chủ, xây dựng thương hiệu cá nhân theo cách riêng của mình.",
  STARTUP_FIT:  "85%",
  STARTUP_DESC: "Môi trường khởi nghiệp năng động, ít khuôn khổ và đề cao ý tưởng mới rất hợp với tính cách thích tự do và sáng tạo của Vinh.",
  PUBLIC_FIT:   "30%",
  PUBLIC_DESC:  "Khối nhà nước với quy trình chặt chẽ, ít không gian sáng tạo sẽ khó giữ chân một người thích đổi mới và tự do như Vinh.",

  // 3 Trụ Cột Kỹ Năng
  PILLAR_1_TITLE: "Kỹ năng kể chuyện và truyền thông",
  PILLAR_1_DESC:  "Khả năng diễn đạt ý tưởng một cách cảm xúc, chân thật giúp Vinh kết nối với người khác dễ dàng, đây là nền tảng để xây dựng thương hiệu cá nhân và sự nghiệp tự do sau này.",
  PILLAR_2_TITLE: "Kỹ năng xây dựng mối quan hệ",
  PILLAR_2_DESC:  "Vinh có khả năng thấu hiểu và tạo thiện cảm với người khác, đây là chìa khóa để mở rộng mạng lưới hợp tác và tạo ra cơ hội kinh doanh trong tương lai.",
  PILLAR_3_TITLE: "Kỹ năng dẫn dắt và truyền cảm hứng",
  PILLAR_3_DESC:  "Khi được rèn luyện thêm sự tự tin và kiên trì, khả năng truyền cảm hứng tự nhiên của Vinh sẽ trở thành lợi thế lớn trong vai trò lãnh đạo hoặc đào tạo người khác.",

  // Nghề nên tránh
  AVOID_1_TITLE:  "Kế toán viên",
  AVOID_1_REASON: "Hình dung một ngày làm việc điển hình của kế toán viên: 8 giờ sáng ngồi vào bàn, mở Excel, đối chiếu từng dòng số liệu với hóa đơn, chứng từ. Buổi chiều tiếp tục nhập liệu, kiểm tra sai lệch, in báo cáo thuế. Không gian làm việc thường là phòng kín, ít người, ít tiếng động, nhịp độ đều đặn và lặp lại ngày này qua ngày khác. Không có nhiều cuộc trò chuyện, không có sự kiện mới, không có chỗ cho sự sáng tạo hay ứng biến. Vinh là người hoạt động tốt nhất khi được giao tiếp, tạo ảnh hưởng và làm việc với con người — đặt bạn vào môi trường tĩnh, một mình với con số suốt 8 tiếng mỗi ngày thì năng lượng sẽ cạn nhanh hơn bạn nghĩ, và chất lượng công việc cũng khó duy trì lâu dài. Đây không phải vấn đề năng lực, mà là bạn đang vận hành ngược hoàn toàn với cách bạn vốn mạnh nhất.",
  AVOID_1_ANGLE:  "Môi trường làm việc",
  AVOID_1_TIP:    "Nếu bạn muốn làm việc với dữ liệu theo cách thú vị hơn, hãy xem xét Business Analytics hoặc Marketing Data — phân tích dữ liệu phục vụ ra quyết định sáng tạo.",

  AVOID_2_TITLE:  "Lập trình viên Backend",
  AVOID_2_REASON: "Lập trình viên backend cần ít nhất 3 kỹ năng cốt lõi để tồn tại được trong nghề: tư duy logic hệ thống cực kỳ chi tiết, khả năng ngồi debug code một mình 6–8 tiếng liên tục mà không mất tập trung, và sự kiên nhẫn với việc đọc tài liệu kỹ thuật khô khan hàng giờ. Với Vinh, đây đều là những điểm phải gắng sức ngược bản năng. Bạn có tư duy tổng thể và thiên về kết nối ý tưởng hơn là phân tích từng dòng lệnh. Bạn lấy năng lượng từ con người và ý tưởng lớn, không phải từ việc truy tìm một lỗi logic ẩn trong 500 dòng code. Không phải bạn không học được kỹ thuật — mà là sau 2–3 năm làm thuần backend, bạn sẽ thấy mình đang làm việc bằng ý chí chứ không phải bằng sở trường, và khoảng cách với người thực sự yêu thích công việc đó sẽ ngày càng rõ.",
  AVOID_2_ANGLE:  "Kỹ năng cốt lõi",
  AVOID_2_TIP:    "Nếu bạn thích công nghệ, hãy xem xét vai trò Product Manager hoặc Tech Marketer — nơi bạn kết nối giữa con người và sản phẩm công nghệ.",

  AVOID_3_TITLE:  "Nhân viên kinh doanh bảo hiểm nhân thọ",
  AVOID_3_REASON: "Nghề kinh doanh bảo hiểm nhân thọ thưởng cho một thứ rất cụ thể: số hợp đồng ký được mỗi tháng. Hệ thống đánh giá hoàn toàn dựa trên doanh số — báo cáo KPI hàng tuần, xếp hạng nội bộ, áp lực chỉ tiêu tháng, quý. Người thành công lâu dài trong nghề này thường là người lấy động lực từ cạnh tranh, từ việc thuyết phục người khác mua sản phẩm, và từ con số hoa hồng tăng dần. Vinh thì khác — bạn có nhu cầu tạo ra tác động thực sự với người khác, không phải chỉ chốt đơn. Khi bị đặt vào môi trường mà thành công được đo bằng tỷ lệ chuyển đổi khách hàng và bạn phải gọi cold-call 30–50 người mỗi ngày, bạn sẽ không thấy ý nghĩa trong công việc — và thiếu ý nghĩa là thứ khiến bạn mất phương hướng nhanh nhất, không phải áp lực hay khối lượng công việc.",
  AVOID_3_ANGLE:  "Giá trị & Động lực",
  AVOID_3_TIP:    "Nếu bạn quan tâm đến lĩnh vực tài chính, hãy xem xét vai trò tư vấn tài chính cá nhân tập trung vào giáo dục tài chính — nơi bạn thực sự giúp đỡ người khác chứ không chỉ chốt đơn.",

  // ── Chương II: Phân tích chi tiết 5 nghề ─────────────────────────────────────
  CAREER_1_SCIENCE: "Vinh là người nhạy cảm với cảm xúc người khác, thích diễn đạt suy nghĩ qua ngôn từ và hình ảnh. Khả năng kết nối với mọi người rất tự nhiên, cộng thêm sự sáng tạo trong cách nhìn nhận vấn đề giúp Vinh dễ dàng tạo ra những nội dung chạm đến trái tim người đọc, người xem. Đây chính là nền tảng phù hợp để làm truyền thông.",
  CAREER_1_TREND:   "Ngành truyền thông tại Việt Nam đang chuyển mình mạnh với sự bùng nổ của mạng xã hội và nội dung số. Doanh nghiệp ngày càng cần người biết kể chuyện thương hiệu chân thực. Trong 5–10 năm tới, cơ hội việc làm sẽ mở rộng sang các lĩnh vực livestream, podcast, truyền thông đa nền tảng, đặc biệt cho người trẻ có tư duy sáng tạo.",
  CAREER_1_SKILLS:  "Để thành công, Vinh cần rèn khả năng viết sao cho vừa chân thật vừa cuốn hút, học cách dùng hình ảnh và video kể chuyện, đồng thời trau dồi kỹ năng lắng nghe để hiểu được điều khán giả thực sự quan tâm. Ngoài ra, sự linh hoạt thích nghi với xu hướng mới cũng rất quan trọng.",

  CAREER_2_SCIENCE: "Vinh có khả năng hiểu và đồng cảm với người khác một cách tự nhiên, điều này giúp việc thuyết phục khách hàng trở nên dễ dàng hơn vì xuất phát từ sự chân thành chứ không phải ép buộc. Kết hợp với tư duy linh hoạt và óc sáng tạo, Vinh có thể tìm ra những cách tiếp cận khách hàng mới lạ, hiệu quả.",
  CAREER_2_TREND:   "Kinh doanh và marketing luôn là ngành cần thiết cho mọi doanh nghiệp, đặc biệt khi thị trường Việt Nam hội nhập sâu với thế giới. Xu hướng bán hàng qua nền tảng số, marketing cá nhân hóa đang phát triển mạnh. Người trẻ có kỹ năng giao tiếp tốt và tư duy chiến lược sẽ có nhiều cơ hội thăng tiến trong 5–10 năm tới.",
  CAREER_2_SKILLS:  "Vinh nên tập trung phát triển kỹ năng giao tiếp sao cho tự nhiên và thuyết phục, học cách lắng nghe để hiểu đúng nhu cầu khách hàng, đồng thời rèn luyện sự kiên nhẫn khi đàm phán. Khả năng xây dựng mối quan hệ lâu dài cũng là yếu tố quyết định thành công trong lĩnh vực này.",

  CAREER_3_SCIENCE: "Vinh có xu hướng quan tâm sâu sắc đến sự phát triển của người khác, kết hợp khả năng thấu hiểu cảm xúc và tư duy dẫn dắt tự nhiên. Đây là những yếu tố cốt lõi giúp Vinh trở thành người truyền đạt kiến thức hiệu quả, biết cách khơi gợi động lực và tạo ra thay đổi tích cực trong tư duy người khác.",
  CAREER_3_TREND:   "Nhu cầu đào tạo kỹ năng mềm và phát triển con người trong doanh nghiệp đang tăng mạnh tại Việt Nam. Xu hướng học tập suốt đời và chuyển đổi nghề nghiệp khiến vai trò facilitator, coach ngày càng quan trọng. Đây là lĩnh vực có tiềm năng phát triển lớn trong 5–10 năm tới, đặc biệt với người có khả năng kết nối và truyền cảm hứng.",
  CAREER_3_SKILLS:  "Vinh cần rèn kỹ năng truyền đạt sao cho vừa dễ hiểu vừa truyền cảm hứng, học cách thiết kế nội dung đào tạo phù hợp với từng đối tượng, và phát triển khả năng lắng nghe thấu cảm để hiểu đúng khó khăn của người học. Sự kiên nhẫn và linh hoạt trong cách tiếp cận cũng rất cần thiết.",

  CAREER_4_SCIENCE: "Công việc này cần người có cảm xúc phong phú và óc quan sát tinh tế, điều Vinh có sẵn nhờ tâm hồn nhạy cảm và khả năng nhìn sâu vào ý nghĩa cuộc sống. Vinh dễ đồng cảm với cái đẹp và muốn tạo ra thứ có giá trị lâu dài, đây là nền tảng vững cho công việc sáng tạo nghệ thuật.",
  CAREER_4_TREND:   "Ngành sáng tạo đang chuyển mình mạnh với công nghệ số, NFT, AI hỗ trợ thiết kế và nội dung đa nền tảng. Người vừa có gu nghệ thuật vừa biết dùng công cụ số hóa sẽ có lợi thế lớn. Xu hướng cá nhân hóa thương hiệu qua nghệ sĩ độc lập cũng đang tăng mạnh trong 5–10 năm tới.",
  CAREER_4_SKILLS:  "Vinh cần trau dồi thêm kỹ năng kỷ luật để hoàn thành sản phẩm đúng hạn, vì đam mê sáng tạo đôi khi cần đi cùng tính kiên trì. Học thêm cách quản lý tài chính cá nhân và đàm phán giá trị tác phẩm cũng sẽ giúp Vinh sống được với nghề lâu dài.",

  CAREER_5_SCIENCE: "Công việc này đòi hỏi tư duy logic kết hợp khả năng sáng tạo để tìm giải pháp mới, điều mà Vinh có nhờ tâm hồn thích khám phá ý nghĩa sâu xa. Sự tò mò tự nhiên và khả năng suy nghĩ độc lập giúp Vinh dễ tiếp cận các bài toán công nghệ phức tạp một cách sáng tạo.",
  CAREER_5_TREND:   "Ngành công nghệ tiếp tục bùng nổ với AI, dữ liệu lớn và chuyển đổi số trong mọi lĩnh vực. Nhu cầu lập trình viên có tư duy sáng tạo, không chỉ biết code mà còn hiểu vấn đề thực tế, đang tăng cao. Đây là ngành có cơ hội việc làm ổn định và mức thu nhập tốt trong dài hạn.",
  CAREER_5_SKILLS:  "Vinh nên rèn thêm tính kiên trì khi gặp lỗi code khó và học cách làm việc có kỷ luật hơn, vì lập trình cần sự tập trung lâu dài. Ngoài ra, việc luyện thêm kỹ năng giao tiếp sẽ giúp Vinh trình bày ý tưởng công nghệ dễ hiểu hơn với người không chuyên.",

  // TOP 1-5 prep grid — kiến thức, kỹ năng, lộ trình, việc làm, lời khuyên
  TOP1_KIENTHUC: '<li>Kiến thức truyền thông đa phương tiện</li><li>Nguyên lý xây dựng thương hiệu</li><li>Tâm lý học đám đông</li><li>Kỹ thuật viết nội dung</li><li>Kiến thức về mạng xã hội</li>',
  TOP1_KYNANG:   '<li>Viết nội dung hấp dẫn</li><li>Kể chuyện truyền cảm</li><li>Giao tiếp trước đám đông</li><li>Chụp ảnh và dựng video</li><li>Quản lý khủng hoảng truyền thông</li><li>Xây dựng mối quan hệ</li>',
  TOP1_LOTRINH:  '<li>Học các khóa ngắn hạn về viết lách và làm nội dung từ cấp 3</li><li>Thi vào ngành Báo chí, Truyền thông hoặc Quan hệ công chúng ở đại học</li><li>Thực tập tại các tòa soạn, agency truyền thông trong quá trình học</li><li>Xây dựng portfolio cá nhân qua các dự án nhỏ, kênh mạng xã hội riêng</li>',
  TOP1_VIECLEM:  '<li>Chuyên viên PR</li><li>Quản lý mạng xã hội</li><li>Biên tập viên nội dung</li><li>Nhân viên tổ chức sự kiện</li><li>Content Creator</li>',
  TOP1_ADVICE:   'Vinh à, cứ mạnh dạn kể câu chuyện của riêng mình, vì thế giới đang cần những người biết truyền cảm hứng thật lòng như bạn.',

  TOP2_KIENTHUC: '<li>Kiến thức về thị trường</li><li>Nguyên tắc đàm phán</li><li>Tâm lý khách hàng</li><li>Kỹ năng bán hàng cơ bản</li>',
  TOP2_KYNANG:   '<li>Giao tiếp thuyết phục</li><li>Xây dựng mối quan hệ</li><li>Đàm phán linh hoạt</li><li>Lắng nghe nhu cầu</li><li>Quản lý thời gian</li><li>Giải quyết vấn đề nhanh</li>',
  TOP2_LOTRINH:  '<li>Tham gia các khóa học ngắn về bán hàng và giao tiếp từ sớm</li><li>Học ngành Marketing, Quản trị kinh doanh tại đại học hoặc cao đẳng</li><li>Đi làm thêm vị trí bán hàng, chăm sóc khách hàng để tích lũy kinh nghiệm thực tế</li><li>Phát triển lên vị trí quản lý kinh doanh sau vài năm cọ xát</li>',
  TOP2_VIECLEM:  '<li>Nhân viên kinh doanh</li><li>Chuyên viên Marketing</li><li>Quản lý khách hàng</li><li>Chuyên viên phát triển đối tác</li><li>Trưởng nhóm bán hàng</li>',
  TOP2_ADVICE:   'Sự chân thành trong cách Vinh kết nối với người khác chính là vũ khí mạnh nhất trong kinh doanh, đừng ngại thử sức từ những điều nhỏ nhất.',

  TOP3_KIENTHUC: '<li>Kiến thức tâm lý học</li><li>Phương pháp giảng dạy</li><li>Kỹ thuật thiết kế bài học</li><li>Hiểu biết về phát triển con người</li>',
  TOP3_KYNANG:   '<li>Truyền đạt dễ hiểu</li><li>Tạo động lực cho người khác</li><li>Lắng nghe thấu cảm</li><li>Thiết kế chương trình đào tạo</li><li>Điều phối nhóm</li><li>Giao tiếp linh hoạt</li>',
  TOP3_LOTRINH:  '<li>Bắt đầu bằng việc tham gia câu lạc bộ, hoạt động thuyết trình từ THPT</li><li>Học ngành Tâm lý học, Sư phạm hoặc Quản trị nhân sự tại đại học</li><li>Tích lũy kinh nghiệm qua các khóa đào tạo kỹ năng mềm, làm trợ giảng</li><li>Phát triển chuyên môn sâu về đào tạo doanh nghiệp sau khi ra trường</li>',
  TOP3_VIECLEM:  '<li>Chuyên viên đào tạo</li><li>Facilitator workshop</li><li>Cố vấn hướng nghiệp</li><li>Chuyên gia phát triển nhân sự</li><li>Giảng viên kỹ năng mềm</li>',
  TOP3_ADVICE:   'Vinh có khả năng truyền cảm hứng cho người khác một cách tự nhiên, hãy tin vào điều đó và bắt đầu chia sẻ từ những điều nhỏ nhất xung quanh mình.',

  TOP4_KIENTHUC: '<li>Nguyên lý thiết kế: màu sắc, bố cục, typography</li><li>Lịch sử nghệ thuật và các trường phái sáng tạo</li><li>Kiến thức về thương hiệu và cách xây dựng hình ảnh</li><li>Kiến thức cơ bản về thị trường nghệ thuật và bản quyền tác phẩm</li>',
  TOP4_KYNANG:   '<li>Kỹ năng vẽ tay và phác thảo ý tưởng</li><li>Kỹ năng sử dụng phần mềm thiết kế chuyên nghiệp</li><li>Kỹ năng kể chuyện bằng hình ảnh</li><li>Kỹ năng quản lý dự án sáng tạo</li><li>Kỹ năng giao tiếp để trình bày ý tưởng</li><li>Kỹ năng xây dựng thương hiệu cá nhân trên mạng xã hội</li>',
  TOP4_LOTRINH:  '<li>Học vẽ cơ bản và tìm hiểu các phần mềm thiết kế từ cấp 3</li><li>Theo học ngành Thiết kế đồ họa, Mỹ thuật ứng dụng hoặc tự học qua khóa online</li><li>Làm freelance hoặc thực tập tại studio để tích lũy portfolio</li><li>Xây dựng thương hiệu cá nhân và mở rộng mạng lưới khách hàng</li>',
  TOP4_VIECLEM:  '<li>Nhà thiết kế đồ họa</li><li>Giám đốc sáng tạo tại agency</li><li>Chủ studio thiết kế riêng</li><li>Nghệ sĩ minh họa tự do</li><li>Nhà thiết kế thương hiệu cho startup</li>',
  TOP4_ADVICE:   'Vinh có gu thẩm mỹ tốt và tâm hồn nhạy cảm, hãy cứ vẽ, cứ thử, đừng sợ tác phẩm chưa hoàn hảo vì mỗi bức vẽ đều là một bước tiến.',

  TOP5_KIENTHUC: '<li>Kiến thức nền về toán học và logic lập trình</li><li>Ngôn ngữ lập trình phổ biến như Python, Java, JavaScript</li><li>Kiến thức về cấu trúc dữ liệu và giải thuật</li><li>Hiểu biết về cơ sở dữ liệu và hệ thống mạng</li>',
  TOP5_KYNANG:   '<li>Kỹ năng viết code sạch và tối ưu</li><li>Kỹ năng giải quyết vấn đề logic</li><li>Kỹ năng làm việc nhóm trong dự án phần mềm</li><li>Kỹ năng tự học công nghệ mới liên tục</li><li>Kỹ năng giao tiếp để hiểu yêu cầu khách hàng</li><li>Kỹ năng quản lý thời gian và ưu tiên công việc</li>',
  TOP5_LOTRINH:  '<li>Học lập trình cơ bản từ THPT qua các khóa online hoặc câu lạc bộ tin học</li><li>Theo học ngành Công nghệ thông tin, Khoa học máy tính tại đại học</li><li>Thực tập tại công ty công nghệ để làm quen môi trường thực tế</li><li>Xây dựng portfolio dự án cá nhân và tham gia các cuộc thi công nghệ</li>',
  TOP5_VIECLEM:  '<li>Kỹ sư phần mềm</li><li>Lập trình viên ứng dụng di động</li><li>Chuyên viên tư vấn chuyển đổi số</li><li>Trưởng nhóm dự án công nghệ</li><li>Nhà sáng lập startup công nghệ</li>',
  TOP5_ADVICE:   'Nếu Vinh thích tạo ra thứ hữu ích và muốn hiểu sâu vấn đề, lập trình có thể là nơi tính kiên trì và óc sáng tạo của Vinh phát huy tốt.',
};

// ── Merge data ─────────────────────────────────────────────────────────────────
const fullData = { ...data, ...aiTexts };

async function generatePDF() {
  console.log('📄 Đang đọc template...');
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Replace {{PLACEHOLDER}} với giá trị thực
  html = html.replace(/{{(.*?)}}/g, (match, p1) => {
    const key = p1.trim();
    if (fullData[key] !== undefined) {
      return String(fullData[key]).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    }
    return '';
  });

  console.log('🌐 Đang khởi động Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('🖨️  Đang render PDF...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:8pt;font-family:'Inter',sans-serif;color:#64748b;font-weight:600;padding-right:20mm;text-align:right;">
        Trang <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '20mm' }
  });

  await browser.close();

  fs.writeFileSync(OUTPUT_PATH, pdfBuffer);
  const sizeKB = (pdfBuffer.length / 1024).toFixed(1);

  console.log(`\n✅ PDF đã tạo thành công!`);
  console.log(`📁 File: ${OUTPUT_PATH}`);
  console.log(`📦 Kích thước: ${sizeKB} KB`);
  console.log(`\n📋 Thông tin đã sửa:`);
  console.log(`   ✔ Ngày sinh: 07/05/2015 (sửa từ 2025)`);
  console.log(`   ✔ Life Path: 2 (sửa từ 3)`);
  console.log(`   ✔ Toàn bộ nội dung khác giữ nguyên từ bản gốc`);
}

generatePDF().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
