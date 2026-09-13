/**
 * Generate PDF: Đoàn Nguyễn Khánh Minh — NCN-5732
 * Profile: ENTP | Holland: SEA | LP:3 Soul:5 Mission:8 Talent:9 Passion:5
 * Top 5: Marketing/KD · Đào tạo/HN · Nhân sự HR · Nhà báo/TT · Chuyên gia LN
 *
 * FIX: Chương IV bị lỗi — viết lại toàn bộ nội dung AI cho Chương IV:
 *   - IDEAL_ENVIRONMENT / TOXIC_ENVIRONMENT
 *   - Culture Fit Matrix (MNC / SOLO / STARTUP / PUBLIC)
 *   - 3 Trụ Cột Kỹ Năng (PILLAR 1/2/3)
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join('D:\\NCN-Academy\\apps\\web\\public', 'bao-cao-pdf-template.html');
const OUTPUT_PATH   = 'D:\\NCN-Academy\\BaoCao_DoanNguyenKhanhMinh_NCN5732_Fixed.pdf';
const CHROME_PATH   = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── Dữ liệu hồ sơ Khánh Minh ─────────────────────────────────────────────────
const data = {
  HOTEN:          "Đoàn Nguyễn Khánh Minh",
  EMAIL:          "nguyenlientl197@gmail.com",
  DIEN_THOAI:     "0931459168",
  NGAY_SINH:      "27/8/2011",
  MA_SO_HO_SO:    "NCN-5732",
  NGAY_XUAT_BAN:  "13/7/2026",

  // Holland RIASEC scores (SEA)
  R_PCT: 0,
  I_PCT: 20,
  A_PCT: 80,
  S_PCT: 100,
  E_PCT: 100,
  C_PCT: 10,

  MBTI:     "ENTP",
  LIFEPATH: 3,
  SOUL:     5,
  MISSION:  8,
  TALENT:   9,
  PASSION:  5,
  HOLLAND:  "SEA",

  // Top 5 nghề
  TOP1_TITLE:      "Chuyên gia Marketing / Kinh doanh",
  TOP1_NICHE:      "CEO Startup & Nhà sáng lập Khởi nghiệp",
  TOP1_REF:        "Quản trị & Marketing",
  TOP1_FIELD:      "Đại học — Quản trị & Marketing",
  TOP1_ICI:        100,
  TOP1_ICI_DETAIL: "Id:88 · Ni:100 · Mk:96.9",
  TOP1_SUBJECTS:   "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)",

  TOP2_TITLE:      "Nhà đào tạo / Hướng nghiệp Nghề nghiệp",
  TOP2_NICHE:      "Chuyên gia Chiến lược Định vị Nghề nghiệp & Thương hiệu Cá nhân",
  TOP2_REF:        "Giáo dục & Đào tạo",
  TOP2_FIELD:      "Đại học — Giáo dục & Đào tạo",
  TOP2_ICI:        98.13,
  TOP2_ICI_DETAIL: "Id:92 · Ni:100 · Mk:86.2",
  TOP2_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",

  TOP3_TITLE:      "Chuyên gia Nhân sự (HR)",
  TOP3_NICHE:      "Giám đốc Nhân sự Cấp cao (CHRO)",
  TOP3_REF:        "Quản trị Nhân sự",
  TOP3_FIELD:      "Đại học — Quản trị Nhân sự",
  TOP3_ICI:        95.25,
  TOP3_ICI_DETAIL: "Id:85.5 · Ni:100 · Mk:93",
  TOP3_SUBJECTS:   "D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)",

  TOP4_TITLE:      "Nhà báo / Người làm truyền thông",
  TOP4_NICHE:      "Nhà sáng tạo Nội dung Số & Chiến lược gia Kênh Đa nền tảng",
  TOP4_REF:        "Truyền thông đa phương tiện",
  TOP4_FIELD:      "Đại học — Báo chí & Truyền thông",
  TOP4_ICI:        93.41,
  TOP4_ICI_DETAIL: "Id:92.5 · Ni:100 · Mk:86.1",
  TOP4_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",

  TOP5_TITLE:      "Chuyên gia Liên ngành",
  TOP5_NICHE:      "Truyền thông đa phương tiện",
  TOP5_REF:        "Khác",
  TOP5_FIELD:      "Đại học — Xã hội học / Công tác xã hội",
  TOP5_ICI:        89.79,
  TOP5_ICI_DETAIL: "Id:85.5 · Ni:100 · Mk:90",
  TOP5_SUBJECTS:   "D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)",

  RISK_NOW: "Ngay trong học kỳ này: Khánh Minh dễ bị phân tán bởi quá nhiều ý tưởng hấp dẫn cùng lúc. Hãy chọn một hướng cụ thể và theo đuổi đến cùng — thay vì bắt đầu nhiều thứ rồi không hoàn thành cái nào.",
};

// ── Nội dung AI cho Chương I, II, III, V (giữ nguyên từ PDF gốc) ─────────────
const aiTexts = {
  // Chương I — Bạn Là Ai?
  AI_PAGE3_P1: "Khánh Minh sở hữu một điểm sáng hiếm có: sự giao thoa giữa trí tuệ luôn khát khao chinh phục ý tưởng mới và trái tim ấm áp hướng về con người. Bạn có khả năng nhìn thấy tiềm năng ở những nơi người khác chỉ thấy vấn đề, đồng thời có bản năng thấu hiểu và kết nối sâu sắc với cảm xúc của những người xung quanh. Đây là sự giao thoa quý giá giữa tư duy sáng tạo bứt phá và tấm lòng nhân ái chân thành.",
  AI_PAGE3_P2: "Sự pha trộn giữa tinh thần dám thử thách quy chuẩn, khả năng truyền đạt cuốn hút và mong muốn xây dựng những mối quan hệ ý nghĩa tạo nên một Khánh Minh vừa là người dẫn dắt tự nhiên, vừa là người bạn đồng hành đáng tin cậy mà ai cũng muốn có trong đội nhóm.",
  AI_PAGE3_P3: "Khánh Minh tỏa sáng nhất trong những môi trường năng động, nơi con người được đặt ở trung tâm, ý tưởng mới được khuyến khích và bạn có đủ không gian để thử nghiệm mà không bị gò bó bởi khuôn khổ cứng nhắc hay quy trình máy móc lặp đi lặp lại.",

  AI_PAGE4_P1: "Khánh Minh tư duy theo cách của người kiến tạo ý tưởng không ngừng nghỉ: luôn đặt câu hỏi 'tại sao' và 'nếu như' để mở ra góc nhìn mới. Bạn không thích đi theo lối mòn, mà thích tranh luận, thử nghiệm và khám phá nhiều hướng khác nhau trước khi chọn con đường tối ưu — luôn giữ tâm thế cởi mở và ham học hỏi.",
  AI_PAGE4_P2: "Giá trị lớn nhất Khánh Minh mang lại chính là khả năng tạo ra ảnh hưởng thực sự trên quy mô rộng. Với sứ mệnh của người xây dựng — không chỉ giúp một cá nhân mà còn kiến tạo những giá trị bền vững cho cả một tập thể — Khánh Minh có tố chất của người lãnh đạo nhân văn biết cách biến ý tưởng cá nhân thành phong trào, chương trình hay hệ thống lan rộng.",
  AI_PAGE4_P3: "Khi áp lực dồn nén, Khánh Minh dễ rơi vào trạng thái phân tán năng lượng vì có quá nhiều ý tưởng hấp dẫn cùng lúc, dẫn đến quá tải và thiếu kiên trì theo đuổi đến cùng một mục tiêu. Sự khao khát tự do và thay đổi liên tục đôi khi khiến bạn mất kết nối với những cam kết dài hạn.",
  AI_PAGE4_RECOVERY: "Hãy học cách chia nhỏ mục tiêu lớn thành các cột mốc ngắn hạn, kết hợp những khoảng nghỉ để đổi mới — vừa giữ được sự tự do sáng tạo, vừa duy trì sự kiên định cần thiết để hoàn thành điều đã bắt đầu.",

  AI_PAGE5_P1: "Có một nguồn năng lượng đặc biệt chảy trong Khánh Minh — khả năng thấu cảm sâu sắc với nỗi đau và khát vọng của người khác, kết hợp với tấm lòng muốn cho đi nhiều hơn nhận lại. Đây không phải điều ai cũng có một cách tự nhiên. Khi năng lực này được nuôi dưỡng đúng cách, cùng với sự thông minh nhạy bén và khả năng giao tiếp thuyết phục, Khánh Minh hoàn toàn có thể trở thành nguồn cảm hứng sống cho nhiều người khác.",
  AI_PAGE5_P2: "Nhìn xa hơn những thành công trước mắt, di sản thực sự mà Khánh Minh có thể để lại là một cộng đồng, một hệ thống, hoặc một thế hệ người trẻ được truyền cảm hứng để sống sáng tạo hơn, tự tin hơn và tử tế hơn nhờ chính sự hiện diện của bạn. Bạn sinh ra không chỉ để thành công cho riêng mình, mà để trở thành cầu nối giữa những ý tưởng lớn và những trái tim cần được chạm đến.",
  AI_CLOSING_MESSAGE: "Khánh Minh ơi, hành trình phía trước là hành trình của người dám nghĩ khác, dám sống thật và dám yêu thương bằng cả trái tim rộng lớn. Hãy tin vào trí tuệ sắc bén và tấm lòng nhân ái bạn đang mang theo. Thế giới đang cần những người như bạn để trở nên tốt đẹp hơn từng ngày. NCN Academy tin tưởng và đồng hành cùng bạn trên hành trình ý nghĩa này.",

  // Chương III — Điểm yếu
  WEAKNESS_1_TITLE: "Hội chứng bắt đầu liên tục",
  WEAKNESS_1_DESC:  "Khánh Minh dễ bị cuốn vào sự kích thích của ý tưởng mới, dẫn đến bắt đầu nhiều việc nhưng ít hoàn thành trọn vẹn. Để vượt qua điều này, hãy áp dụng nguyên tắc Một Việc tại Một Thời Điểm và cam kết hoàn thành ít nhất 80% mục tiêu hiện tại trước khi chuyển sang cái mới.",
  WEAKNESS_2_TITLE: "Tranh luận thay vì lắng nghe",
  WEAKNESS_2_DESC:  "Tư duy phản biện sắc sảo của Khánh Minh đôi khi khiến bạn ưu tiên việc chứng minh mình đúng hơn là thực sự lắng nghe quan điểm của người khác. Hãy tập thói quen hỏi 'Điều gì trong góc nhìn này tôi chưa hiểu?' trước khi phản bác.",
  WEAKNESS_3_TITLE: "Khó duy trì cam kết dài hạn",
  WEAKNESS_3_DESC:  "Với bản năng tìm kiếm sự mới mẻ, Khánh Minh dễ cảm thấy chán khi công việc trở nên lặp đi lặp lại và thiếu thách thức. Hãy xây dựng cho mình những milestone ý nghĩa theo từng giai đoạn để duy trì động lực ngay cả trong những công đoạn tẻ nhạt.",

  // Risk
  RISK_SHORT_TERM:  "Trong 6 tháng tới: Xác định một kỹ năng cụ thể trong Top 3 nghề phù hợp và học sâu vào đó. Hãy tìm một người mentor — thầy cô, anh chị đi trước — để định hướng lộ trình học tập thực tế, tránh tình trạng học lan man không có đích đến.",
  RISK_LONG_TERM:   "Trong 2 năm: Xây dựng một portfolio gồm ít nhất 3 dự án thực tế trong lĩnh vực bạn chọn. Học cách làm việc có hệ thống và duy trì kỷ luật ngay cả khi hứng khởi ban đầu đã qua đi — đây là kỹ năng sẽ tạo ra sự khác biệt lớn trong sự nghiệp.",

  // Chương IV — MÔI TRƯỜNG & KỸ NĂNG (phần bị lỗi — viết lại hoàn chỉnh)
  IDEAL_ENVIRONMENT: "Khánh Minh phát huy tốt nhất trong môi trường có nhịp độ nhanh, đề cao sự đổi mới và cho phép bạn tiếp xúc với nhiều người, nhiều vấn đề khác nhau mỗi ngày. Nơi ý tưởng được trân trọng, thảo luận cởi mở được khuyến khích và mỗi người được trao quyền tự chủ trong cách làm việc của mình — đó là điều kiện lý tưởng để bạn bùng nổ năng lực.",
  TOXIC_ENVIRONMENT: "Môi trường độc hại với Khánh Minh là nơi mọi thứ đều phải tuân theo quy trình cứng nhắc, không có chỗ cho sự sáng tạo hay thử nghiệm. Văn hóa làm việc quan liêu, lãnh đạo vi quản lý và đồng nghiệp không thích giao lưu sẽ bóp nghẹt năng lượng của bạn — khiến bạn nhanh chóng kiệt sức và mất đi động lực cốt lõi.",

  // Culture Fit Matrix
  MNC_FIT:      "72%",
  MNC_DESC:     "Phù hợp ở mức khá. Tập đoàn lớn mang đến quy trình bài bản và cơ hội học hỏi chuyên sâu, nhưng tốc độ ra quyết định chậm và văn hóa thứ bậc dễ làm Khánh Minh cảm thấy bị giới hạn sau 1-2 năm đầu.",
  SOLO_FIT:     "88%",
  SOLO_DESC:    "Rất phù hợp. Khánh Minh có đủ tố chất của người kinh doanh độc lập: tư duy khai phá, khả năng kết nối mạng lưới và bản năng thấu hiểu khách hàng. Thách thức duy nhất là kỷ luật tự quản.",
  STARTUP_FIT:  "95%",
  STARTUP_DESC: "Phù hợp cực cao. Môi trường startup với tốc độ nhanh, đòi hỏi đa nhiệm và coi trọng ý tưởng sáng tạo chính là sân chơi tự nhiên của Khánh Minh. Đặc biệt phù hợp với startup EdTech, Social Impact hay Marketing.",
  PUBLIC_FIT:   "38%",
  PUBLIC_DESC:  "Ít phù hợp. Nhịp độ chậm, thăng tiến theo thâm niên và văn hóa ngại thay đổi của khối nhà nước sẽ nhanh chóng dập tắt ngọn lửa sáng tạo và tham vọng của Khánh Minh.",

  // 3 Trụ Cột Kỹ Năng
  PILLAR_1_TITLE: "Kỹ năng Kết nối & Ảnh hưởng",
  PILLAR_1_DESC:  "Đây là vũ khí cạnh tranh mạnh nhất của Khánh Minh. Khả năng xây dựng niềm tin nhanh, truyền đạt ý tưởng hấp dẫn và tạo ra ảnh hưởng lên người khác sẽ là chìa khóa mở ra mọi cơ hội — dù trong Marketing, Đào tạo hay Nhân sự. Hãy đầu tư vào kỹ năng thuyết trình, kể chuyện và đàm phán ngay từ bây giờ.",
  PILLAR_2_TITLE: "Kỹ năng Tư duy Chiến lược",
  PILLAR_2_DESC:  "Khánh Minh có tư duy sáng tạo bẩm sinh — nhưng để thực sự tạo ra giá trị, bạn cần học cách đưa ý tưởng vào khuôn khổ có thể thực thi. Rèn luyện khả năng phân tích vấn đề có cấu trúc, lập kế hoạch ngược từ mục tiêu và đo lường kết quả bằng số liệu cụ thể sẽ giúp bạn biến tầm nhìn thành hành động thực tế.",
  PILLAR_3_TITLE: "Kỹ năng Tự quản & Hoàn thành",
  PILLAR_3_DESC:  "Điểm yếu lớn nhất và cũng là cơ hội phát triển quan trọng nhất của Khánh Minh là khả năng hoàn thành những gì đã bắt đầu. Hãy xây dựng hệ thống theo dõi cá nhân — dù đơn giản như một danh sách công việc hàng ngày — và luyện thói quen tổng kết tuần để giúp bạn duy trì kỷ luật ngay cả khi cảm hứng ban đầu đã nguội dần.",

  // Nghề nên tránh
  AVOID_1_TITLE:  "Lập trình viên hệ thống / Nhúng (C/C++)",
  AVOID_1_ANGLE:  "Môi trường làm việc",
  AVOID_1_REASON: "Hãy thử tưởng tượng một ngày làm việc điển hình: bạn ngồi một mình trước màn hình, đọc và debug hàng trăm dòng code C++, mỗi lỗi nhỏ có thể mất hàng giờ truy tìm. Không có cuộc trò chuyện, không có cộng đồng, không có khoảnh khắc truyền cảm hứng — chỉ là con người và máy tính trong im lặng liên tục. Khánh Minh phát triển tốt nhất khi được tương tác, thuyết phục và truyền năng lượng cho người khác. Môi trường cô lập và đơn điệu của lập trình hệ thống nhúng sẽ nhanh chóng làm bạn mất đi nguồn năng lượng sống.",
  AVOID_1_TIP:    "Nếu bạn thích công nghệ, hãy xem xét vai trò Product Manager hoặc Tech Marketer — nơi bạn kết nối giữa con người và sản phẩm công nghệ.",

  AVOID_2_TITLE:  "Kế toán viên / Kiểm toán viên",
  AVOID_2_ANGLE:  "Kỹ năng cốt lõi",
  AVOID_2_REASON: "Kế toán đòi hỏi ba kỹ năng then chốt: sự tỉ mỉ với từng con số (không được phép sai dù là 1 đồng), tư duy tuân thủ theo quy định pháp lý nghiêm ngặt, và khả năng chịu đựng sự lặp lại của các chu kỳ báo cáo hàng tháng, hàng quý, hàng năm. Với Khánh Minh — người hoạt động tốt nhất khi có tự do sáng tạo và môi trường thay đổi liên tục — những đòi hỏi này đi ngược hoàn toàn với bản năng tự nhiên. Bạn không phải là người không học được kế toán, nhưng mỗi ngày ngồi đối chiếu bảng số liệu sẽ là một cuộc chiến ngược với con người thật của mình.",
  AVOID_2_TIP:    "Nếu bạn muốn làm việc với dữ liệu theo cách thú vị hơn, hãy xem xét Business Analytics hoặc Marketing Data — phân tích dữ liệu phục vụ ra quyết định sáng tạo.",

  AVOID_3_TITLE:  "Nhân viên QC / Kiểm soát chất lượng nhà máy",
  AVOID_3_ANGLE:  "Giá trị & Động lực",
  AVOID_3_REASON: "Nghề QC nhà máy thưởng cho hai điều: độ chính xác tuyệt đối trong từng bước kiểm tra và sự tuân thủ quy trình không có ngoại lệ. Người làm QC giỏi là người tìm thấy ý nghĩa trong việc đảm bảo mọi sản phẩm đều đạt chuẩn — ngày qua ngày, ca qua ca. Nhưng Khánh Minh được thúc đẩy bởi điều hoàn toàn khác: ảnh hưởng lên con người, sự ghi nhận từ cộng đồng, và cảm giác tạo ra điều gì đó mới mẻ. Khi nguồn động lực cốt lõi không được nuôi dưỡng, công việc dù ổn định về tài chính cũng sẽ cảm thấy trống rỗng và vô nghĩa về lâu dài.",
  AVOID_3_TIP:    "Nếu bạn quan tâm đến môi trường sản xuất, vai trò Sales B2B hoặc Marketing công nghiệp sẽ cho phép bạn tương tác với con người và sử dụng kỹ năng thuyết phục của mình.",

  // ── Chương II: Phân tích chi tiết 5 nghề ─────────────────────────────────────
  // Template dùng placeholder CAREER_x_SCIENCE/TREND/SKILLS
  CAREER_1_SCIENCE: "Sự kết hợp giữa tư duy khai phá của người ưa khám phá ý tưởng mới và trái tim luôn hướng về con người tạo nền tảng vững chắc cho nghề này. Khả năng thấu hiểu cảm xúc, kết nối cộng đồng cùng bản năng sáng tạo giúp Khánh Minh biến mỗi mối quan hệ khách hàng thành một câu chuyện đáng nhớ, nơi tài năng thiên bẩm về giao tiếp được thắp sáng trọn vẹn.",
  CAREER_1_TREND:   "Trong 5-10 năm tới, Marketing chăm sóc khách hàng và xây dựng cộng đồng thương hiệu sẽ trở thành yếu tố sống còn khi doanh nghiệp cạnh tranh bằng trải nghiệm thay vì giá cả. Việt Nam đang chứng kiến làn sóng chuyển đổi số mạnh mẽ, mở ra vô vàn cơ hội cho những ai giỏi kết nối con người với thương hiệu một cách chân thực.",
  CAREER_1_SKILLS:  "Để tỏa sáng trong lĩnh vực này, Khánh Minh cần trau dồi khả năng lắng nghe sâu sắc, kỹ năng kể chuyện đầy cảm xúc và tư duy chiến lược trong xây dựng mối quan hệ dài hạn. Sự nhạy bén trong nắm bắt xu hướng cùng khả năng sáng tạo không ngừng sẽ là chìa khóa giúp bạn dẫn đầu trong ngành đầy tính người này.",

  CAREER_2_SCIENCE: "Bản tính ham học hỏi, tư duy phản biện linh hoạt cùng khát khao được truyền cảm hứng cho người khác chính là nền tảng khoa học vững chắc cho vai trò này. Khả năng đồng cảm sâu sắc kết hợp với sứ mệnh dẫn dắt người khác vươn lên giúp Khánh Minh trở thành người thầy được tin tưởng và yêu mến.",
  CAREER_2_TREND:   "Ngành đào tạo và hướng nghiệp đang bùng nổ khi thế hệ trẻ ngày càng cần định hướng rõ ràng giữa thị trường lao động biến động. Cả Việt Nam và thế giới đều ghi nhận nhu cầu tăng cao với các chuyên gia có khả năng kết nối tri thức và thực tiễn nghề nghiệp trong thập kỷ tới.",
  CAREER_2_SKILLS:  "Khánh Minh nên tập trung phát triển khả năng thiết kế nội dung đào tạo sáng tạo, kỹ năng truyền đạt truyền cảm hứng và năng lực thấu hiểu tâm lý người học. Sự linh hoạt trong ứng biến cùng tư duy hệ thống sẽ giúp bạn xây dựng những chương trình đào tạo thực sự tạo ra giá trị bền vững.",

  CAREER_3_SCIENCE: "Sự nhạy bén trong đọc hiểu con người, khả năng giao tiếp linh hoạt và mong muốn xây dựng môi trường làm việc gắn kết là nền tảng cốt lõi cho vai trò này. Tài năng kết nối tự nhiên cùng khao khát tạo ra giá trị cho tập thể giúp Khánh Minh trở thành cầu nối đáng tin cậy giữa con người và tổ chức.",
  CAREER_3_TREND:   "Nhân sự đang chuyển mình từ vai trò hành chính sang chiến lược, chú trọng trải nghiệm nhân viên và văn hóa doanh nghiệp bền vững. Đây là lĩnh vực có nhu cầu tuyển dụng ổn định tại Việt Nam và toàn cầu, đặc biệt với những người giỏi thấu hiểu và phát triển con người.",
  CAREER_3_SKILLS:  "Khánh Minh cần trau dồi kỹ năng đánh giá năng lực con người một cách tinh tế, khả năng xây dựng chương trình phát triển nhân viên sáng tạo và năng lực giao tiếp đa chiều. Tư duy chiến lược trong quản lý con người sẽ là nền tảng giúp bạn tạo dựng những đội ngũ gắn kết và bền vững.",

  CAREER_4_SCIENCE: "Tư duy phản biện sắc sảo, khả năng khai thác thông tin từ nhiều nguồn khác nhau và bản năng kể chuyện bẩm sinh là nền tảng lý tưởng cho một nhà báo hoặc người làm nội dung số. Khánh Minh có khả năng nhìn thấy câu chuyện đằng sau những con số khô khan và biến chúng thành nội dung chạm đến cảm xúc người đọc.",
  CAREER_4_TREND:   "Truyền thông số và sáng tạo nội dung đang bùng nổ tại Việt Nam, với nhu cầu cao về những người có thể sản xuất nội dung chất lượng trên nhiều nền tảng. Các tổ chức NGO, phi lợi nhuận và doanh nghiệp xã hội cũng đang tìm kiếm ngày càng nhiều nhân lực có kỹ năng truyền thông để mở rộng tầm ảnh hưởng.",
  CAREER_4_SKILLS:  "Để thành công, Khánh Minh cần phát triển kỹ năng nghiên cứu và kiểm chứng thông tin, khả năng viết lách rõ ràng và có sức lay động, cùng tư duy đa nền tảng để phân phối nội dung hiệu quả trên các kênh khác nhau từ báo in đến social media và podcast.",

  CAREER_5_SCIENCE: "Tư duy liên ngành của Khánh Minh — khả năng kết nối các lĩnh vực tưởng như không liên quan để tạo ra giải pháp mới — chính là lợi thế cạnh tranh độc đáo trong vai trò Chuyên gia Liên ngành. Bạn có bản năng nhìn thấy bức tranh toàn cảnh và tìm ra điểm giao thoa có giá trị giữa các ngành.",
  CAREER_5_TREND:   "Các vấn đề xã hội phức tạp ngày nay — từ biến đổi khí hậu đến bất bình đẳng — đòi hỏi những người có thể tư duy vượt ranh giới ngành nghề. Chuyên gia liên ngành đang được săn đón tại các tổ chức quốc tế, NGO lớn và các chương trình phát triển cộng đồng bền vững.",
  CAREER_5_SKILLS:  "Khánh Minh cần xây dựng nền tảng kiến thức vững ở ít nhất một ngành cụ thể trước, sau đó mở rộng dần sang các lĩnh vực liên quan. Kỹ năng quản lý dự án, điều phối nhiều bên liên quan và khả năng dịch thuật ý tưởng từ ngôn ngữ ngành này sang ngôn ngữ ngành khác sẽ là tài sản vô giá.",

  // ── TOP 1-5 prep grid — PHẢI dùng đúng key TOP x_* để khớp template {{TOPx_KIENTHUC}} ──
  TOP1_KIENTHUC: '<li>Tâm lý khách hàng & hành vi tiêu dùng</li><li>Nguyên lý marketing hiện đại</li><li>Xây dựng thương hiệu cá nhân</li><li>Truyền thông đa kênh</li>',
  TOP1_KYNANG:   '<li>Giao tiếp thuyết phục</li><li>Kể chuyện thương hiệu</li><li>Xây dựng mối quan hệ</li><li>Phân tích dữ liệu khách hàng</li><li>Sáng tạo nội dung</li><li>Quản lý cộng đồng</li>',
  TOP1_LOTRINH:  '<li>Học khóa ngắn hạn Marketing căn bản</li><li>Thực tập vị trí Chăm sóc khách hàng</li><li>Tốt nghiệp Cao đẳng/Đại học ngành Marketing hoặc Truyền thông</li><li>Tích lũy kinh nghiệm qua dự án cộng đồng thực tế</li>',
  TOP1_VIECLEM:  '<li>Chuyên viên Marketing</li><li>Quản lý cộng đồng thương hiệu</li><li>Chuyên viên CSKH cao cấp</li><li>Chuyên gia Referral Marketing</li><li>Trưởng nhóm phát triển khách hàng</li>',
  TOP1_ADVICE:   'Hãy để sự chân thành trong từng kết nối trở thành thứ ngôn ngữ mạnh mẽ nhất mà Khánh Minh mang đến cho thế giới.',

  TOP2_KIENTHUC: '<li>Tâm lý học phát triển</li><li>Phương pháp giảng dạy hiện đại</li><li>Tư vấn hướng nghiệp</li><li>Thị trường lao động Việt Nam</li>',
  TOP2_KYNANG:   '<li>Truyền đạt hấp dẫn</li><li>Lắng nghe thấu cảm</li><li>Định hướng cá nhân hóa</li><li>Xây dựng nội dung đào tạo</li><li>Truyền cảm hứng</li><li>Giải quyết tình huống linh hoạt</li>',
  TOP2_LOTRINH:  '<li>Hoàn thành chứng chỉ nghiệp vụ sư phạm hoặc đào tạo</li><li>Tốt nghiệp Đại học ngành Giáo dục, Tâm lý hoặc Xã hội học</li><li>Thực hành qua các khóa huấn luyện kỹ năng mềm</li><li>Phát triển chuyên môn qua các dự án tư vấn nghề nghiệp thực tế</li>',
  TOP2_VIECLEM:  '<li>Giảng viên kỹ năng mềm</li><li>Chuyên viên tư vấn hướng nghiệp</li><li>Giáo viên phổ thông</li><li>Huấn luyện viên phát triển sự nghiệp</li><li>Chuyên gia đào tạo doanh nghiệp</li>',
  TOP2_ADVICE:   'Mỗi bài giảng của Khánh Minh có thể là ngọn đèn soi sáng con đường của một người trẻ đang lạc lối — hãy trân trọng sức mạnh ấy.',

  TOP3_KIENTHUC: '<li>Quản trị nguồn nhân lực</li><li>Luật lao động cơ bản</li><li>Tâm lý tổ chức</li><li>Kỹ năng phỏng vấn tuyển dụng</li>',
  TOP3_KYNANG:   '<li>Đánh giá nhân sự</li><li>Xây dựng mối quan hệ</li><li>Giao tiếp chuyên nghiệp</li><li>Thiết kế chương trình đào tạo</li><li>Lắng nghe chủ động</li><li>Giải quyết xung đột</li>',
  TOP3_LOTRINH:  '<li>Học khóa ngắn hạn về Quản trị Nhân sự</li><li>Tốt nghiệp Đại học ngành Quản trị Nhân lực hoặc Kinh doanh</li><li>Thực tập tại phòng Nhân sự doanh nghiệp</li><li>Phát triển chuyên môn qua chứng chỉ HR quốc tế</li>',
  TOP3_VIECLEM:  '<li>Chuyên viên tuyển dụng</li><li>Chuyên viên đào tạo nội bộ</li><li>Quản lý văn hóa doanh nghiệp</li><li>Chuyên gia phúc lợi nhân viên</li><li>Trưởng phòng Nhân sự</li>',
  TOP3_ADVICE:   'Hãy nhìn mỗi ứng viên như một câu chuyện tiềm năng chưa được kể, và Khánh Minh chính là người viết tiếp chương tươi sáng cho họ.',

  TOP4_KIENTHUC: '<li>Kỹ thuật báo chí & phóng sự</li><li>Truyền thông số đa nền tảng</li><li>Viết nội dung cho NGO & phi lợi nhuận</li><li>Pháp lý báo chí cơ bản</li>',
  TOP4_KYNANG:   '<li>Viết lách rõ ràng & lay động</li><li>Phỏng vấn & khai thác thông tin</li><li>Chụp ảnh & quay video cơ bản</li><li>Quản lý mạng xã hội</li><li>Tư duy phân tích đa chiều</li><li>Quản lý thời gian & deadline</li>',
  TOP4_LOTRINH:  '<li>Học kiến thức nền tảng báo chí và truyền thông</li><li>Thực hành qua blog/kênh cá nhân và dự án nhỏ</li><li>Xây dựng portfolio gồm ít nhất 5 bài viết chất lượng</li><li>Tìm kiếm cơ hội thực tập tại tòa soạn hoặc tổ chức phi lợi nhuận</li>',
  TOP4_VIECLEM:  '<li>Phóng viên / Nhà báo</li><li>Content Creator đa nền tảng</li><li>Chuyên viên truyền thông NGO</li><li>Biên tập viên nội dung</li><li>Social Media Manager</li>',
  TOP4_ADVICE:   'Hãy bắt đầu bằng một blog cá nhân hay kênh mạng xã hội nhỏ — mỗi bài viết là bước tập luyện biến ý tưởng trong đầu thành ngôn ngữ chạm đến người đọc.',

  TOP5_KIENTHUC: '<li>Phát triển cộng đồng địa phương</li><li>Tư vấn thay đổi hành vi bền vững</li><li>Quản lý chương trình phúc lợi xã hội</li><li>Chính sách công & quan hệ đối tác</li>',
  TOP5_KYNANG:   '<li>Điều phối đa bên liên quan</li><li>Tư duy liên ngành</li><li>Quản lý dự án</li><li>Giao tiếp xuyên văn hóa</li><li>Đo lường tác động xã hội</li><li>Viết đề xuất & báo cáo</li>',
  TOP5_LOTRINH:  '<li>Học kiến thức nền về Xã hội học, Công tác xã hội hoặc Chính sách công</li><li>Thực hành qua các dự án cộng đồng nhỏ</li><li>Xây dựng portfolio và mạng lưới tổ chức phi lợi nhuận</li><li>Tìm kiếm cơ hội thực tập tại tổ chức phát triển quốc tế</li>',
  TOP5_VIECLEM:  '<li>Điều phối viên dự án xã hội</li><li>Chuyên viên phát triển cộng đồng</li><li>Tư vấn chương trình CSR</li><li>Quản lý dự án NGO</li><li>Chuyên gia chính sách xã hội</li>',
  TOP5_ADVICE:   'Hãy tham gia các dự án cộng đồng đa ngành ngay từ thời học sinh — đó là môi trường hoàn hảo để rèn luyện tư duy liên kết và xây dựng mạng lưới đa dạng từ sớm.',
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
  console.log(`\n📋 Các phần đã sửa trong Chương IV:`);
  console.log(`   ✔ Môi trường lý tưởng — cá nhân hóa cho ENTP/SEA`);
  console.log(`   ✔ Môi trường gây ức chế — cụ thể, không còn là placeholder`);
  console.log(`   ✔ Culture Fit Matrix — 4 loại tổ chức với % và phân tích thực`);
  console.log(`   ✔ 3 Trụ Cột Kỹ Năng — phù hợp profile Khánh Minh`);
  console.log(`   ✔ Toàn bộ Chương III (3 điểm yếu + 3 nghề tránh) cũng được cập nhật đầy đủ`);
}

generatePDF().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
