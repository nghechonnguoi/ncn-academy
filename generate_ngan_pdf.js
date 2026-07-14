/**
 * Standalone PDF generator for Pham Thi Ngan (Test)
 * Uses: HTML template + Chrome local + AI-written content (no API key needed)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join('D:\\NCN-Academy\\apps\\web\\public', 'bao-cao-pdf-template.html');
const OUTPUT_PATH = 'D:\\NCN-Academy\\BaoCao_PhamThiNgan_HocNghe.pdf';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── AI-generated content for Pham Thi Ngan ──────────────────────────────────
// Profile: ENFP | Holland: ASE | LP:9 Soul:7 Mission:4 Talent:5 Passion:1&2&5
// Vocation (hoc nghe): Top2 Kinh doanh cong dong, Top4 Trainer ky nang mem
const aiTexts = {
  AI_PAGE3_P1: "Ngân sở hữu một nguồn năng lượng hiếm có: sự kết hợp giữa trái tim nghệ sĩ và tâm hồn nhà lãnh đạo. Khả năng đọc vị cảm xúc người khác gần như tức thời, cùng với sức sáng tạo không ngừng nghỉ, khiến Ngân trở thành người có thể chạm đến trái tim con người theo những cách mà ít ai làm được. Đây chính là nền tảng để Ngân xây dựng ảnh hưởng sâu rộng trong bất kỳ lĩnh vực nào Ngân chọn.",
  AI_PAGE3_P2: "Sự hòa quyện giữa tính khám phá sáng tạo và bản năng kết nối cộng đồng tạo nên một Ngân vừa độc đáo vừa có sức hút tự nhiên. Ngân không chỉ nghĩ ra ý tưởng hay, mà còn có khả năng truyền lửa và biến ý tưởng đó thành hành động thực tế cùng người khác.",
  AI_PAGE3_P3: "Môi trường lý tưởng cho Ngân là nơi cởi mở, đề cao sự sáng tạo và cho phép tương tác linh hoạt với con người. Không gian có tính nhân văn cao, khuyến khích thử nghiệm và tôn trọng cái mới sẽ là nơi Ngân tỏa sáng trọn vẹn nhất.",
  AI_PAGE4_P1: "Ngân tư duy theo cách phi tuyến tính: thay vì đi từ A đến B theo đường thẳng, Ngân nhìn thấy các mối liên hệ bất ngờ giữa nhiều điều tưởng như không liên quan. Điều này cho phép Ngân đưa ra những giải pháp sáng tạo mà người khác bỏ qua, đặc biệt trong các tình huống cần khai phá tiềm năng của con người.",
  AI_PAGE4_P2: "Giá trị mà Ngân mang lại cho cộng đồng là khả năng thức tỉnh tiềm năng trong người khác. Ngân sinh ra để kiến tạo nền tảng bền vững cho những người xung quanh, không phải bằng cách áp đặt mà bằng cách lắng nghe, thấu hiểu và chắt lọc điểm sáng trong mỗi cá nhân. Đây là sứ mệnh thiêng liêng mà Ngân mang theo trong từng bước đi.",
  AI_PAGE4_P3: "Rủi ro lớn nhất với Ngân là khi đối mặt với sự đơn điệu và thiếu ý nghĩa trong công việc. Khi bị buộc vào các khuôn khổ cứng nhắc hoặc môi trường thiếu sự kết nối người với người, Ngân dễ rơi vào trạng thái mất phương hướng và cạn kiệt năng lượng một cách nhanh chóng.",
  AI_PAGE4_RECOVERY: "Nạp lại năng lượng bằng cách dành thời gian một mình để phản tư. Viết nhật ký, nghe nhạc hoặc đi dạo thiên nhiên sẽ giúp Ngân tái kết nối với bản ngã sâu thẳm và tìm lại sự rõ ràng trong tâm trí.",
  AI_PAGE5_P1: "Điểm vượt trội bẩm sinh của Ngân nằm ở khả năng thích nghi phi thường, khả năng nắm bắt xu hướng và biến đổi cực kỳ linh hoạt. Ngân không bị ràng buộc bởi lối mòn. Với sự tự do trong tư duy và hành động, Ngân có thể đặt chân vào nhiều lĩnh vực khác nhau, học hỏi nhanh và tìm ra điểm độc đáo của riêng mình. Đây là tài sản vô giá trong thế giới thay đổi chóng mặt ngày nay, và cũng là lý do Ngân sẽ thành công ở những con đường mà người khác chưa dám đặt chân.",
  AI_PAGE5_P2: "Di sản mà Ngân có thể để lại không phải là một công trình đơn lẻ, mà là hàng trăm con người được truyền lửa, được chắp cánh và được nhìn thấy giá trị thực sự của bản thân. Với tiềm năng của một nhà lãnh đạo nhân văn bẩm sinh, Ngân sinh ra để tạo ra những làn sóng thay đổi tích cực, những cộng đồng gắn kết và những thế hệ tiếp nối được sống đúng với bản chất mình nhất.",
  AI_CLOSING_MESSAGE: "Ngân ơi, con đường phía trước không cần phải hoàn hảo ngay từ đầu. Điều quan trọng là bạn bắt đầu, bắt đầu với chính con người thật nhất của mình. Mỗi bước đi dù nhỏ đều là sự dũng cảm, và chính sự dũng cảm đó sẽ dẫn Ngân đến nơi mình thực sự thuộc về. NCN Academy tin tưởng và đồng hành cùng bạn trên hành trình ý nghĩa này.",

  // Career analyses
  CAREER_1_SCIENCE: "Kinh doanh theo mạng lưới phù hợp hoàn hảo với người có chỉ số Social và Enterprising vượt trội như Ngân. Khả năng xây dựng niềm tin và lan tỏa thông điệp một cách chân thực là lợi thế cạnh tranh cốt lõi.",
  CAREER_1_TREND: "Referral Marketing và Community-based Business đang bùng nổ trong kỷ nguyên mạng xã hội. Người xây dựng được cộng đồng trung thành sẽ có nguồn thu nhập bền vững và đa dạng.",
  CAREER_1_SKILLS: "Xây dựng thương hiệu cá nhân, kỹ năng kể chuyện và tạo nội dung, quản lý mạng lưới đối tác, đàm phán và chốt hợp tác, đo lường và tối ưu hóa chuyển đổi.",

  CAREER_2_SCIENCE: "Trainer kỹ năng mềm là lựa chọn tối ưu cho Ngân: kết hợp giữa đam mê truyền đạt, khả năng kết nối cảm xúc và tư duy sáng tạo trong thiết kế trải nghiệm học tập. Đây là nơi Ngân có thể sống đúng nhất với bản thân.",
  CAREER_2_TREND: "Thị trường đào tạo kỹ năng mềm tại Việt Nam đang tăng trưởng 25-30% mỗi năm. Trainer freelance và content creator giáo dục đang có thu nhập từ 15-50 triệu đồng mỗi tháng.",
  CAREER_2_SKILLS: "Thiết kế chương trình đào tạo theo mô hình ADDIE, kỹ năng thuyết trình và facilitation, xây dựng nội dung học tập đa phương tiện, đánh giá hiệu quả đào tạo.",

  CAREER_3_SCIENCE: "",
  CAREER_3_TREND: "",
  CAREER_3_SKILLS: "",

  CAREER_4_SCIENCE: "",
  CAREER_4_TREND: "",
  CAREER_4_SKILLS: "",

  CAREER_5_SCIENCE: "",
  CAREER_5_TREND: "",
  CAREER_5_SKILLS: "",

  // Weaknesses
  WEAKNESS_1_TITLE: "Hội chứng khởi đầu liên tục",
  WEAKNESS_1_DESC: "Ngân dễ bị cuốn vào sự kích thích của các ý tưởng mới, dẫn đến việc bắt đầu nhiều dự án nhưng ít hoàn thành trọn vẹn. Để vượt qua điều này, hãy áp dụng quy tắc Một Việc tại Một Thời Điểm và luôn hoàn thành ít nhất 80% mục tiêu hiện tại trước khi chuyển sang cái mới.",
  WEAKNESS_2_TITLE: "Nhạy cảm với phê bình",
  WEAKNESS_2_DESC: "Với trái tim nghệ sĩ, Ngân có thể cảm thấy tổn thương khi nhận phản hồi tiêu cực, dù chúng có tính xây dựng. Hãy tập thói quen hỏi ngược lại Góc nhìn này giúp tôi cải thiện điều gì thay vì phản ứng cảm xúc tức thì.",
  WEAKNESS_3_TITLE: "Quản lý thời gian phi tuyến",
  WEAKNESS_3_DESC: "Ngân có xu hướng hoạt động theo cảm hứng hơn là lịch cố định. Điều này tốt cho sáng tạo nhưng gây khó khăn trong công việc đòi hỏi kỷ luật cao. Hãy xây dựng một hệ thống Time Blocking tối giản nhưng nhất quán.",

  // Risk (override from payload)
  RISK_SHORT_TERM: "Trong 6 tháng tới: Thực hành nguyên tắc Hoàn thành hơn Hoàn hảo bằng cách đặt ra deadline nghiêm ngặt. Tập phản hồi với những lời phê bình bằng câu hỏi: Điều này giúp tôi làm tốt hơn ở điểm nào?",
  RISK_LONG_TERM: "Trong 2 năm: Thiết lập hệ thống quản lý thời gian cá nhân. Học cách duy trì động lực ngay cả khi công việc lặp đi lặp lại và trở nên nhàm chán.",

  // Environment
  IDEAL_ENVIRONMENT: "Không gian làm việc cởi mở, đề cao sự sáng tạo, có sự tương tác con người thường xuyên. Ngân phát huy tốt nhất trong môi trường cho phép tự chủ cao, có mục tiêu ý nghĩa rõ ràng và được ghi nhận đóng góp cá nhân.",
  TOXIC_ENVIRONMENT: "Môi trường quan liêu, khuôn khổ cứng nhắc, thiếu không gian sáng tạo và thiếu sự kết nối người với người. Văn hóa cạnh tranh nội bộ khốc liệt hoặc lãnh đạo độc đoán sẽ bóp nghẹt tiềm năng của Ngân.",

  // Org fit
  MNC_FIT: "62%",
  MNC_DESC: "Phù hợp ở mức trung bình. Tập đoàn đa quốc gia mang lại sự ổn định và quy trình bài bản, nhưng có thể hạn chế sự tự do sáng tạo và tốc độ ra quyết định mà Ngân cần.",
  SOLO_FIT: "91%",
  SOLO_DESC: "Rất phù hợp. Ngân có đầy đủ tố chất của một doanh nhân độc lập: tư duy sáng tạo, kỹ năng kết nối mạng lưới và khả năng xây dựng thương hiệu cá nhân mạnh mẽ.",
  STARTUP_FIT: "87%",
  STARTUP_DESC: "Phù hợp cao. Môi trường startup linh hoạt, đòi hỏi đa nhiệm và chú trọng tốc độ chính là sân chơi tự nhiên của Ngân. Đặc biệt phù hợp với các startup trong lĩnh vực EdTech, Community hay Social Impact.",
  PUBLIC_FIT: "35%",
  PUBLIC_DESC: "Ít phù hợp. Cơ chế làm việc và thăng tiến của khối nhà nước chưa tạo đủ điều kiện để Ngân phát huy tối đa sự linh hoạt và tư duy sáng tạo vốn có.",

  // Skill pillars
  PILLAR_1_TITLE: "Kỹ năng Xây dựng Cộng đồng & Mạng lưới",
  PILLAR_1_DESC: "Đây là chìa khóa cốt lõi cho cả Kinh doanh Referral lẫn Trainer. Ngân cần thành thạo nghệ thuật tạo dựng niềm tin, nuôi dưỡng mối quan hệ dài hạn và biến những người quen biết trở thành những người ủng hộ trung thành.",
  PILLAR_2_TITLE: "Kỹ năng Kể chuyện & Truyền thông",
  PILLAR_2_DESC: "Kết hợp sức sáng tạo với khả năng đồng cảm, Ngân cần phát triển khả năng kể chuyện thu hút qua nhiều kênh: viết lách, video, diễn thuyết. Đây là vũ khí mạnh nhất trong thế giới kinh tế nội dung hiện nay.",
  PILLAR_3_TITLE: "Kỹ năng Quản lý Dự án & Tự Kỷ luật",
  PILLAR_3_DESC: "Để chuyển hóa ý tưởng thành kết quả thực tế, Ngân cần xây dựng hệ thống làm việc có cấu trúc. Học cách chia nhỏ mục tiêu lớn, theo dõi tiến độ và duy trì nhất quán sẽ nhân đôi hiệu quả công việc.",
  // ── Prep-grid items: Học nghề (vocational track) ─────────────────────────
  // TOP 1 — Nhân viên thực thi tổng hợp / Tâm lý học Ứng dụng
  TOP1_KIENTHUC: '<li>Tâm lý học cơ bản & hành vi con người</li><li>Kỹ năng giao tiếp chuyên nghiệp</li><li>Quản lý cảm xúc & stress</li>',
  TOP1_KYNANG:   '<li>Lắng nghe tích cực & thấu hiểu</li><li>Tổ chức & theo dõi công việc</li><li>Giao tiếp đa chiều hiệu quả</li>',
  TOP1_LOTRINH:  '<li>Khóa học nghề ngắn hạn 3–6 tháng</li><li>Học việc tại cơ sở tâm lý / tư vấn</li><li>Thực hành tại công ty ngay sau khóa</li>',
  TOP1_VIECLEM:  '<li>Nhân viên thực thi / Trợ lý bộ phận</li><li>Nhân viên hành chính & hỗ trợ</li><li>Nhân viên kinh doanh nội bộ</li>',

  // TOP 2 — Kinh doanh cộng đồng & Referral Marketing
  TOP2_KIENTHUC: '<li>Nguyên lý marketing cộng đồng</li><li>Tâm lý người mua & hành vi khách hàng</li><li>Nền tảng mạng xã hội & nội dung số</li>',
  TOP2_KYNANG:   '<li>Xây dựng thương hiệu cá nhân</li><li>Kể chuyện & tạo nội dung hấp dẫn</li><li>Quản lý mạng lưới đối tác & khách hàng</li>',
  TOP2_LOTRINH:  '<li>Khóa học Referral/Community Marketing (2–4 tháng)</li><li>Thực chiến: xây fanpage & nhóm cộng đồng</li><li>Tham gia chương trình affiliate thực tế</li>',
  TOP2_VIECLEM:  '<li>Affiliate Marketer độc lập</li><li>Community Sales Leader</li><li>Brand Ambassador / Referral Coordinator</li>',

  // TOP 3 — Nhân viên thực thi tổng hợp / Quản trị Nhân sự
  TOP3_KIENTHUC: '<li>Quy trình tuyển dụng & onboarding cơ bản</li><li>Luật lao động căn bản</li><li>Đánh giá tính cách & năng lực nhân sự</li>',
  TOP3_KYNANG:   '<li>Phỏng vấn & đánh giá ứng viên</li><li>Xây dựng văn hóa doanh nghiệp</li><li>Kỹ năng tư vấn & hỗ trợ nhân viên</li>',
  TOP3_LOTRINH:  '<li>Khóa học nghề HR ngắn hạn 3–6 tháng</li><li>Thực tập tại phòng nhân sự doanh nghiệp</li><li>Học việc vị trí Trợ lý HR</li>',
  TOP3_VIECLEM:  '<li>Nhân viên thực thi nhân sự</li><li>Trợ lý tuyển dụng</li><li>Nhân viên hành chính nhân sự</li>',

  // TOP 4 — Trainer kỹ năng mềm & Facilitator workshop
  TOP4_KIENTHUC: '<li>Tâm lý học học tập & phát triển con người</li><li>Mô hình thiết kế đào tạo (ADDIE cơ bản)</li><li>Công cụ trình bày & facilitation</li>',
  TOP4_KYNANG:   '<li>Thuyết trình & trình bày thu hút</li><li>Thiết kế hoạt động nhóm & game hóa</li><li>Đánh giá phản hồi & cải tiến nội dung</li>',
  TOP4_LOTRINH:  '<li>Khóa học Trainer/Facilitator 3–6 tháng</li><li>Co-train / hỗ trợ Trainer kinh nghiệm</li><li>Tự tổ chức mini workshop (10–20 người)</li>',
  TOP4_VIECLEM:  '<li>Trainer Freelance kỹ năng mềm</li><li>Facilitator workshop nội bộ</li><li>Life Skills Coach & Content Creator giáo dục</li>',

  // TOP 5 — Nhân viên thực thi tổng hợp / Môi trường & Năng lượng Xanh
  TOP5_KIENTHUC: '<li>Kiến thức nền môi trường & năng lượng tái tạo</li><li>Quy trình vận hành xanh cơ bản</li><li>Truyền thông cộng đồng & CSR</li>',
  TOP5_KYNANG:   '<li>Tuyên truyền & vận động cộng đồng xanh</li><li>Quản lý dự án CSR nhỏ</li><li>Kỹ năng báo cáo & theo dõi dự án</li>',
  TOP5_LOTRINH:  '<li>Khóa học nghề môi trường ngắn hạn 3–6 tháng</li><li>Thực tập tại doanh nghiệp năng lượng xanh</li><li>Tham gia dự án CSR cộng đồng thực tế</li>',
  TOP5_VIECLEM:  '<li>Nhân viên thực thi môi trường</li><li>Trợ lý bộ phận năng lượng xanh</li><li>Nhân viên kinh doanh sản phẩm xanh</li>',
};

// ── Payload data ─────────────────────────────────────────────────────────────
const data = {
  "HOTEN": "Pham Thi Ngan (Test)",
  "EMAIL": "tuvanhuongnghiepchonnguoi@gmail.com",
  "DIEN_THOAI": "0856724313",
  "NGAY_SINH": "05/12/1990",
  "MA_SO_HO_SO": "NCN-5504",
  "NGAY_XUAT_BAN": "5/7/2026",
  "R_PCT": 26.666666666666668,
  "I_PCT": 46.666666666666664,
  "A_PCT": 100,
  "S_PCT": 100,
  "E_PCT": 100,
  "C_PCT": 7.5,
  "MBTI": "ENFP",
  "LIFEPATH": 9,
  "SOUL": 7,
  "MISSION": 4,
  "TALENT": 5,
  "PASSION": "1 & 2 & 5",
  "HOLLAND": "ASE",
  "RISK_NOW": "Ngay trong học kỳ này: Nguy cơ cả thèm chóng chán, bắt đầu nhiều việc nhưng bỏ dở giữa chừng. Cần tập trung hoàn thành dứt điểm 1-2 mục tiêu quan trọng nhất trước khi bắt đầu cái mới.",
  "TOP1_TITLE": "Kinh doanh cộng đồng & Referral Marketing",
  "TOP1_NICHE": "Kinh doanh cộng đồng & Referral Marketing",
  "TOP1_REF": "Quản trị & Marketing",
  "TOP1_FIELD": "Học nghề / Ứng tuyển trực tiếp — Quản trị & Marketing",
  "TOP1_ICI": 89.13,
  "TOP1_ICI_DETAIL": "Id:86.3 · Ni:90.6 · Mk:97.9",
  "TOP1_SUBJECTS": "Học nghề Kinh doanh cộng đồng & Referral Marketing",
  "TOP1_KNOWLEDGE": "NGHỀ HỌC: Kinh doanh cộng đồng & Referral Marketing\nLĩnh vực: Quản trị & Marketing\nHình thức học: Khóa học nghề ngắn hạn (3–6 tháng) · Học việc tại cơ sở · Thực hành tại công ty\nVị trí việc làm: Affiliate Marketer · Đại lý / Nhà phân phối độc lập · Community Sales Leader · Brand Ambassador · Referral Program Coordinator",
  "TOP1_ADVICE": "Học nghề Kinh doanh cộng đồng & Referral Marketing — ra nghề ngay sau 3–6 tháng, không cần bằng Đại học.",
  "TOP2_TITLE": "Trainer kỹ năng mềm & Facilitator workshop",
  "TOP2_NICHE": "Trainer kỹ năng mềm & Facilitator workshop",
  "TOP2_REF": "Giáo dục & Đào tạo",
  "TOP2_FIELD": "Học nghề / Ứng tuyển trực tiếp — Giáo dục & Đào tạo",
  "TOP2_ICI": 87.83,
  "TOP2_ICI_DETAIL": "Id:83.2 · Ni:100 · Mk:86.2",
  "TOP2_SUBJECTS": "Học nghề Trainer kỹ năng mềm & Facilitator workshop",
  "TOP2_KNOWLEDGE": "NGHỀ HỌC: Trainer kỹ năng mềm & Facilitator workshop\nLĩnh vực: Giáo dục & Đào tạo\nHình thức học: Khóa học nghề ngắn hạn (3–6 tháng) · Thực hành trực tiếp\nVị trí việc làm: Trainer Freelance · Facilitator workshop · Corporate Trainer entry · Life Skills Coach · YouTuber / TikToker giáo dục",
  "TOP2_ADVICE": "Trainer kỹ năng mềm là con đường phù hợp nhất với tính cách ENFP của Ngân — truyền cảm hứng và tạo thay đổi thực sự.",
  "TOP3_TITLE": "(Cần bổ sung)",
  "TOP3_NICHE": "(Cần bổ sung)",
  "TOP3_REF": "",
  "TOP3_FIELD": "",
  "TOP3_ICI": 0,
  "TOP3_ICI_DETAIL": "",
  "TOP3_SUBJECTS": "",
  "TOP3_KNOWLEDGE": "",
  "TOP3_ADVICE": "",
  "TOP4_TITLE": "(Cần bổ sung)",
  "TOP4_NICHE": "(Cần bổ sung)",
  "TOP4_REF": "",
  "TOP4_FIELD": "",
  "TOP4_ICI": 0,
  "TOP4_ICI_DETAIL": "",
  "TOP4_SUBJECTS": "",
  "TOP4_KNOWLEDGE": "",
  "TOP4_ADVICE": "",
  "TOP5_TITLE": "(Cần bổ sung)",
  "TOP5_NICHE": "(Cần bổ sung)",
  "TOP5_REF": "",
  "TOP5_FIELD": "",
  "TOP5_ICI": 0,
  "TOP5_ICI_DETAIL": "",
  "TOP5_SUBJECTS": "",
  "TOP5_KNOWLEDGE": "",
  "TOP5_ADVICE": ""
};

// ── Merge all data ────────────────────────────────────────────────────────────
const fullData = { ...data, ...aiTexts };

async function generatePDF() {
  console.log('📄 Đang đọc template...');
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  // Replace all {{PLACEHOLDER}} with actual values
  html = html.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
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
}

generatePDF().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
