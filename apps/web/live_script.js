// ============================================================================
// IKIGAI ENGINE — Universal Layered Architecture v5.0
// Giám đốc Kiến trúc Thuật toán EdTech
//
//  ICI = (S_identity × 0.60) + (S_niche × 0.25) + (S_market × 0.15)
//
//  S_identity = LP×0.25 + Soul×0.10 + Mission×0.30 + Talent×0.25 + Passion×0.10
//
//  VÒNG 1 — Bản ngã Tố chất Nhân số học   (1001 → TOP 20)
//  VÒNG 2 — Định vị Môi trường & Hành vi  (20   → TOP 10)
//            ↳ RIASEC Hexagon Penalty
//            ↳ MBTI Compatibility
//            ↳ Ikigai Talent Bonus (SPEECH / STRATEGY / CRAFT)
//            ↳ Dream Alignment + Holland Cross-check (+20)
//  VÒNG 3 — Tối ưu Xu hướng & Dòng tiền  (10   → TOP 5 )
//            ↳ Theory/Language Penalty (×0.60)
//            ↳ Diversity Guard (≤2 ngành cùng industry)
// ============================================================================
// =========================================================================
// 🔥 CẤU HÌNH HẠ TẦNG ĐÁM MÂY FIREBASE THỰC TẾ CỦA BẠN
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDXYwk4_lfXDGp3L8wcUt9NEdduNsGl_t4",
  authDomain: "nghechonnguoi-f9eec.firebaseapp.com",
  projectId: "nghechonnguoi-f9eec",
  storageBucket: "nghechonnguoi-f9eec.firebasestorage.app",
  messagingSenderId: "803032497022",
  appId: "1:803032497022:web:bb8c7869c77c439c14912f",
  measurementId: "G-0XDEKKR2WG"
};

// Khởi tạo các phân hệ đám mây (Giữ nguyên phần code khởi tạo phía dưới)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();  // 🗄️ Khởi tạo Firestore để lưu dữ liệu khách hàng
// LẮNG NGHE TRẠNG THÁI TÀI KHOẢN (TỰ ĐỘNG ĐÓNG/MỞ KHÓA WEBAPP)
auth.onAuthStateChanged((user) => {
  const authView = document.getElementById("auth-container");
  if (user) {
    // Nếu đã đăng nhập thành công -> Ẩn màn hình khóa đi để làm bài test
    authView.classList.add("hidden");
    console.log("Đã kết nối tài khoản khách hàng:", user.email);

    // Tự động điền email của người dùng vào form nếu hòm thư đang trống
    if (document.getElementById("customerEmail")) {
      document.getElementById("customerEmail").value = user.email;
    }
  } else {
    // Nếu chưa đăng nhập hoặc đã bấm đăng xuất -> Hiện lại màn hình khóa
    authView.classList.remove("hidden");
  }
});

// Hàm xử lý Đăng nhập nhanh bằng Google Pop-up
async function handleGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    // Đăng nhập thành công — onAuthStateChanged tự xử lý UI
  } catch (error) {
    // Người dùng tự đóng popup → bỏ qua, không hiện thông báo lỗi
    if (error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request') {
      return;
    }
    // Trình duyệt chặn popup → tự động chuyển sang redirect
    if (error.code === 'auth/popup-blocked') {
      try {
        await auth.signInWithRedirect(provider);
      } catch (redirectError) {
        alert('Không thể đăng nhập Google. Vui lòng thử Email/Mật khẩu.');
      }
      return;
    }
    // Các lỗi khác → hiện thông báo rõ ràng
    alert('Lỗi đăng nhập Google: ' + error.message);
  }
}

// Hàm xử lý Đăng ký tài khoản Email mới
async function handleEmailRegister() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  if (!email || !password) { alert("Vui lòng nhập đủ Email và Mật khẩu!"); return; }

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Tạo tài khoản thành công! Bạn có thể làm bài test ngay bây giờ.");
  } catch (error) {
    alert("Lỗi đăng ký: " + error.message);
  }
}

// Hàm xử lý Đăng nhập Email truyền thống
async function handleEmailLogin() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  if (!email || !password) { alert("Vui lòng nhập đủ Email và Mật khẩu!"); return; }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert("Đăng nhập thành công!");
  } catch (error) {
    alert("Sai mật khẩu hoặc tài khoản chưa đăng ký: " + error.message);
  }
}

// Hàm đăng xuất (Gọi hàm này khi muốn khóa hệ thống lại)
function handleLogout() {
  auth.signOut().then(() => {
    location.reload();
  });
}
// ─── TRẠNG THÁI TOÀN CỤC ────────────────────────────────────────────────────
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};

// ─── KHỞI ĐỘNG SAU KHI DOM LOAD ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profile-form");
  if (!profileForm) return;

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentProfile = {
      fullName:  document.getElementById("fullName").value.trim(),
      birthDate: document.getElementById("birthDate").value.trim(),
      email:     document.getElementById("customerEmail").value.trim(),
      phone:     document.getElementById("customerPhone").value.trim(),
      // Điểm số không thu thập nữa — để mặc định 0 cho thuật toán
      thptScores: { toan: 0, van: 0, anh: 0, ly: 0, hoa: 0, sinh: 0, su: 0, dia: 0, gdcd: 0 },
      gpa: 0,
      gpaFileName: null,
      dgnl: { hsa: 0, hcm: 0 },
      languageCertification: { type: '', score: '' }
    };

    localStorage.setItem("active_student_profile", JSON.stringify(studentProfile));

    // 🗄️ Lưu thông tin khách hàng lên Firestore (không block luồng quiz)
    db.collection("customers").add({
      fullName:  studentProfile.fullName,
      birthDate: studentProfile.birthDate,
      email:     studentProfile.email,
      phone:     studentProfile.phone,
      uid:       firebase.auth().currentUser?.uid || null,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.warn("Firestore save warning:", err));

    // 📧 Tự động subscribe email vào Mailchimp list (không block luồng quiz)
    if (studentProfile.email) {
      subscribeToMailchimp(studentProfile.email, studentProfile.fullName);
    }

    document.getElementById("profile-container").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");
    startQuizEngine();
  });
});

// ─── MAILCHIMP EMAIL MARKETING INTEGRATION ───────────────────────────────────
// Dùng JSONP endpoint — không cần backend, không cần API key trong code
function subscribeToMailchimp(email, fullName) {
  const firstName = (fullName || '').split(' ').pop(); // Lấy tên (từ cuối)

  const MC_URL = 'https://github.us16.list-manage.com/subscribe/post-json'
    + '?u=630590139fc72edbf5d6bf957'
    + '&id=9b70639067'
    + '&f_id=00a158e2f0'
    + `&EMAIL=${encodeURIComponent(email)}`
    + `&FNAME=${encodeURIComponent(firstName)}`
    + '&c=_mcjsCallback';

  // Callback nhận kết quả từ Mailchimp
  window._mcjsCallback = function(data) {
    if (data.result === 'success') {
      console.log('✅ Mailchimp: Đã thêm subscriber thành công');
    } else {
      // Không báo lỗi ra UI — subscriber có thể đã tồn tại
      console.info('ℹ️ Mailchimp note:', data.msg);
    }
    // Dọn sạch
    const s = document.getElementById('_mc_jsonp');
    if (s) s.remove();
    delete window._mcjsCallback;
  };

  // Xóa script cũ nếu còn
  const old = document.getElementById('_mc_jsonp');
  if (old) old.remove();

  // Kích hoạt JSONP request
  const script = document.createElement('script');
  script.id = '_mc_jsonp';
  script.src = MC_URL;
  document.head.appendChild(script);
}


// ─── NẠP VÀ CHẠY CÂU HỎI ────────────────────────────────────────────────────
async function startQuizEngine() {
  try {
    const res = await fetch("data/questions.json");
    const data = await res.json();

    // Gộp Holland + MBTI + Ikigai
    questions = [
      ...(data.holland_questions || []),
      ...(data.mbti_questions || []),
      ...(data.ikigai_questions || [])
    ];

    currentQuestionIndex = 0;
    userAnswers = {};

    // Cập nhật tổng số câu hỏi động (tránh hardcode trong HTML)
    const totalQEl = document.getElementById('total-q');
    if (totalQEl) totalQEl.innerText = questions.length;

    displayQuestion();

  } catch (err) {
    console.error("Lỗi nạp câu hỏi:", err);
    document.getElementById("question-content").innerText =
      "Không thể tải câu hỏi. Vui lòng kiểm tra file data/questions.json!";
  }
}

// ─── HIỂN THỊ TỪNG CÂU HỎI ───────────────────────────────────────────────────
function displayQuestion() {
  if (!questions.length) return;

  const q = questions[currentQuestionIndex];
  const pct = (currentQuestionIndex / questions.length) * 100;

  document.getElementById("current-q").innerText = currentQuestionIndex + 1;
  document.getElementById("progress-fill").style.width = `${pct}%`;

  // Hỗ trợ cả 2 trường `text` (Holland/MBTI) và `question` (Ikigai)
  const questionText = q.text || q.question || "";
  document.getElementById("question-content").innerText =
    `${currentQuestionIndex + 1}. ${questionText}`;

  const container = document.getElementById("options-space");
  container.innerHTML = "";

  // --- Phân loại hiển thị đáp án ---
  if (q.type === "ikigai_dream") {
    // Câu tự luận ước mơ — textarea
    const ta = document.createElement("textarea");
    ta.id = "ikigai-dream-input";
    ta.rows = 3;
    ta.placeholder = "Nhập ước mơ nghề nghiệp của bạn...";
    ta.style.cssText =
      "width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;" +
      "font-size:15px;resize:none;margin-bottom:12px;box-sizing:border-box;";

    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.style.fontWeight = "600";
    btn.innerText = "➔ Xác nhận & Tiếp tục";
    btn.onclick = () => {
      const val = ta.value.trim() || "(Không điền)";
      handleSelectOption(q.id, val);
    };

    container.appendChild(ta);
    container.appendChild(btn);

  } else if (q.type === "ikigai_talent") {
    // Câu tài năng — thang 5 mức
    [
      { val: 1, text: "1 — Rất yếu / Chưa bao giờ làm tốt điều này" },
      { val: 2, text: "2 — Dưới trung bình / Còn nhiều hạn chế" },
      { val: 3, text: "3 — Trung bình / Bình thường như mọi người" },
      { val: 4, text: "4 — Khá tốt / Tự tin & được ghi nhận" },
      { val: 5, text: "5 — Rất mạnh / Đây là điểm vượt trội rõ ràng của tôi" }
    ].forEach(lvl => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.innerText = lvl.text;
      btn.onclick = () => handleSelectOption(q.id, lvl.val);
      container.appendChild(btn);
    });

  } else if (q.type === "ikigai_choice") {
    // Câu chọn giá trị / môi trường / điểm mạnh / né tránh — chọn 1 trong N
    (q.options || []).forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.style.textAlign = "left";
      btn.innerText = opt.text;
      btn.onclick = () => handleSelectOption(q.id, opt.value);
      container.appendChild(btn);
    });

  } else if (q.id?.includes("_M") || q.dimension) {
    // MBTI — A/B: hiển thị nội dung đầy đủ, tách từ dấu " / "
    const parts = (q.text || "").split(" / ");
    const optA = parts[0] ? parts[0].replace(/^.*\(A\)\s*/, "").trim() : "Đáp án A";
    const optB = parts[1] ? parts[1].replace(/\s*\(B\)\s*/, "").trim() : "Đáp án B";
    [
      { val: "A", text: "A — " + optA },
      { val: "B", text: "B — " + optB }
    ].forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.style.cssText = "font-weight:500;text-align:left;";
      btn.innerText = opt.text;
      btn.onclick = () => handleSelectOption(q.id, opt.val);
      container.appendChild(btn);
    });

  } else {
    // Holland — Likert 1-5
    [
      { val: 1, text: "1 - Hoàn toàn không đúng / Không thích" },
      { val: 2, text: "2 - Ít khi đúng / Hơi thích" },
      { val: 3, text: "3 - Vừa phải / Trung hòa" },
      { val: 4, text: "4 - Khá đúng / Thích" },
      { val: 5, text: "5 - Hoàn toàn chính xác / Rất đam mê" }
    ].forEach(lvl => {
      const btn = document.createElement("button");
      btn.className = "btn-option";
      btn.innerText = lvl.text;
      btn.onclick = () => handleSelectOption(q.id, lvl.val);
      container.appendChild(btn);
    });
  }
}

// ─── XỬ LÝ ĐÁP ÁN ───────────────────────────────────────────────────────────
function handleSelectOption(qId, value) {
  userAnswers[qId] = value;
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    displayQuestion();
  } else {
    finishQuiz();
  }
}

// ─── KẾT THÚC TRẮC NGHIỆM ────────────────────────────────────────────────────
function finishQuiz() {
  document.getElementById("progress-fill").style.width = "100%";
  localStorage.setItem("user_quiz_answers", JSON.stringify(userAnswers));
  console.log("=== HOÀN THÀNH KHẢO SÁT ===", userAnswers);

  document.getElementById("question-content").innerText =
    "🎉 Chúc mừng! Toàn bộ hồ sơ & câu trả lời đã được đóng gói.";

  document.getElementById("options-space").innerHTML = `
    <p style="text-align:center;color:#4a5568;margin-bottom:15px;">
      Hệ thống đang chuẩn bị phân tích...
    </p>
    <button class="btn-primary" onclick="generateReportUI()">
      Xem Kết Quả Định Vị Ikigai &amp; Nguyện Vọng Ngay ➔
    </button>`;
}

// ============================================================================
//  BỘ NÃO THUẬT TOÁN v5.0 — UNIVERSAL LAYERED ARCHITECTURE
//  ICI = (S_identity × 0.60) + (S_niche × 0.25) + (S_market × 0.15)
//
//  S_identity = LP×0.25 + Soul×0.10 + Mission×0.30 + Talent×0.25 + Passion×0.10
//  VÒNG 1 — Bản ngã Tố chất Nhân số học   (1001 → TOP 20)
//  VÒNG 2 — Định vị Môi trường & Hành vi  (20   → TOP 10)
//            ↳ RIASEC Hexagon Penalty (dist=3 → ×0.20; dist=2 → ×0.70)
//            ↳ MBTI Compatibility Score
//            ↳ Ikigai Talent Bonus: CRAFT (+15/×0.30), SPEECH/STRATEGY (+15/+5)
//            ↳ Dream + Holland Cross-check (+20 full / +8 partial)
//  VÒNG 3 — Tối ưu Xu hướng & Dòng tiền  (10   → TOP 5 )
//            ↳ Theory Penalty (×0.60 nếu lý thuyết thuần + demand<75)
//            ↳ Diversity Guard (≤2 ngành cùng industry trong TOP 5)
//            ↳ Display branching: Dưới lớp 12 / Đại học
// ============================================================================
// ============================================================================
//  PROFESSION DISPLAY ENGINE
//  4 TẦNG KHÁI NIỆM:
//    Nghề          = danh xưng nghề nghiệp (base) — "Giáo viên", "Bác sĩ", "Kỹ sư"
//    Ngách nghề    = chuyên sâu cụ thể trong nghề (niches[]) — "dạy Toán THPT & luyện thi"
//    Ngành học     = chương trình ĐH cần theo (entry.study_major) — "Sư phạm Toán"
//    Vị trí việc làm = chức danh tại doanh nghiệp (entry.niche) — "AI Product Lead"
// ============================================================================
const PROFESSION_MAP = {
  "Công nghệ Thông tin": {
    base: "Lập trình viên / Kỹ sư Phần mềm",
    niches: {
      I: ["xây dựng mô hình AI & học máy", "phân tích dữ liệu lớn", "nghiên cứu thuật toán tối ưu"],
      R: ["lập trình nhúng & điều khiển phần cứng", "quản trị hạ tầng mạng & hệ thống", "tích hợp IoT thực địa"],
      C: ["kiểm thử & đảm bảo chất lượng phần mềm", "vận hành & giám sát hệ thống 24/7", "phân tích nghiệp vụ & viết đặc tả"],
      E: ["dẫn dắt dự án công nghệ lớn", "tư vấn chuyển đổi số doanh nghiệp", "xây dựng startup công nghệ"],
      A: ["thiết kế giao diện & trải nghiệm người dùng", "phát triển game & thế giới ảo", "dựng sản phẩm sáng tạo số"],
      S: ["giảng dạy lập trình & công nghệ", "hỗ trợ người dùng & tư vấn giải pháp số", "xây dựng cộng đồng developer"],
      default: ["phát triển phần mềm ứng dụng", "bảo mật & an toàn thông tin mạng", "triển khai giải pháp AI thực tiễn"]
    },
    subjects: {
      toan: ["lập trình giải thuật & tối ưu toán học", "xây dựng mô hình dữ liệu khoa học"],
      ly: ["lập trình nhúng & điều khiển phần cứng", "thiết kế hệ thống điện tử - IoT"],
      anh: ["phát triển sản phẩm công nghệ thị trường quốc tế", "làm việc với tài liệu kỹ thuật tiếng Anh"]
    }
  },
  "Quản trị & Marketing": {
    base: "Chuyên gia Marketing / Kinh doanh",
    niches: {
      E: ["bán hàng & phát triển khách hàng B2B", "đàm phán & ký kết hợp đồng thương mại", "xây dựng mạng lưới đối tác chiến lược"],
      S: ["chăm sóc & giữ chân khách hàng", "xây dựng cộng đồng thương hiệu", "marketing truyền miệng & referral"],
      I: ["nghiên cứu thị trường & hành vi người tiêu dùng", "phân tích dữ liệu marketing (growth hacking)", "dự báo xu hướng thị trường"],
      A: ["sáng tạo nội dung thương hiệu", "kể chuyện thương hiệu (brand storytelling)", "thiết kế chiến dịch truyền thông sáng tạo"],
      C: ["lập kế hoạch marketing tổng thể & ngân sách", "vận hành quy trình bán hàng có hệ thống", "kiểm soát hiệu suất chiến dịch theo KPI"],
      default: ["chạy quảng cáo & marketing số (Facebook/Google)", "quản lý thương hiệu doanh nghiệp", "phát triển sản phẩm & thị trường mới"]
    },
    subjects: {
      toan: ["phân tích dữ liệu marketing & đo lường ROI", "định giá & tối ưu chi phí chiến dịch"],
      van: ["viết content marketing & copywriting", "kể chuyện thương hiệu bằng ngôn từ"],
      anh: ["marketing quốc tế & thương mại điện tử toàn cầu", "làm việc với thương hiệu nước ngoài"]
    }
  },
  "Y Dược & Sức khỏe": {
    base: "Bác sĩ / Nhân viên Y tế",          // Fallback chung
    bases: {
      I: "Bác sĩ / Nhà nghiên cứu Lâm sàng",
      S: "Điều dưỡng viên / Nhân viên Chăm sóc Sức khỏe",
      R: "Kỹ thuật viên Y tế / Chuyên viên Phục hồi chức năng",
      C: "Dược sĩ / Chuyên viên Kiểm định Dược",
      E: "Quản lý Bệnh viện / Doanh nhân Y tế"
    },
    niches: {
      I: ["chẩn đoán & điều trị bệnh lý chuyên sâu", "nghiên cứu lâm sàng & phát triển phác đồ điều trị", "ứng dụng công nghệ y tế tiên tiến"],
      S: ["chăm sóc toàn diện sức khỏe bệnh nhân", "tư vấn sức khỏe phòng ngừa cho cộng đồng", "đồng hành cùng bệnh nhân mạn tính"],
      R: ["thực hiện phẫu thuật & thủ thuật can thiệp", "vật lý trị liệu & phục hồi chức năng vận động", "kỹ thuật xét nghiệm & chẩn đoán hình ảnh"],
      C: ["kiểm định thuốc & dược phẩm lưu hành", "quản lý hệ thống hồ sơ y tế & tuân thủ quy trình", "kiểm soát chất lượng dịch vụ y tế"],
      E: ["quản lý phòng khám & bệnh viện tư nhân", "phát triển sản phẩm y tế & thiết bị số", "tư vấn chiến lược sức khỏe cho doanh nghiệp"],
      default: ["khám & điều trị bệnh lý thường gặp", "pha chế & tư vấn sử dụng thuốc", "điều dưỡng & chăm sóc người bệnh"]
    },
    subjects: {
      hoa: ["pha chế dược phẩm & kiểm soát chất lượng thuốc", "nghiên cứu phát triển hợp chất sinh học mới"],
      sinh: ["nghiên cứu bệnh lý cấp độ tế bào & phân tử", "phát triển vaccine & liệu pháp sinh học"],
      toan: ["phân tích thống kê nghiên cứu lâm sàng", "mô hình hóa dịch tễ học & y tế cộng đồng"]
    }
  },
  "Kinh tế & Tài chính": {
    base: "Chuyên gia Tài chính / Kế toán",

    // ── PHÂN BIỆT các dạng TƯ VẤN TÀI CHÍNH & KINH TẾ bằng COMBO HOLLAND ──
    //  S+I : Tư vấn Tài chính Cá nhân / Wealth Manager (đồng hành + phân tích)
    //  I+C : Nhà Kinh tế học / Phân tích Rủi ro (hàn lâm, mô hình)
    //  E+I : Tư vấn Đầu tư / Investment Banker (kinh doanh + phân tích)
    //  C+I : Kế toán Kiểm toán / CFO (hệ thống + phân tích)
    //  E+S : Tư vấn Tài chính Doanh nghiệp / M&A (thuyết phục + con người)
    combos: {
      "SI": "Tư vấn Tài chính Cá nhân / Wealth Manager",
      "IS": "Nhà Kinh tế học / Chuyên gia Phân tích Tài chính",
      "EI": "Tư vấn Đầu tư / Investment Banker",
      "IE": "Chuyên gia Fintech / Phân tích Đầu tư Quốc tế",
      "CI": "Kế toán Kiểm toán / Chuyên gia Tài chính Doanh nghiệp",
      "IC": "Nhà Kinh tế học Nghiên cứu / Chuyên gia Chính sách Kinh tế",
      "EC": "Tư vấn Tài chính Doanh nghiệp / CFO",
      "CE": "Chuyên gia Kiểm toán / Quản trị Rủi ro Tài chính",
      "SC": "Tư vấn Bảo hiểm & Kế hoạch Tài chính Gia đình",
      "ES": "Tư vấn Tài chính Doanh nghiệp / M&A Advisor"
    },

    bases: {
      S: "Tư vấn Tài chính Cá nhân",         // Đồng hành, gần gũi khách hàng
      E: "Chuyên gia Đầu tư / Tư vấn Doanh nghiệp",
      I: "Nhà Kinh tế học / Chuyên gia Phân tích",
      C: "Kế toán / Kiểm toán viên",
      A: "Chuyên gia Fintech / Thiết kế Sản phẩm Tài chính"
    },

    niches: {
      C: ["kiểm toán báo cáo tài chính doanh nghiệp", "xây dựng hệ thống kế toán quản trị nội bộ", "tuân thủ thuế & pháp lý tài chính"],
      I: ["định giá tài sản & phân tích đầu tư", "mô hình hóa rủi ro tài chính & bảo hiểm", "nghiên cứu chính sách kinh tế vĩ mô"],
      E: ["tư vấn M&A & đầu tư doanh nghiệp", "quản lý danh mục đầu tư & quỹ", "phát triển sản phẩm fintech"],
      S: ["tư vấn kế hoạch tài chính cá nhân & gia đình", "chăm sóc khách hàng dịch vụ ngân hàng bán lẻ", "bán & tư vấn sản phẩm bảo hiểm nhân thọ"],
      default: ["lập & phân tích báo cáo tài chính doanh nghiệp", "đầu tư chứng khoán & tài sản tài chính", "thẩm định & kiểm soát tín dụng ngân hàng"]
    },

    nichesByCombo: {
      "SI": ["xây dựng kế hoạch tài chính dài hạn cho cá nhân & gia đình", "quản lý tài sản & danh mục đầu tư cá nhân (Wealth Management)"],
      "EI": ["tư vấn mua bán & sáp nhập doanh nghiệp (M&A)", "phân tích định giá & cơ hội đầu tư tăng trưởng"],
      "CI": ["kiểm toán độc lập & đảm bảo báo cáo tài chính minh bạch", "xây dựng hệ thống kiểm soát nội bộ & quản trị rủi ro"],
      "SC": ["tư vấn bảo hiểm nhân thọ & kế hoạch tích lũy dài hạn", "đồng hành 1-1 giúp gia đình an tâm tài chính"]
    },

    subjects: {
      toan: ["xây dựng mô hình định lượng tài chính", "tối ưu danh mục đầu tư theo thuật toán"],
      anh: ["làm việc với thị trường tài chính & nhà đầu tư quốc tế", "phân tích báo cáo tài chính doanh nghiệp nước ngoài"]
    }
  },
  "Kỹ thuật & Công nghệ": {
    base: "Kỹ sư Cơ khí / Điện / Tự động hóa",
    niches: {
      R: ["thiết kế & gia công chi tiết cơ khí chính xác", "lắp đặt & vận hành dây chuyền sản xuất tự động", "bảo trì & sửa chữa hệ thống điện công nghiệp"],
      I: ["nghiên cứu vật liệu tiên tiến & nano", "tối ưu quy trình hóa học & phản ứng công nghiệp", "phát triển giải pháp năng lượng tái tạo mới"],
      C: ["kiểm soát chất lượng sản phẩm theo tiêu chuẩn ISO", "quản lý chuỗi cung ứng & kho vận công nghiệp", "thanh tra an toàn lao động & môi trường nhà máy"],
      E: ["điều hành dự án xây dựng công trình kỹ thuật", "tư vấn giải pháp kỹ thuật cho doanh nghiệp sản xuất", "phát triển startup trong lĩnh vực công nghiệp"],
      default: ["thiết kế & chế tạo máy móc thiết bị", "lập trình & vận hành robot công nghiệp", "thiết kế hệ thống điện – điều khiển tự động hóa"]
    },
    subjects: {
      toan: ["tính toán kết cấu & mô phỏng hệ thống kỹ thuật", "tối ưu hóa quy trình sản xuất"],
      ly: ["thiết kế hệ thống cơ - điện - nhiệt ứng dụng", "phân tích vật lý kết cấu công trình"],
      hoa: ["phát triển vật liệu composite & polymer kỹ thuật", "kiểm soát quy trình hóa học công nghiệp"]
    }
  },
  "Nghệ thuật & Sáng tạo": {
    base: "Nghệ sĩ / Nhà Thiết kế",
    niches: {
      A: ["thiết kế nhận diện thương hiệu & bao bì sản phẩm", "vẽ minh họa & sáng tác concept art", "chụp ảnh & dàn dựng hình ảnh thương mại"],
      E: ["điều hành studio sáng tạo & agency thiết kế", "kinh doanh tác phẩm nghệ thuật & IP sáng tạo", "xây dựng thương hiệu nghệ sĩ & phân phối tác phẩm"],
      S: ["dùng nghệ thuật để trị liệu & chữa lành tâm lý", "giảng dạy mỹ thuật & kỹ năng sáng tạo", "tổ chức nghệ thuật cộng đồng & triển lãm"],
      I: ["nghiên cứu lịch sử mỹ thuật & phê bình nghệ thuật", "bảo tồn di vật & quản lý bộ sưu tập bảo tàng", "phân tích xu hướng thẩm mỹ & thiết kế thương mại"],
      R: ["thiết kế in ấn & sản xuất vật liệu nghệ thuật", "chế tác thủ công mỹ nghệ & nghệ thuật sắp đặt", "kỹ thuật số & xử lý hình ảnh chuyên nghiệp"],
      default: ["thiết kế đồ họa & hình ảnh thương mại", "biểu diễn & sáng tác nghệ thuật", "tạo nội dung sáng tạo đa nền tảng"]
    }
  },
  "Giáo dục & Đào tạo": {
    base: "Giáo viên / Nhà đào tạo",   // Fallback nếu không tìm được combo

    // ── PHÂN BIỆT 5 NGHỀ BẰNG COMBO HOLLAND TOP1+TOP2 ────────────────────
    //  GIÁO VIÊN: S thuần (dạy học sinh K-12, trường phổ thông)
    //  GIẢNG VIÊN: I+S hoặc I thuần (giảng đại học, nghiên cứu)
    //  NHÀ ĐÀO TẠO: E+S hoặc E thuần (đào tạo người lớn, doanh nghiệp)
    //  HUẤN LUYỆN VIÊN: E+R hoặc R+E (coaching hiệu suất, kết quả thực chiến)
    //  CHUYÊN VIÊN TƯ VẤN: S+I, S+C, C+S (đồng hành 1-1, hướng nghiệp, không lên lớp)
    combos: {
      // GIÁO VIÊN (S top1, không có E cao)
      "SS": "Giáo viên / Nhà giáo dục",
      "SA": "Giáo viên Nghệ thuật & Sáng tạo",
      "SR": "Giáo viên Thực hành & Kỹ thuật",
      "SC": "Giáo viên / Chuyên viên Giáo dục Thẩm lượng",
      // GIẢNG VIÊN (Đại học / Nghiên cứu)
      "IS": "Giảng viên / Nhà Nghiên cứu Giáo dục",
      "SI": "Giảng viên / Nhà Nghiên cứu Giáo dục",
      "IC": "Giảng viên Đại học / Chuyên gia Phát triển Chương trình",
      "IA": "Giảng viên Sáng tạo / Nghiên cứu Mỹ thuật",
      // NHÀ ĐÀO TẠO (doanh nghiệp, kỹ năng, người lớn)
      "ES": "Nhà đào tạo / Facilitator Doanh nghiệp",
      "SE": "Nhà đào tạo / Hướng nghiệp Nghề nghiệp",
      "EI": "Nhà đào tạo / Chuyên gia Phát triển Năng lực",
      "EA": "Nhà đào tạo Sáng tạo / Trainer Nội dung",
      "EC": "Nhà đào tạo / Quản lý Chương trình Đào tạo",
      // HUẤN LUYỆN VIÊN (coaching hiệu suất, thực chiến)
      "ER": "Huấn luyện viên / Performance Coach",
      "RE": "Huấn luyện viên Nghề / Kỹ năng Thực hành",
      "RS": "Đào tạo viên Nghề Thực hành",
      // CHUYÊN VIÊN TƯ VẤN / HƯỚNG NGHIỆP (1-1, không lên lớp)
      "CS": "Chuyên viên Hướng nghiệp & Tư vấn Nghề nghiệp",
      "CI": "Chuyên viên Kiểm định & Phát triển Chương trình Học",
      "CE": "Quản lý Giáo dục & Điều hành Nhà trường"
    },

    bases: {
      S: "Giáo viên",                           // Thuần S: giáo viên phổ thông
      E: "Nhà đào tạo / Huấn luyện viên Doanh nghiệp",
      I: "Giảng viên Đại học / Nhà Nghiên cứu Giáo dục",
      A: "Giáo viên Nghệ thuật & Sáng tạo",
      C: "Chuyên viên Quản lý Giáo dục",
      R: "Đào tạo viên Nghề Thực hành"
    },

    // Ngách theo TừNG NGHỀ riêng biệt
    niches: {
      // GIÁO VIÊN (S thuần): gần gũi học sinh, lớp học, cảm xúc
      S: ["giảng dạy môn học chính quy tại trường phổ thông", "xây dựng môi trường học tập tích cực & an toàn cảm xúc", "hỗ trợ học sinh có nhu cầu đặc biệt & tìm kiếm riêng"],
      // NHÀ ĐÀO TẠO (E): doanh nghiệp, kết quả đo lường, người lớn
      E: ["đào tạo kỹ năng lãnh đạo & quản lý cho doanh nghiệp", "huấn luyện đội ngũ kinh doanh & bán hàng đạt target", "thiết kế & triển khai chương trình đào tạo nội bộ (L&D)"],
      // GIẢNG VIÊN ĐH (I): hàn lâm, nghiên cứu, chuyên sâu
      I: ["giảng dạy & nghiên cứu chuyên ngành bậc đại học", "phát triển chương trình giảng dạy & tài liệu học thuật", "hướng dẫn nghiên cứu sinh & thực hiện công trình khoa học"],
      // GIÁO VIÊN NGHỆ THUẤT (A)
      A: ["dạy mỹ thuật, âm nhạc & kỹ năng sáng tạo", "đào tạo diễn xuất, MC & kỹ năng biểu diễn", "giảng dạy thiết kế & thời trang"],
      // CHUYÊN VIÊN QUẢN LÝ (C): hệ thống, kiểm định, điều hành
      C: ["quản lý giáo dục & điều hành nhà trường", "kiểm định & đánh giá chất lượng chương trình học", "thiết kế hệ thống đào tạo & quy trình chuẩn hóa"],
      // ĐÀO TẠO VIÊN NGHỀ (R): thực hành, tay nghề
      R: ["đào tạo nghề thực hành (bếp, thẩm mỹ, kỹ thuật, thủ công)", "giảng dạy kỹ năng tay nghề tại trường nghề & trung tâm", "kết hợp giỏi nghề & có sứ mệnh truyền đạt — dạy online & offline"],
      default: ["truyền đạt kiến thức chuyên môn", "đào tạo kỹ năng mềm & phát triển bản thân", "hướng dẫn định hướng nghề nghiệp"]
    },

    // Ngách theo combos (hiển thị khi tìm được combo)
    nichesByCombo: {
      // GIÁO VIÊN
      "SA": ["dạy mỹ thuật, âm nhạc & năng khiếu sáng tạo", "giáo dục đạo đức thẩm mỹ & cảm thụ nghệ thuật"],
      "SR": ["dạy kỹ thuật thực hành & môn học thực nghiệm", "giáo dục hướng nghiệp phổ thông"],
      // GIẢNG VIÊN
      "IS": ["giảng dạy & nghiên cứu chuyên ngành", "hướng dẫn luận văn & nghiên cứu sinh", "phát triển giáo trình & chương trình học thuật"],
      "SI": ["giảng dạy đại học kết hợp nghiên cứu cộng đồng", "phát triển chương trình học có tính ứng dụng xã hội"],
      // NHÀ ĐÀO TẠO
      "ES": ["đào tạo kỹ năng lãnh đạo & văn hóa doanh nghiệp", "thiết kế workshop & chương trình phát triển nhân viên", "hướng nghiệp và định vị nghề nghiệp cho người lớn"],
      "SE": ["đào tạo kỹ năng nghề nghiệp & tư vấn việc làm", "hướng dẫn chuyển đổi nghề & lộ trình sự nghiệp"],
      "EI": ["phát triển năng lực nhân sự cấp cao", "thiết kế chương trình đào tạo căn cứ dữ liệu & bằng chứng"],
      // HUẤN LUYỆN VIÊN
      "ER": ["coaching hiệu suất & đạt target bán hàng", "huấn luyện thể lực & kỹ năng thực chiến", "có mặt hiện trường để dẫn dắt & cải thiện ngay"],
      "RE": ["dạy nghề & làm mẫu thực hành trực tiếp", "huấn luyện kỹ năng tay nghề có thể đo lường kết quả"],
      // CHUYÊN VIÊN TƯ VẤN HƯỚNG NGHIỆP
      "CS": ["tư vấn lỹ lịch sự nghiệp & kế hoạch hướng nghiệp", "đồng hành 1-1 xây dựng định hướng nghề rõ ràng"],
      "SC": ["tư vấn học đường & phát triển toàn diện học sinh", "hỗ trợ học sinh xây dựng lộ trình học tập rõ ràng"]
    },

    subjects: {
      toan: ["dạy Toán cấp THPT & luyện thi đại học", "đào tạo tư duy logic & giải toán nâng cao"],
      anh: ["dạy Tiếng Anh giao tiếp & luyện thi IELTS/TOEIC", "đào tạo kỹ năng tiếng Anh học thuật & công sở"],
      van: ["dạy Ngữ văn & kỹ năng viết sáng tạo", "đào tạo kỹ năng diễn đạt & thuyết trình"],
      ly: ["dạy Vật Lý & thực hành thí nghiệm khoa học", "đào tạo tư duy phân tích vật lý ứng dụng"],
      hoa: ["dạy Hóa Học & thí nghiệm thực hành", "đào tạo kiến thức hóa học ứng dụng cuộc sống"],
      sinh: ["dạy Sinh học & khoa học tự nhiên", "đào tạo kiến thức sức khỏe & sinh học ứng dụng"],
      su: ["dạy Lịch sử & giáo dục công dân", "đào tạo tư duy phản biện & kiến thức xã hội"],
      dia: ["dạy Địa lý & giáo dục môi trường", "đào tạo kiến thức địa lý kinh tế - xã hội"],
      gdcd: ["dạy Giáo dục Công dân & pháp luật", "đào tạo kỹ năng sống & giá trị sống cho học sinh"]
    }
  },
  "Tâm lý học ứng dụng": {
    base: "Chuyên gia Tâm lý / Tham vấn viên",

    // ── PHÂN BIỆT các dạng TƯ VẤN TÂM LÝ & COACHING bằng COMBO HOLLAND ──
    //  S+I : Tham vấn tâm lý lâm sàng (sâu sắc, chẩn đoán)
    //  S+A : Life Coach / Khai vấn (cảm hứng, sáng tạo, đồng hành)
    //  E+S : Tư vấn Tâm lý Tổ chức / Executive Coach
    //  S+E : Tư vấn Phát triển Bản thân & Nghề nghiệp
    //  I+S : Nhà Tâm lý học Nghiên cứu & Chẩn đoán Lâm sàng
    combos: {
      "SI": "Tham vấn viên Tâm lý / Nhà Trị liệu Tâm lý",
      "IS": "Nhà Tâm lý học / Chuyên gia Chẩn đoán Lâm sàng",
      "SA": "Life Coach / Khai vấn Phát triển Bản thân",
      "AS": "Nhà Trị liệu Sáng tạo / Art Therapist",
      "ES": "Tư vấn viên Tâm lý Tổ chức / Executive Coach",
      "SE": "Tư vấn Phát triển Nghề nghiệp & Hiệu suất Cá nhân",
      "EI": "Tư vấn Chiến lược Nhân sự & Lãnh đạo",
      "IC": "Chuyên gia Đánh giá Tâm lý & Xây dựng Công cụ Đo lường",
      "SC": "Tham vấn viên Học đường & Sức khỏe Tâm thần"
    },

    bases: {
      S: "Tham vấn viên Tâm lý",             // Quan tâm cá nhân, đồng hành
      I: "Nhà Tâm lý học / Chuyên gia Lâm sàng",  // Hàn lâm, chẩn đoán
      E: "Tư vấn Tâm lý Tổ chức / Executive Coach",
      A: "Life Coach / Khai vấn Sáng tạo",
      C: "Chuyên gia Đánh giá Tâm lý"
    },

    niches: {
      S: ["tham vấn tâm lý cá nhân & hỗ trợ cảm xúc", "làm việc với học sinh gặp khủng hoảng tâm lý học đường", "đồng hành trị liệu cho người trải qua sang chấn"],
      I: ["đánh giá tâm lý & chẩn đoán lâm sàng", "nghiên cứu hành vi, nhận thức & cảm xúc người", "thiết kế công cụ đánh giá & trắc nghiệm tâm lý"],
      E: ["coaching phát triển lãnh đạo & hiệu suất", "tư vấn tâm lý tổ chức & văn hóa doanh nghiệp", "đào tạo & diễn thuyết về phát triển bản thân"],
      A: ["trị liệu thông qua nghệ thuật, âm nhạc & kịch", "dùng hoạt động sáng tạo để phục hồi cảm xúc", "thiết kế chương trình trị liệu phi truyền thống"],
      default: ["tham vấn tâm lý cho cá nhân & gia đình", "hỗ trợ sức khỏe tâm thần & phòng ngừa rối loạn", "coaching & khai vấn phát triển bản thân"]
    },

    nichesByCombo: {
      "SI": ["trị liệu tâm lý cá nhân & đồng hành thoát khỏi sang chấn", "tư vấn mối quan hệ & đời sống gia đình"],
      "IS": ["chẩn đoán tâm lý lâm sàng & xây dựng lộ trình trị liệu", "nghiên cứu hành vi & thiết kế công cụ trắc nghiệm"],
      "SA": ["khai vấn hướng dẫn cá nhân khám phá mục đích sống", "đồng hành chuyển đổi cuộc đời & sự nghiệp (Life Transition Coach)", "huấn luyện tư duy tích cực & phát triển tiềm năng bản thân"],
      "ES": ["coaching hiệu suất nhân sự & văn hóa công ty", "tư vấn tâm lý quản lý stress & burnout tại doanh nghiệp"],
      "SE": ["tư vấn phát triển sự nghiệp & định vị bản thân", "có mặt trên sân khấu để truyền cảm hứng và chia sẻ"]
    }
  },
  "Truyền thông đa phương tiện": {
    base: "Nhà báo / Người làm truyền thông",
    niches: {
      A: ["sản xuất nội dung video & podcast sáng tạo", "quay phim, chụp ảnh & dựng phim tài liệu", "thiết kế đồ họa truyền thông & infographic"],
      E: ["quản lý quan hệ công chúng (PR) cho thương hiệu", "xây dựng & điều hành kênh mạng xã hội doanh nghiệp", "tổ chức sự kiện truyền thông & press tour"],
      S: ["viết phóng sự xã hội & điều tra", "làm truyền thông cho tổ chức phi lợi nhuận & NGO", "kết nối cộng đồng qua nội dung báo chí"],
      I: ["phân tích dữ liệu & đo lường hiệu quả truyền thông", "nghiên cứu dư luận & xu hướng thông tin đại chúng", "viết về khoa học & công nghệ cho công chúng"],
      default: ["viết báo & phóng sự thời sự", "sản xuất & biên tập nội dung số đa nền tảng", "xây dựng thương hiệu cá nhân qua truyền thông"]
    }
  },
  "Hành chính & Dịch vụ Công": {
    base: "Cán bộ Nhà nước / Chuyên viên Hành chính",
    niches: {
      C: ["xử lý hồ sơ & thủ tục hành chính công", "quản lý văn bản & lưu trữ công vụ", "kiểm soát ngân sách & tài chính công"],
      S: ["trực tiếp tiếp dân & giải quyết khiếu nại", "tham gia ngoại giao nhân dân & giao lưu quốc tế", "công tác xã hội & hỗ trợ cộng đồng yếu thế"],
      E: ["lãnh đạo đơn vị hành chính cấp địa phương", "xây dựng & trình bày chính sách phát triển vùng", "đại diện cơ quan nhà nước trong đàm phán quốc tế"],
      I: ["nghiên cứu & đề xuất cải cách chính sách công", "phân tích dữ liệu kinh tế - xã hội phục vụ hoạch định", "triển khai chính phủ số & dịch vụ công trực tuyến"],
      default: ["thực thi chính sách & pháp luật nhà nước", "phục vụ người dân qua dịch vụ hành chính công", "quản lý & điều phối hoạt động của đơn vị nhà nước"]
    }
  },
  "Du lịch & Khách sạn": {
    base: "Chuyên gia Du lịch / Quản lý Khách sạn",
    niches: {
      S: ["đón tiếp & dẫn đường cho khách du lịch quốc tế", "chăm sóc trải nghiệm khách lưu trú cao cấp", "xây dựng tour & gói dịch vụ cá nhân hóa"],
      E: ["quản lý toàn bộ hoạt động khách sạn & resort", "phát triển sản phẩm du lịch & ký kết đối tác lữ hành", "kinh doanh & Marketing điểm đến du lịch"],
      A: ["thiết kế không gian khách sạn boutique & thẩm mỹ", "tạo nội dung du lịch cho mạng xã hội & travel blog", "xây dựng trải nghiệm du lịch văn hóa độc đáo"],
      R: ["hướng dẫn du lịch sinh thái, trekking & mạo hiểm", "điều hành tour du lịch nông nghiệp & thực địa", "quản lý hoạt động thể thao mặt nước & dã ngoại"],
      default: ["hướng dẫn & đưa đón khách du lịch", "quản lý lễ tân & dịch vụ lưu trú", "lập kế hoạch & điều phối tour du lịch"]
    }
  },
  "Quản trị Nhân sự": {
    base: "Chuyên gia Nhân sự (HR)",
    niches: {
      S: ["tìm kiếm, phỏng vấn & tuyển dụng nhân tài phù hợp", "thiết kế chương trình đào tạo & phát triển nhân viên", "xây dựng văn hóa gắn kết & phúc lợi đội ngũ"],
      E: ["tham mưu chiến lược nhân sự cho ban lãnh đạo", "tái cơ cấu & tối ưu hóa mô hình tổ chức doanh nghiệp", "dẫn dắt chuyển đổi văn hóa doanh nghiệp"],
      I: ["phân tích dữ liệu nhân sự & dự báo nhu cầu nhân lực", "nghiên cứu mô hình tổ chức & hành vi nhân viên", "xây dựng hệ thống đánh giá hiệu suất (KPI/OKR)"],
      C: ["quản lý hợp đồng lao động & tuân thủ pháp lý", "xây dựng hệ thống lương thưởng & đãi ngộ cạnh tranh", "vận hành phần mềm quản lý HR & tự động hóa quy trình"],
      default: ["tuyển dụng & onboarding nhân viên mới", "đào tạo & nâng cao năng lực đội ngũ", "quản lý quan hệ lao động & giải quyết tranh chấp"]
    }
  },
  "Khoa học Tự nhiên & Nghiên cứu": {
    base: "Nhà nghiên cứu / Khoa học gia",
    niches: {
      I: ["thiết kế thí nghiệm & kiểm chứng giả thuyết khoa học", "phân tích dữ liệu nghiên cứu & công bố học thuật quốc tế", "xây dựng mô hình lý thuyết & mô phỏng tính toán"],
      R: ["thực hiện thí nghiệm lab & điều chế hợp chất", "nghiên cứu đặc tính vật liệu & sinh vật", "vận hành thiết bị khoa học chuyên biệt"],
      C: ["kiểm định & đảm bảo chất lượng kết quả nghiên cứu", "quản lý phòng thí nghiệm & an toàn hóa chất", "biên soạn báo cáo & tài liệu khoa học chuẩn mực"],
      default: ["nghiên cứu sinh học phân tử & di truyền", "phân tích hóa học & chế tạo vật liệu mới", "ứng dụng khoa học vào giải quyết vấn đề thực tiễn"]
    },
    subjects: {
      hoa: ["tổng hợp & phân tích hợp chất hóa học", "nghiên cứu vật liệu polyme & nano"],
      sinh: ["nghiên cứu sinh học phân tử & kỹ thuật gene", "phát triển vi sinh ứng dụng & công nghệ lên men"],
      ly: ["đo lường & phân tích hiện tượng vật lý", "nghiên cứu quang học, vật lý hạt nhân & vật liệu"],
      toan: ["xây dựng mô hình toán học & thống kê khoa học", "mô phỏng số & phân tích dữ liệu lớn"]
    }
  },
  "Pháp luật & Tư pháp": {
    base: "Luật sư / Chuyên gia Pháp lý",

    // ── PHÂN BIỆT các dạng TƯ VẤN PHÁP LÝ ──
    combos: {
      "CI": "Tư vấn viên Pháp lý Doanh nghiệp / Compliance",
      "IC": "Luật sư Nghiên cứu / Chuyên gia Chính sách Pháp luật",
      "EC": "Luật sư Tranh tụng / Đàm phán Thương mại",
      "CE": "Tư vấn Pháp lý M&A / Đầu tư Quốc tế",
      "SC": "Tư vấn Pháp lý Cộng đồng / Bảo vệ Quyền lợi",
      "IS": "Luật sư Nhân quyền / Chuyên gia Pháp lý Công nghệ"
    },

    bases: {
      C: "Tư vấn viên Pháp lý",
      E: "Luật sư Tranh tụng",
      I: "Chuyên gia Nghiên cứu Pháp luật",
      S: "Luật sư Cộng đồng / Bảo vệ Quyền lợi"
    },

    niches: {
      C: ["soạn thảo & rà soát hợp đồng thương mại", "tư vấn tuân thủ pháp lý & quản trị rủi ro cho doanh nghiệp", "công chứng, chứng thực & quản lý hồ sơ pháp lý"],
      E: ["tranh tụng tại tòa án thương mại & dân sự", "tư vấn M&A, đầu tư nước ngoài & IPO", "đàm phán hòa giải & giải quyết tranh chấp"],
      I: ["nghiên cứu pháp luật so sánh & học thuật pháp lý", "xây dựng chính sách & đề xuất cải cách luật pháp", "phân tích pháp lý về công nghệ, dữ liệu & AI"],
      S: ["bảo vệ quyền lợi người lao động & yếu thế", "tư vấn pháp lý miễn phí cho cộng đồng", "tranh tụng về quyền trẻ em, phụ nữ & nhân quyền"],
      default: ["tư vấn pháp lý cho doanh nghiệp & cá nhân", "đại diện khách hàng trong vụ kiện tụng", "nghiên cứu & áp dụng pháp luật chuyên ngành"]
    }
  },
  "Thể thao & Phát triển Thể lực": {
    base: "Huấn luyện viên / Chuyên gia Thể thao",   // Fallback chung
    bases: {
      R: "Huấn luyện viên Thể thao / Vận động viên Chuyên nghiệp",
      S: "Huấn luyện viên Thể lực Cá nhân (Personal Trainer)",
      E: "Quản lý Thể thao / Nhà tổ chức Sự kiện Thể thao",
      I: "Khoa học gia Thể thao / Chuyên gia Phân tích Hiệu suất",
      A: "Vận động viên Esports / Huấn luyện viên Thể thao Điện tử",
      C: "Chuyên viên Hành chính & Quản lý Thể dục Thể thao"
    },
    niches: {
      R: ["huấn luyện vận động viên đạt thành tích thi đấu chuyên nghiệp", "thi đấu thể thao chuyên nghiệp các môn thể thao cụ thể", "thiết kế chương trình tập luyện chuyên sâu"],
      S: ["huấn luyện cá nhân (Personal Trainer) & coaching thể chất", "dạy yoga, thiền & phát triển sức khỏe toàn diện", "giảng dạy giáo dục thể chất cho học sinh"],
      E: ["tổ chức sự kiện thể thao & giải đấu lớn", "quản lý câu lạc bộ thể thao & thương hiệu vận động viên", "phát triển kinh doanh trong lĩnh vực thể thao"],
      I: ["phân tích hiệu suất tập luyện bằng dữ liệu & công nghệ", "nghiên cứu dinh dưỡng thể thao & phục hồi chấn thương", "y học thể thao & hỗ trợ y tế cho vận động viên"],
      default: ["huấn luyện & phát triển thể chất cá nhân", "dạy kỹ thuật môn thể thao cụ thể", "quản lý chương trình thể dục sức khỏe cộng đồng"]
    }
  },
  "Nông Lâm Ngư nghiệp": {
    base: "Kỹ sư Nông nghiệp / Chuyên gia Thực phẩm",
    niches: {
      R: ["trực tiếp canh tác & ứng dụng kỹ thuật trồng trọt hiện đại", "quản lý ao hồ & ứng dụng công nghệ nuôi trồng thủy sản", "bảo vệ & phát triển rừng bền vững"],
      I: ["nghiên cứu & lai tạo giống cây trồng, vật nuôi mới", "ứng dụng IoT & dữ liệu vào nông nghiệp thông minh", "phát triển công nghệ chế biến & bảo quản thực phẩm"],
      E: ["thu mua, chế biến & xuất khẩu nông sản ra thị trường quốc tế", "xây dựng startup nông nghiệp công nghệ cao", "quản lý trang trại & chuỗi cung ứng quy mô lớn"],
      C: ["kiểm tra an toàn vệ sinh thực phẩm & chứng nhận tiêu chuẩn", "quản lý kho vận & logistics nông sản", "giám sát dịch bệnh cây trồng & kiểm dịch thực vật"],
      default: ["ứng dụng công nghệ cao vào trồng trọt & chăn nuôi", "chế biến & nâng cao giá trị nông sản xuất khẩu", "kiểm soát chất lượng & an toàn vệ sinh thực phẩm"]
    }
  },
  "Môi trường & Năng lượng Xanh": {
    base: "Kỹ sư Môi trường / Chuyên gia Năng lượng Xanh",
    niches: {
      I: ["nghiên cứu giải pháp năng lượng tái tạo hiệu suất cao", "đo đạc & phân tích tác động môi trường & khí hậu", "phát triển công nghệ pin & lưu trữ năng lượng"],
      R: ["thiết kế & thi công hệ thống điện mặt trời & điện gió", "vận hành hệ thống xử lý nước thải & chất thải rắn", "lắp đặt công trình tiết kiệm năng lượng & tòa nhà xanh"],
      E: ["tư vấn chiến lược ESG & phát triển bền vững cho doanh nghiệp", "huy động đầu tư vào dự án năng lượng sạch", "phát triển thị trường carbon & tín chỉ xanh"],
      C: ["kiểm định & cấp chứng nhận tác động môi trường", "giám sát tuân thủ pháp luật bảo vệ môi trường", "đo đạc & báo cáo phát thải carbon cho doanh nghiệp"],
      default: ["thiết kế hệ thống năng lượng mặt trời & điện gió", "xử lý ô nhiễm & phục hồi môi trường tự nhiên", "tư vấn phát triển bền vững & ESG cho doanh nghiệp"]
    }
  },
  "Dịch vụ Cá nhân & Lifestyle": {
    base: "Chuyên gia Làm đẹp / Chăm sóc Lifestyle",
    niches: {
      S: ["tư vấn phong cách ăn mặc & hình ảnh cá nhân", "chăm sóc sức khỏe & wellness toàn diện", "dịch vụ đặc biệt & chăm sóc khách hàng cao cấp"],
      A: ["trang điểm nghệ thuật & sân khấu", "thiết kế & tạo kiểu tóc độc đáo", "nail art & chăm sóc móng sáng tạo"],
      E: ["kinh doanh & quản lý salon, spa, tiệm làm đẹp", "xây dựng thương hiệu cá nhân trong ngành làm đẹp", "nhượng quyền & mở rộng chuỗi dịch vụ lifestyle"],
      R: ["thực hiện kỹ thuật massage & trị liệu cơ thể chuyên sâu", "pha chế cà phê specialty & barista chuyên nghiệp", "nấu ăn & chế biến thực phẩm tinh tế"],
      default: ["tư vấn & thực hiện dịch vụ chăm sóc sắc đẹp", "hướng dẫn & cải thiện phong cách sống lành mạnh", "dịch vụ cá nhân hóa cho nhu cầu đặc biệt"]
    }
  },
  "Xây dựng & Kiến trúc": {
    base: "Kỹ sư Xây dựng / Kiến trúc sư",
    niches: {
      R: ["thiết kế kết cấu & thi công công trình dân dụng", "giám sát thi công hạ tầng giao thông & cầu đường", "quản lý an toàn & chất lượng thi công tại công trường"],
      A: ["thiết kế kiến trúc công trình ấn tượng & bền vững", "thiết kế nội thất & cảnh quan không gian sống", "phát triển ý tưởng kiến trúc xanh & thân thiện môi trường"],
      C: ["lập dự toán & kiểm soát chi phí xây dựng", "đấu thầu & quản lý hợp đồng xây dựng", "kiểm định chất lượng công trình & nghiệm thu"],
      E: ["đầu tư & phát triển dự án bất động sản", "điều hành tổng thầu công trình lớn", "tư vấn chiến lược & phát triển đô thị"],
      default: ["thiết kế & thi công công trình dân dụng", "thiết kế kiến trúc & không gian", "quản lý dự án xây dựng từ đầu đến cuối"]
    }
  },
  "Ngôn ngữ & Văn hóa": {
    base: "Chuyên gia Ngôn ngữ / Phiên dịch viên",
    niches: {
      S: ["phiên dịch liên tiếp tại hội nghị quốc tế", "giảng dạy ngoại ngữ & luyện thi ngôn ngữ quốc tế", "làm cầu nối giao tiếp ngoại giao & văn hóa"],
      I: ["nghiên cứu ngôn ngữ học & xây dựng từ điển chuyên ngành", "phát triển công nghệ xử lý ngôn ngữ tự nhiên (NLP)", "biên dịch tài liệu học thuật & pháp lý chuyên sâu"],
      E: ["quản lý chương trình giao lưu văn hóa quốc tế", "kinh doanh dịch vụ phiên dịch & biên dịch", "phát triển nội dung đa ngôn ngữ cho thị trường quốc tế"],
      A: ["biên dịch văn học & sáng tác song ngữ", "bảo tồn & truyền bá di sản văn hóa dân tộc", "biên kịch & lồng tiếng cho phim ảnh, game"],
      C: ["biên tập & hiệu đính tài liệu kỹ thuật & pháp lý", "chuẩn hóa thuật ngữ chuyên ngành đa ngôn ngữ", "quản lý cơ sở dữ liệu ngôn ngữ & bộ nhớ dịch thuật"],
      default: ["biên dịch & phiên dịch tài liệu chuyên ngành", "giảng dạy ngoại ngữ thực hành", "nghiên cứu & ứng dụng ngôn ngữ học"]
    },
    subjects: {
      anh: ["phiên dịch Anh - Việt tại hội nghị quốc tế", "dạy Tiếng Anh học thuật & luyện thi IELTS/TOEFL"],
      van: ["biên dịch tác phẩm văn học ra tiếng nước ngoài", "nghiên cứu & bảo tồn ngôn ngữ dân tộc thiểu số"]
    }
  },
  "Khác": {
    base: "Chuyên gia Liên ngành",
    niches: {
      I: ["nghiên cứu & tư vấn chính sách ở giao thoa nhiều lĩnh vực", "phân tích xu hướng tương lai & dự báo hệ thống", "ứng dụng tư duy hệ thống phức tạp vào giải quyết vấn đề"],
      E: ["lãnh đạo tổ chức phi lợi nhuận & phát triển xã hội", "tư vấn chiến lược đa lĩnh vực cho doanh nghiệp & nhà nước", "xây dựng startup giải quyết vấn đề xã hội (impact)"],
      S: ["phát triển & kết nối cộng đồng địa phương", "tư vấn & hỗ trợ thay đổi hành vi bền vững", "điều phối chương trình phúc lợi & chăm sóc xã hội"],
      A: ["thiết kế dịch vụ & trải nghiệm người dùng liên ngành", "phát triển dự án sáng tạo kết hợp nhiều lĩnh vực", "nghệ thuật tương tác & công nghệ sáng tạo số"],
      C: ["xây dựng & vận hành hệ thống quản lý đa lĩnh vực", "kiểm soát rủi ro & tuân thủ trong môi trường phức tạp", "vận hành dịch vụ & hỗ trợ quy trình tổng thể"],
      R: ["triển khai giải pháp kỹ thuật thực địa đa ngành", "bảo trì & vận hành hệ thống kỹ thuật tổng hợp", "dịch vụ thực hành trực tiếp theo nhu cầu thực tế"],
      default: ["tư vấn chiến lược ở giao điểm nhiều lĩnh vực", "quản lý dự án liên ngành phức tạp", "phát triển năng lực chuyên sâu cá nhân hóa"]
    }
  },
  // ── NGÀNH MỚI: Xu hướng 20 năm tới ──────────────────────────────────────────
  "Vũ trụ & Hàng không": {
    base: "Kỹ sư Hàng không Vũ trụ / Chuyên gia Không gian",
    bases: {
      R: "Kỹ sư Hàng không Vũ trụ / Kỹ sư UAV & Drone",
      I: "Nhà Khoa học Vũ trụ / Chuyên gia Dữ liệu Vệ tinh",
      S: "Bác sĩ Y học Hàng không / Chuyên gia Sức khỏe Phi hành",
      C: "Chuyên viên Kỹ thuật Hạ tầng Mặt đất & Vận hành Vệ tinh",
      E: "Quản lý Dự án Hàng không Vũ trụ / Doanh nhân Space Tech",
      A: "Kỹ sư Thiết kế Hệ thống Vũ trụ & Mô phỏng"
    },
    niches: {
      R: ["thiết kế kết cấu tên lửa & phương tiện phóng vũ trụ", "lập trình & vận hành hệ thống UAV/Drone thực địa", "bảo trì & kiểm định hệ thống hàng không kỹ thuật cao"],
      I: ["phân tích dữ liệu vệ tinh & viễn thám ứng dụng", "nghiên cứu vật lý thiên văn & hệ mặt trời", "xây dựng mô hình quan sát & giám sát Trái đất từ vũ trụ"],
      S: ["khám sức khỏe & đánh giá thể chất tâm lý phi hành gia", "y học hàng không & điều trị rối loạn sinh lý không trọng lực", "đào tạo & hỗ trợ sức khỏe phi hành đoàn"],
      E: ["phát triển dự án vệ tinh thương mại & định vị GPS", "kinh doanh dịch vụ dữ liệu vũ trụ & Earth Observation", "huy động đầu tư và quản lý startup Space Tech"],
      C: ["vận hành & giám sát hệ thống mặt đất vệ tinh 24/7", "kiểm định & đảm bảo chất lượng phần cứng hàng không", "quản lý dữ liệu bay & tuân thủ quy trình an toàn hàng không"],
      default: ["thiết kế & phát triển hệ thống vệ tinh ứng dụng", "vận hành UAV/Drone thực địa trong nông nghiệp & giám sát", "phân tích dữ liệu viễn thám phục vụ quy hoạch & môi trường"]
    },
    subjects: {
      toan: ["tính toán quỹ đạo vệ tinh & cơ học bay", "mô phỏng số hệ thống hàng không"],
      ly: ["vật lý hàng không & cơ học thiên thể ứng dụng", "thiết kế hệ thống động lực & nhiệt tên lửa"],
      anh: ["làm việc với tài liệu kỹ thuật hàng không tiêu chuẩn quốc tế", "hợp tác nghiên cứu vũ trụ với NASA, ESA, JAXA"]
    }
  },
  "Khoa học Thần kinh & Công nghệ Não": {
    base: "Chuyên gia Khoa học Thần kinh / Kỹ sư Não-Máy",
    bases: {
      I: "Nhà Khoa học Thần kinh Tính toán / Nghiên cứu viên Não bộ",
      R: "Kỹ sư Thần kinh học / Lập trình viên Giao diện Não-Máy (BCI)",
      S: "Bác sĩ Thần kinh học Lâm sàng / Chuyên gia Phục hồi Thần kinh",
      E: "Doanh nhân Neuroscience Tech / Quản lý Startup BCI",
      A: "Nhà thiết kế Ứng dụng Não-Máy & Giao diện Nhận thức Số"
    },
    niches: {
      I: ["nghiên cứu cơ chế học tập, trí nhớ & nhận thức của não bộ", "xây dựng mô hình AI mô phỏng mạng thần kinh sinh học", "phân tích tín hiệu EEG/fMRI & dữ liệu não bộ"],
      R: ["lập trình giao diện não-máy (BCI) thu nhận & giải mã tín hiệu não", "thiết kế thiết bị cấy ghép thần kinh & điện cực não", "phát triển phần mềm phục hồi chức năng thần kinh"],
      S: ["chẩn đoán & điều trị bệnh Alzheimer, Parkinson, động kinh", "phục hồi chức năng thần kinh cho người đột quỵ & tổn thương não", "tư vấn & hỗ trợ tâm lý thần kinh cho bệnh nhân mạn tính"],
      E: ["phát triển startup ứng dụng BCI trong giáo dục & y tế", "tư vấn chiến lược ứng dụng neuroscience cho doanh nghiệp", "huy động đầu tư cho công nghệ thần kinh đột phá"],
      A: ["thiết kế trải nghiệm tương tác điều khiển bằng sóng não", "phát triển game & nội dung học tập thích ứng não bộ", "ứng dụng neurofeedback trong nghệ thuật & sáng tạo"],
      default: ["nghiên cứu & ứng dụng khoa học thần kinh vào y tế", "phát triển công nghệ giao tiếp não-máy hỗ trợ người khuyết tật", "ứng dụng AI & dữ liệu não để cải thiện học tập & hiệu suất"]
    },
    subjects: {
      sinh: ["nghiên cứu sinh học thần kinh & cơ chế hoạt động synapse", "phân tích dữ liệu gene liên quan đến bệnh thần kinh"],
      toan: ["xây dựng mô hình toán học mạng thần kinh sinh học", "phân tích thống kê dữ liệu não bộ & tín hiệu EEG"],
      ly: ["vật lý điện sinh học & đo lường tín hiệu thần kinh", "thiết kế điện cực & thiết bị đo não"],
      anh: ["đọc tài liệu nghiên cứu thần kinh học quốc tế", "hợp tác nghiên cứu với các trung tâm neuroscience hàng đầu thế giới"]
    }
  },
  "Khoa học Sức khỏe & Y tế Cộng đồng": {
    base: "Chuyên gia Y tế Công cộng / Khoa học Sức khỏe",
    bases: {
      I: "Nhà Nghiên cứu Dịch tễ học / Khoa học gia Sức khỏe",
      S: "Chuyên gia Y tế Công cộng / Sức khỏe Cộng đồng",
      C: "Chuyên gia Dinh dưỡng Lâm sàng / Y học Nghề nghiệp",
      R: "Chuyên gia Khoa học Vận động / Sinh lý Thể dục",
      E: "Nhà Phân tích Chính sách Y tế / Chuyên gia Sức khỏe Toàn cầu"
    },
    niches: {
      I: ["điều tra & phân tích ổ dịch bệnh truyền nhiễm", "xây dựng mô hình dịch tễ học & dự báo bùng phát dịch", "nghiên cứu yếu tố nguy cơ & gánh nặng bệnh tật cộng đồng"],
      S: ["thiết kế & triển khai chương trình sức khỏe cộng đồng", "truyền thông thay đổi hành vi sức khỏe cho dân số lớn", "hỗ trợ cộng đồng yếu thế tiếp cận dịch vụ y tế"],
      C: ["tư vấn chế độ ăn & dinh dưỡng trị liệu cho bệnh nhân", "giám sát an toàn thực phẩm & vệ sinh môi trường", "quản lý hồ sơ sức khỏe & hệ thống y tế số"],
      R: ["đánh giá năng lực thể chất & thiết kế chương trình vận động phục hồi", "đo lường sinh lý vận động & tối ưu hiệu suất thể lực", "phục hồi chức năng thông qua bài tập khoa học"],
      E: ["phân tích & đề xuất cải cách chính sách y tế quốc gia", "kết nối hợp tác y tế quốc tế & quản lý dự án ODA y tế", "phát triển hệ thống giám sát sức khỏe toàn cầu One Health"],
      default: ["phòng ngừa bệnh tật & nâng cao sức khỏe cộng đồng", "kiểm soát dịch bệnh & ứng phó khủng hoảng y tế công cộng", "nghiên cứu & ứng dụng khoa học sức khỏe vào chính sách"]
    },
    subjects: {
      sinh: ["dịch tễ học bệnh truyền nhiễm & sinh học phân tử", "nghiên cứu vi sinh vật & ký sinh trùng gây bệnh"],
      hoa: ["dinh dưỡng học phân tử & hóa sinh thực phẩm", "phân tích chất độc môi trường & ô nhiễm sức khỏe"],
      toan: ["thống kê y tế & mô hình hóa dịch tễ học", "phân tích dữ liệu sức khỏe cộng đồng quy mô lớn"],
      anh: ["hợp tác nghiên cứu y tế quốc tế & công bố học thuật", "làm việc với WHO, CDC và tổ chức y tế toàn cầu"]
    }
  },
  "Công an & An ninh Quốc gia": {
    base: "Sĩ quan Cảnh sát Nhân dân",
    bases: {
      E: "Sĩ quan Cảnh sát Điều tra / Chỉ huy An ninh Trật tự",
      I: "Điều tra viên Hình sự / Chuyên gia Phân tích Tình báo",
      C: "Chuyên viên Hành chính Cảnh sát / Kinh tế Nội vụ",
      R: "Kỹ thuật viên Pháp y / Giám định Kỹ thuật Hình sự",
      S: "Cảnh sát Khu vực / Giao tiếp & Phòng ngừa Cộng đồng"
    },
    niches: {
      E: ["điều tra & xử lý vụ án hình sự phức tạp", "chỉ huy lực lượng an ninh trật tự địa bàn", "phòng chống tội phạm có tổ chức & tội phạm xuyên quốc gia"],
      I: ["điều tra tội phạm mạng & gian lận tài chính số", "phân tích tình báo & xây dựng hồ sơ tội phạm", "nghiên cứu phương thức tội phạm & đề xuất biện pháp phòng ngừa"],
      C: ["quản lý hành chính tư pháp & hồ sơ tội phạm", "kiểm soát tài chính nội bộ & phòng chống tham nhũng", "giám sát thi hành án & quản lý trại giam"],
      R: ["giám định kỹ thuật hình sự & pháp y hiện trường", "vận hành thiết bị trinh sát & kỹ thuật đặc biệt", "bảo đảm hậu cần kỹ thuật chiến đấu"],
      S: ["giao tiếp cộng đồng & hỗ trợ nạn nhân tội phạm", "tuần tra & bảo vệ an ninh khu dân cư", "phổ biến pháp luật & nâng cao ý thức cộng đồng"],
      default: ["bảo vệ an ninh trật tự & phòng ngừa tội phạm", "điều tra & xử lý vi phạm pháp luật hình sự", "thi hành pháp luật & bảo vệ quyền lợi nhân dân"]
    },
    subjects: {
      toan: ["thống kê tội phạm học & phân tích dữ liệu hình sự", "toán logic ứng dụng trong điều tra số"],
      van: ["ngữ văn pháp luật & soạn thảo văn bản tư pháp", "kỹ năng thẩm vấn & giao tiếp thuyết phục"],
      su: ["lịch sử pháp luật & hình thành lực lượng vũ trang Việt Nam", "lịch sử tội phạm học & điều tra hình sự quốc tế"],
      anh: ["tiếng Anh tình báo & tội phạm học quốc tế", "phối hợp với Interpol & cảnh sát quốc tế"]
    }
  },
  "Quân sự & Quốc phòng": {
    base: "Sĩ quan Quân đội Nhân dân Việt Nam",
    bases: {
      E: "Sĩ quan Chỉ huy / Tham mưu Tác chiến",
      R: "Kỹ sư Kỹ thuật Quân sự / Chuyên gia Vũ khí Trang bị",
      I: "Chuyên gia Tình báo Quân sự / An ninh Mạng Quân đội",
      C: "Chuyên viên Hậu cần / Quản lý Hành chính Quân sự",
      S: "Sĩ quan Chính trị / Công tác Đảng trong Quân đội"
    },
    niches: {
      E: ["chỉ huy tác chiến & lập kế hoạch chiến lược quân sự", "điều phối lực lượng & quản lý đơn vị chiến đấu", "tham gia gìn giữ hòa bình quốc tế & hợp tác quân sự song phương"],
      R: ["thiết kế & phát triển vũ khí trang bị quốc phòng", "bảo đảm kỹ thuật hệ thống vũ khí & khí tài hiện đại", "ứng dụng công nghệ quốc phòng vào lĩnh vực dân sự"],
      I: ["tác chiến không gian mạng & phòng thủ hệ thống thông tin quân sự", "phân tích tình báo & đánh giá mối đe dọa an ninh quốc gia", "nghiên cứu chiến lược quốc phòng & địa chính trị"],
      C: ["quản lý hậu cần cung ứng trang bị & vũ khí quân sự", "điều phối ngân sách & tài chính quốc phòng", "quản lý hành chính & nhân lực bộ đội"],
      S: ["công tác chính trị tư tưởng & xây dựng đoàn kết đơn vị", "tuyên truyền quốc phòng toàn dân & giáo dục lòng yêu nước", "hỗ trợ chiến sĩ & giải quyết tâm tư nguyện vọng bộ đội"],
      default: ["bảo vệ chủ quyền lãnh thổ & an ninh quốc gia", "thực hiện nhiệm vụ quân sự & huấn luyện chiến đấu", "xây dựng quân đội chính quy hiện đại"]
    },
    subjects: {
      toan: ["toán kỹ thuật & vật lý ứng dụng trong quân sự", "mô hình hóa chiến thuật & phân tích tình huống"],
      ly: ["vật lý vũ khí & đạn đạo học", "kỹ thuật điện tử & hệ thống thông tin quân sự"],
      su: ["lịch sử chiến tranh & nghệ thuật quân sự Việt Nam", "địa lý quân sự & địa chính trị quốc phòng"],
      anh: ["tiếng Anh quân sự & hợp tác quốc phòng quốc tế", "tài liệu kỹ thuật quân sự & tình báo điện tử"]
    }
  }
};




/**
 * Trả về { profession, nicheStr } cá nhân hóa theo profile người dùng
 * @param {string} industry - Ngành của nghề
 * @param {Object} hPct - Điểm Holland % của người dùng {R, I, A, S, E, C}
 * @param {Object} thptScores - Điểm các môn THPT
 * @param {string} ikigaiStrength - Câu trả lời Ikigai điểm mạnh
 */
function getProfessionDisplay(industry, hPct, thptScores, ikigaiStrength, mbtiCode) {
  const profMap = PROFESSION_MAP[industry || ''];
  if (!profMap) return { profession: null, nicheStr: '' };

  // 1. Xác định Holland top1 và top2 của user
  const sortedH = Object.entries(hPct || {}).sort((a, b) => b[1] - a[1]);
  const userTopH  = sortedH[0]?.[0] || 'S';
  const userTop2H = sortedH[1]?.[0] || 'S';
  let comboKey  = userTopH + userTop2H;

  // 1b. MBTI Override — Extraverted (E) users prefer Trainer over Teacher,
  //     Executive Coach over Counselor trong cùng Holland combo
  //  Lý do: Holland S+A cho ra "Giáo viên Nghệ thuật" (phù hợp ISFJ/INFJ)
  //          nhưng ENFP/ENFJ cần "Nhà đào tạo / Trainer" (E-dominant careers)
  if (mbtiCode && mbtiCode.includes('E') && profMap.combos) {
    // Các combo Teacher/Counselor/Giảng viên thuần — cần override nếu user là E
    const INTROVERTED_COMBOS = new Set(['SS','SA','SR','SC','RS','CS','IS','SI','IC','IA']);
    if (INTROVERTED_COMBOS.has(comboKey)) {
      // Thử E + top2Holland (EA, ES, EC...) → nếu có trong combos thì dùng
      const tryCombo1 = 'E' + userTop2H; // e.g. EA, ES, EC
      const tryCombo2 = userTop2H + 'E'; // e.g. AE, SE
      const tryCombo3 = 'E' + userTopH;  // e.g. ES, EI
      if (profMap.combos[tryCombo1])      comboKey = tryCombo1;
      else if (profMap.combos[tryCombo2]) comboKey = tryCombo2;
      else if (profMap.combos[tryCombo3]) comboKey = tryCombo3;
      else if (profMap.combos['ES'])      comboKey = 'ES'; // safe fallback → Nhà đào tạo
    }
  }

  // 2. Ưu tiên combo top1+top2 → phân biệt chính xác 5 nghề đào tạo
  let professionName;
  if (profMap.combos && profMap.combos[comboKey]) {
    professionName = profMap.combos[comboKey];
  } else if (profMap.bases && profMap.bases[userTopH]) {
    professionName = profMap.bases[userTopH];
  } else {
    professionName = profMap.base;
  }

  // 3. Xác định nichePool và strengthNiches — tách biệt để tránh near-duplicate
  const hasComboMatch = !!(profMap.nichesByCombo && profMap.nichesByCombo[comboKey]);
  let nichePool;
  let strengthNiches = [];

  if (hasComboMatch) {
    // Khi có combo match chính xác → dùng nichesByCombo, KHÔNG mix strengthNiches
    // (tránh near-duplicate giữa nichesByCombo và niches[sH] cùng chủ đề)
    nichePool = profMap.nichesByCombo[comboKey];
  } else {
    // Fallback: dùng niches[userTopH] và bổ sung Ikigai strength nếu khác chiều
    nichePool = profMap.niches?.[userTopH] || profMap.niches?.default || [];
    const STRENGTH_HOLLAND = {
      COMMUNICATE: 'E', ANALYZE: 'I', CREATE: 'A',
      ORGANIZE: 'C', EMPATHIZE: 'S'
    };
    if (ikigaiStrength && STRENGTH_HOLLAND[ikigaiStrength]) {
      const sH = STRENGTH_HOLLAND[ikigaiStrength];
      if (sH !== userTopH && profMap.niches?.[sH]) {
        strengthNiches = profMap.niches[sH].slice(0, 1);
      }
    }
  }

  // 4. Nếu nichePool ngắn (<3), bổ sung từ niches[userTopH] để đủ 3 ngách
  let fillPool = [];
  if (nichePool.length < 3) {
    const fillSource = profMap.niches?.[userTopH] || profMap.niches?.default || [];
    fillPool = fillSource.filter(n => !nichePool.includes(n));
  }

  // 5. Kết hợp: nichePool → strength (nếu fallback) → fill → loại trùng chính xác → tối đa 3
  const combined = [...new Set([...nichePool, ...strengthNiches, ...fillPool])].slice(0, 3);

  // 7. professionName đã xác định ở bước 2 (combo → bases → base)
  const nicheStr = combined.length > 0 ? ` (${combined.join(', ')})` : '';
  return { profession: professionName, nicheStr };
}

async function generateReportUI() {
  const profile = JSON.parse(localStorage.getItem("active_student_profile"));
  const answers = JSON.parse(localStorage.getItem("user_quiz_answers"));

  if (!profile || !answers) {
    alert("Không tìm thấy dữ liệu. Vui lòng làm lại từ đầu!");
    return;
  }

  try {
    const res = await fetch('data/careers_matrix.json?v=' + new Date().getTime());
    const database = await res.json();
    const careers = database.careers || [];

    // ══════════════════════════════════════════════════════════════════════════
    //  PHÂN HỆ A — NHÂN SỐ HỌC PYTHAGORAS
    //  Tính 5 chỉ số: Tiềm năng, Khát vọng, Sứ mệnh, Tài năng, Đam mê
    // ══════════════════════════════════════════════════════════════════════════

    // Bảng chuyển đổi chữ cái tiếng Anh sang số (Pythagoras)
    const LETTER_MAP = {
      A: 1, J: 1, S: 1, B: 2, K: 2, T: 2, C: 3, L: 3, U: 3,
      D: 4, M: 4, V: 4, E: 5, N: 5, W: 5, F: 6, O: 6, X: 6,
      G: 7, P: 7, Y: 7, H: 8, Q: 8, Z: 8, I: 9, R: 9
    };
    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

    // Chuẩn hóa tên tiếng Việt → ký tự Latin hoa
    const toLatinUpper = (text) => {
      const VM = {
        A: 'ÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ',
        E: 'ÉÈẺẼẸÊẾỀỂỄỆ',
        I: 'ÍÌỈĨỊ',
        O: 'ÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ',
        U: 'ÚÙỦŨỤƯỨỪỬỮỰ',
        Y: 'ÝỲỶỸY',
        D: 'Đ'
      };
      let s = text.toUpperCase();
      for (const base in VM)
        for (const c of VM[base])
          s = s.split(c).join(base);
      return s.replace(/[^A-Z\s]/g, '');
    };

    // Rút gọn số — giữ số chủ 11, 22, 33 nếu keepMaster = true
    const reduceNum = (n, keepMaster = false) => {
      while (n > 9) {
        if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
        n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
      }
      return n;
    };

    // — Tiềm năng (Lifepath): toàn bộ chữ số ngày/tháng/năm sinh —
    const allDigits = profile.birthDate.replace(/\D/g, '').split('').map(Number);
    const dayDigits = (profile.birthDate.split('/')[0] || '').replace(/\D/g, '').split('').map(Number);
    const lifepathNum = reduceNum(allDigits.reduce((a, b) => a + b, 0), true);
    const talentNum = reduceNum(dayDigits.reduce((a, b) => a + b, 0));

    // — Sứ mệnh, Khát vọng, Đam mê: từ họ tên đầy đủ —
    const latinName = toLatinUpper(profile.fullName);
    let soulRaw = 0, missionRaw = 0, letterFreq = {};

    latinName.split(' ').forEach(word => {
      for (const ch of word) {
        const v = LETTER_MAP[ch];
        if (!v) continue;
        missionRaw += v;
        letterFreq[v] = (letterFreq[v] || 0) + 1;
        if (VOWELS.has(ch)) soulRaw += v;
      }
    });

    const soulNum = reduceNum(soulRaw, true);   // Khát vọng / Linh hồn
    const missionNum = reduceNum(missionRaw, true); // Sứ mệnh

    // Đam mê: tất cả số xuất hiện NHIỀU NHẤT trong tên (có thể nhiều hơn 1 nếu đồng hạng)
    const maxLetterFreq = Object.keys(letterFreq).length
      ? Math.max(...Object.values(letterFreq))
      : 0;
    const passionNums = maxLetterFreq > 0
      ? Object.keys(letterFreq)
        .filter(k => letterFreq[k] === maxLetterFreq)
        .map(Number)
        .sort((a, b) => a - b)   // Sắp xếp tăng dần để hiển thị đẹp
      : [5];

    // 4 key đơn tra num_mapping + trọng số (Passion tính riêng bên dưới)
    const NUM_KEYS = [
      String(lifepathNum), // Tiềm năng  ×0.25
      String(soulNum),     // Khát vọng  ×0.10
      String(missionNum),  // Sứ mệnh    ×0.30
      String(talentNum),   // Tài năng   ×0.25
    ];
    const NUM_W = [0.25, 0.10, 0.30, 0.25]; // Tổng 4 chỉ số = 0.90; Passion bù 0.10

    // ══════════════════════════════════════════════════════════════════════════
    //  PHÂN HỆ B — HOLLAND & MBTI
    // ══════════════════════════════════════════════════════════════════════════
    const MBTI_MAP = {
      Q_M1: { A: 'E', B: 'I' }, Q_M2: { A: 'E', B: 'I' }, Q_M3: { A: 'E', B: 'I' },
      Q_M4: { A: 'S', B: 'N' }, Q_M5: { A: 'S', B: 'N' }, Q_M6: { A: 'S', B: 'N' },
      Q_M7: { A: 'T', B: 'F' }, Q_M8: { A: 'T', B: 'F' }, Q_M9: { A: 'T', B: 'F' },
      Q_M10: { A: 'J', B: 'P' }, Q_M11: { A: 'J', B: 'P' }, Q_M12: { A: 'J', B: 'P' }
    };
    const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

    // Khoảng cách hexagon RIASEC (tối đa 3)
    const hollandDistance = (a, b) => {
      const ia = RIASEC_ORDER.indexOf(a);
      const ib = RIASEC_ORDER.indexOf(b);
      if (ia < 0 || ib < 0) return 0;
      const diff = Math.abs(ia - ib);
      return Math.min(diff, 6 - diff);
    };

    let hScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    let hCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    let mbtiDim = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    for (const qId in answers) {
      const val = answers[qId];
      if (MBTI_MAP[qId]) {
        if (MBTI_MAP[qId][val]) mbtiDim[MBTI_MAP[qId][val]]++;
      } else if (!qId.includes('IKIGAI')) {
        const cat = qId.replace(/Q_([RIASEC]).*/, '$1');
        if (hScores[cat] !== undefined) {
          hScores[cat] += parseInt(val) || 0;
          hCounts[cat]++;
        }
      }
    }

    // % Holland (0–100); fallback nếu chưa làm
    let hPct = {};
    let isHollandEmpty = true;
    for (const cat in hScores) {
      hPct[cat] = (hScores[cat] / (hCounts[cat] * 5 || 1)) * 100;
      if (hScores[cat] > 0) isHollandEmpty = false;
    }
    if (isHollandEmpty) hPct = { R: 25, I: 40, A: 85, S: 90, E: 75, C: 35 };

    const mbtiCode = [
      mbtiDim.E >= mbtiDim.I ? 'E' : 'I',
      mbtiDim.S >= mbtiDim.N ? 'S' : 'N',
      mbtiDim.T >= mbtiDim.F ? 'T' : 'F',
      mbtiDim.J >= mbtiDim.P ? 'J' : 'P'
    ].join('');

    const sortedHolland = Object.entries(hPct).sort((a, b) => b[1] - a[1]);
    const userTop1Holland = sortedHolland[0][0];
    const userTop2Holland = sortedHolland[1][0];

    // ══════════════════════════════════════════════════════════════════════════
    //  PHÂN HỆ C — IKIGAI TALENT (Q_IKIGAI_TALENT_1 / _2 / _3)
    //  SPEECH=1 (ngôn từ), STRATEGY=2 (chiến lược/tâm lý), CRAFT=3 (thực hành)
    // ══════════════════════════════════════════════════════════════════════════
    const ikigaiTalent = {
      SPEECH: parseInt(answers["Q_IKIGAI_TALENT_1"]) || 3,
      STRATEGY: parseInt(answers["Q_IKIGAI_TALENT_2"]) || 3,
      CRAFT: parseInt(answers["Q_IKIGAI_TALENT_3"]) || 3
    };
    const dreamText = (answers["Q_IKIGAI_DREAM"] || "").toLowerCase().trim();

    // ── Regex phân loại đặc tính ngành nghề ────────────────────────────────
    const RE_CRAFT_DOMAIN = /kỹ thuật|cơ khí|xây dựng|thủ công|lắp đặt|vận hành|chế tạo|thợ|spa|ẩm thực|bếp|nail|make.?up|barista|cắt tóc|massage|sửa chữa|điện lạnh/i;

    // NGHỀ Y TẾ LÂM SÀNG — tiếp xúc trực tiếp máu/bệnh nhân/thương tích
    const RE_CLINICAL_DIRECT = /bác sĩ|điều dưỡng|y tá|phẫu thuật|cấp cứu|phòng mổ|hộ sinh|kỹ thuẫt viên y tế|phục hồi chức năng lâm sàng|vật lý trị liệu lâm sàng|xét nghiệm lâm sàng/i;

    // NGHỀ Y TẾ PHI LÂM SÀNG — không cần tiếp xúc máu (phù hợp người sợ máu)
    const RE_CLINICAL_SAFE = /tâm lý|y tế công cộng|sức khỏe cộng đồng|nghiên cứu dược|dược phẩm|quản lý y tế|quản lý bệnh viện|chính sách y tế|dinh dưỡng|healthtech|genomic|dịch tễ|y học dự phòng|y học từ xa|telehealth/i;

    const RE_TEACHER_DOMAIN = /giáo viên|giảng dạy học sinh|dạy học|trường tiểu học|trường trung học|trường phổ thông|sư phạm|giảng viên đại học|hướng nghiệp học sinh|giáo dục đặc biệt|học viên|lớp học|phòng thí nghiệm trường/i;

    // NHÀ ĐÀO TẠO: đào tạo người lớn/doanh nghiệp, kỹ năng, coaching, workshop
    const RE_TRAINER_DOMAIN = /đào tạo viên|huấn luyện viên|trainer|coach|khai vấn|diễn giả|speaker|thuyết trình|đào tạo doanh nghiệp|đào tạo kỹ năng|đào tạo nhân sự|workshop|bootcamp|facilitator|mentoring|đào tạo lãnh đạo|đào tạo kinh doanh|đào tạo bán hàng/i;

    // SPEECH chung (dùng cho các nghề tư vấn, hướng dẫn không phân loại rõ)
    const RE_SPEECH_DOMAIN = /tư vấn|hướng dẫn|tham vấn|mc chương trình|giảng dạy|đào tạo viên|huấn luyện viên|coach|khai vấn|diễn giả|speaker|thuyết trình|giảng viên|giáo viên|hướng nghiệp/i;

    const RE_STRATEGY_DOMAIN = /quản trị|chiến lược|phân tích|kế hoạch|tâm lý|nghiên cứu|khai vấn|tư vấn|marketing|thương hiệu|consultant|advisor|strategy|brand/i;
    const RE_THEORY_PENALTY = /ngôn ngữ học|văn học thuần|triết học|toán học thuần|vật lý lý thuyết|hóa học thuần|sinh học thuần|lý thuyết thuần/i;

    // ══ INTENT MAPPING — ĐỐI CHIẾU Ý ĐỊNH SÂU ═══════════════════════════════
    //  Giải mã ước mơ thành tí n hiệu ý định rõ ràng:
    //  BIZ   = muốn làm kinh doanh / khởi nghiệp
    //  INSPIRE = muốn truyền cảm hứng / đào tạo / hướng nghiệp
    //  Điều kiện khớp dream: Holland của ngành phải vượt ngưỡng cụ thể
    // ══════════════════════════════════════════════════════════════════
    const BIZ_KEYWORDS = ['doanh nhân', 'kinh doanh', 'giám đốc', 'chủ tịch', 'startup', 'ceo', 'khởi nghiệp', 'founder', 'tự kinh doanh'];
    const INSPIRE_KEYWORDS = ['truyền cảm hứng', 'huấn luyện viên', 'đào tạo', 'điễn giả', 'tư vấn', 'giáo viên', 'khai vấn', 'coach', 'speaker', 'hướng nghiệp'];
    const CARE_KEYWORDS = ['bác sĩ', 'y tế', 'sức khỏe', 'chăm sóc', 'chữ a lành bệnh', 'tâm lý học', 'trị liệu'];
    const TECH_KEYWORDS = ['lập trình', 'công nghệ', 'kỹ sư', 'developer', 'data', 'ai', 'robot', 'phần mềm'];

    const hasBiz = BIZ_KEYWORDS.some(k => dreamText.includes(k));
    const hasInspire = INSPIRE_KEYWORDS.some(k => dreamText.includes(k));
    const hasCare = CARE_KEYWORDS.some(k => dreamText.includes(k));
    const hasTech = TECH_KEYWORDS.some(k => dreamText.includes(k));

    // ── Đọc 4 câu Ikigai mở rộng ─────────────────────────────────────────────
    const ikigaiValue    = answers["Q_IKIGAI_VALUE"]    || null; // MONEY/IMPACT/FREEDOM/MASTERY/RECOGNITION
    const ikigaiEnv      = answers["Q_IKIGAI_ENV"]      || null; // TEAM/SOLO/FIELD/REMOTE/MIXED
    const ikigaiStrength = answers["Q_IKIGAI_STRENGTH"] || null; // COMMUNICATE/ANALYZE/CREATE/ORGANIZE/EMPATHIZE
    const ikigaiAvoid    = answers["Q_IKIGAI_AVOID"]    || null; // AVOID_ROUTINE/AVOID_PEOPLE/AVOID_PRESSURE/AVOID_ABSTRACT/AVOID_RULES

    // ── Ánh xạ VALUE → Holland bonus: MONEY→E, IMPACT→S, FREEDOM→A/I, MASTERY→I/C, RECOGNITION→E
    const VALUE_HOLLAND_BOOST = {
      MONEY:       { E: 8 },
      IMPACT:      { S: 8 },
      FREEDOM:     { A: 6, I: 4 },
      MASTERY:     { I: 6, C: 4 },
      RECOGNITION: { E: 6, S: 4 }
    };
    // ── Ánh xạ ENV → Holland bonus: TEAM→S/E, SOLO→I/C, FIELD→R/E, REMOTE→I/A, MIXED→không thay đổi
    const ENV_HOLLAND_BOOST = {
      TEAM:   { S: 6, E: 4 },
      SOLO:   { I: 6, C: 4 },
      FIELD:  { R: 6, E: 4 },
      REMOTE: { I: 4, A: 4 },
      MIXED:  {}
    };
    // ── Ánh xạ STRENGTH → Holland bonus
    const STRENGTH_HOLLAND_BOOST = {
      COMMUNICATE: { E: 8, S: 4 },
      ANALYZE:     { I: 8, C: 4 },
      CREATE:      { A: 8, I: 4 },
      ORGANIZE:    { C: 8, R: 2 },
      EMPATHIZE:   { S: 8, A: 4 }
    };
    // ── Ánh xạ AVOID → Holland penalty: trừ điểm các ngành lệch với giá trị né tránh
    const AVOID_PENALTY_MAP = {
      AVOID_ROUTINE:   { C: -10, R: -6 },   // Ghét lặp lại → phạt ngành C (kế toán, hành chính), R
      AVOID_PEOPLE:    { S: -10, E: -6 },   // Ghét tiếp xúc nhiều → phạt ngành S, E
      AVOID_PRESSURE:  { E: -8 },            // Ghét áp lực → phạt ngành kinh doanh E
      AVOID_ABSTRACT:  { I: -8, A: -4 },    // Ghét lý thuyết → phạt I (nghiên cứu), A (nghệ thuật trừu tượng)
      AVOID_RULES:     { C: -10 }            // Ghét quy trình → phạt ngành C (kế toán, hành chính)
    };

    // Dominant talent dùng cho fallback
    const dominantTalent =
      (ikigaiTalent.SPEECH >= 4 || ikigaiTalent.STRATEGY >= 4) ? 'SPEECH_STRATEGY'
        : (ikigaiTalent.CRAFT >= 4) ? 'CRAFT'
          : 'GENERAL';



    // ══════════════════════════════════════════════════════════════════════════
    //  PHÂN HỆ D — ĐIỂM THPT & LỘ TRÌNH
    // ══════════════════════════════════════════════════════════════════════════
    const hasScores = profile.thptScores &&
      Object.values(profile.thptScores).some(v => v > 0);

    let ieltsBonus = 0;
    let finalUserScore = 0;
    let bestComboName = 'N/A';

    if (hasScores) {
      if (profile.languageCertification?.type === 'IELTS') {
        const iScore = parseFloat(profile.languageCertification.score) || 0;
        if (iScore >= 7.5) ieltsBonus = 2.0;
        else if (iScore >= 6.5) ieltsBonus = 1.5;
        else if (iScore >= 5.5) ieltsBonus = 1.0;
      }
      const s = profile.thptScores;
      const combos = {
        A00: s.toan + s.ly + s.hoa,
        A01: s.toan + s.ly + s.anh,
        B00: s.toan + s.hoa + s.sinh,
        C00: s.van + s.su + s.dia,
        D01: s.toan + s.van + s.anh
      };
      bestComboName = Object.keys(combos).reduce((a, b) => combos[a] >= combos[b] ? a : b);
      finalUserScore = Math.min(30.0, combos[bestComboName] + ieltsBonus);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  VÒNG 1 — SÀNG LỌC BẢN NGÃ TỐ CHẤT THUẦN TÚY (1001 → TOP 15)
    //  Chỉ dùng num_mapping + 5 chỉ số Nhân số học
    //  S_identity = LP×0.25 + Soul×0.10 + Mission×0.30 + Talent×0.25 + Passion×0.10
    //  (num_mapping value 1–10) × 10 → thang 0–100
    // ══════════════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════════
    //  PRE-FILTER — NĂNG KHIẾU CỨNG: Loại hẳn khỏi pool nếu thiếu điều kiện
    //  Lý do: ×0.30 penalty chỉ ảnh hưởng S_niche (25%), không đủ mạnh để
    //  đẩy nghề nghệ thuật/vẽ/biểu diễn ra khỏi TOP 5 khi S_identity (60%)
    //  vẫn cao. Giải pháp đúng: loại TRƯỚC KHI tính điểm.
    // ═══════════════════════════════════════════════════════════════════════

    // Các ngành đòi hỏi NĂNG KHIẾU VẼ / NGHỆ THUẬT / BIỂU DIỄN bẩm sinh
    const RE_ARTS_HARD = /thiết kế đồ họa|thiết kế nội thất|thiết kế thời trang|thiết kế sản phẩm mỹ|mỹ thuật|họa sĩ|điêu khắc|vẽ tranh|tranh sơn dầu|diễn viên|ca sĩ|nhạc sĩ|nhạc cụ|nhạc viện|vũ công|múa|ballet|sân khấu kịch|nghệ thuật biểu diễn|biên đạo|đạo diễn sân khấu|animation|concept art|illustration|game art|comic|manga/i;

    // Lọc pool đầu vào dựa trên tự đánh giá năng khiếu của người dùng
    const candidateCareers = (ikigaiTalent.CRAFT <= 2)
      ? careers.filter(c => !RE_ARTS_HARD.test(c.name.toLowerCase()))
      : careers;

    // Vòng 1: tính S_identity cho toàn bộ pool
    const _r1All = candidateCareers
      .map(c => {
        let S_identity = 0;
        // 4 chỉ số đơn (LP, Soul, Mission, Talent)
        NUM_KEYS.forEach((key, idx) => {
          const mapped = c.num_mapping?.[key] ?? 5;
          S_identity += (mapped / 10) * 100 * NUM_W[idx];
        });
        // Đam mê: trung bình cộng của TẤT CẢ passion numbers đồng hạng (×0.10)
        const passionAvgScore = passionNums.reduce((sum, pn) =>
          sum + (c.num_mapping?.[String(pn)] ?? 5), 0
        ) / passionNums.length;
        S_identity += (passionAvgScore / 10) * 100 * 0.10;

        return { c, S_identity: +S_identity.toFixed(4) };
      })
      .sort((a, b) => b.S_identity - a.S_identity);

    // ── DIVERSITY PRE-FILTER SAU VÒNG 1: giữ tối đa 2 entries per industry ──
    // Đảm bảo không có ngành nào chiếm quá nhiều slot trước khi vào Vòng 2
    const round1 = (() => {
      const _indCount = {};
      return _r1All.filter(({ c }) => {
        const ind = c.industry || 'other';
        _indCount[ind] = (_indCount[ind] || 0) + 1;
        return _indCount[ind] <= 2;
      }).slice(0, 30);
    })();

    // ══════════════════════════════════════════════════════════════════════════
    //  VÒNG 2 — ĐỊNH VỊ MÔI TRƯỜNG, NGÁCH & KỸ NĂNG (20 → TOP 10)
    //  → RIASEC Hexagon Penalty: dist=3 → ×0.20 | dist=2 (cả 2) → ×0.70
    //  → IKIGAI CRAFT Bonus/Penalty
    //  → IKIGAI SPEECH/STRATEGY Bonus
    //  → Dream + Holland Cross-check Bonus
    // ══════════════════════════════════════════════════════════════════════════
    const round2 = round1
      .map(({ c, S_identity }) => {
        const nameLC = c.name.toLowerCase();

        // ── Holland Weighted Score ──────────────────────────────────────────
        let hNum = 0, hDen = 0;
        for (const cat in (c.holland_req || {})) {
          hNum += hPct[cat] * c.holland_req[cat];
          hDen += 100 * c.holland_req[cat];
        }
        let hollandScore = hDen > 0 ? (hNum / hDen) * 100 : 50;

        // ── RIASEC Hexagon Penalty ──────────────────────────────────────────
        const careerTopH = Object.entries(c.holland_req || {})
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'S';
        const dist1 = hollandDistance(userTop1Holland, careerTopH);
        const dist2 = hollandDistance(userTop2Holland, careerTopH);

        if (dist1 === 3 || dist2 === 3) {
          hollandScore *= 0.20;       // Đối kháng trực tiếp: phạt 80%
        } else if (dist1 === 2 && dist2 >= 2) {
          hollandScore *= 0.70;       // Lệch pha vừa: phạt 30%
        }

        // ── MBTI Compatibility ──────────────────────────────────────────────
        // Base = 40: nghề không khớp MBTI chỉ được 40/100 — phạt rõ hơn base=60 cũ
        let mbtiBase = 40;
        for (const letter of mbtiCode) {
          if (c.mbti_req?.[letter]) mbtiBase += c.mbti_req[letter] * 6;
        }
        const mbtiScore = Math.max(0, Math.min(100, mbtiBase));

        // ── S_niche nền tảng (Holland 25% + MBTI 65%) ──────────────────────
        // MBTI chủ đạo: tính cách/tư duy quan trọng hơn sở thích môi trường Holland
        let S_niche = (hollandScore * 0.25) + (mbtiScore * 0.65);

        // ══════════════════════════════════════════════════════════════════
        //  IKIGAI EXTENDED — 4 câu giá trị/môi trường/điểm mạnh/né tránh
        //  Điều chỉnh S_niche theo sự phù hợp giữa đặc tính nghề và
        //  ưu tiên cá nhân của người dùng (max ±15 mỗi chiều)
        // ══════════════════════════════════════════════════════════════════
        const careerReq = c.holland_req || {};

        // [VALUE] Cộng điểm nếu holland_req của nghề khớp với giá trị cốt lõi
        if (ikigaiValue && VALUE_HOLLAND_BOOST[ikigaiValue]) {
          let valueBonus = 0;
          for (const [cat, pts] of Object.entries(VALUE_HOLLAND_BOOST[ikigaiValue])) {
            if ((careerReq[cat] || 0) >= 6) valueBonus += pts;
            else if ((careerReq[cat] || 0) >= 4) valueBonus += Math.round(pts * 0.5);
          }
          S_niche = Math.min(100, S_niche + Math.min(12, valueBonus));
        }

        // [ENV] Cộng điểm nếu môi trường làm việc của nghề khớp với sở thích
        if (ikigaiEnv && ENV_HOLLAND_BOOST[ikigaiEnv]) {
          let envBonus = 0;
          for (const [cat, pts] of Object.entries(ENV_HOLLAND_BOOST[ikigaiEnv])) {
            if ((careerReq[cat] || 0) >= 6) envBonus += pts;
            else if ((careerReq[cat] || 0) >= 4) envBonus += Math.round(pts * 0.5);
          }
          S_niche = Math.min(100, S_niche + Math.min(10, envBonus));
        }

        // [STRENGTH] Cộng điểm nếu điểm mạnh bản thân khớp với đặc thù nghề
        if (ikigaiStrength && STRENGTH_HOLLAND_BOOST[ikigaiStrength]) {
          let strengthBonus = 0;
          for (const [cat, pts] of Object.entries(STRENGTH_HOLLAND_BOOST[ikigaiStrength])) {
            if ((careerReq[cat] || 0) >= 6) strengthBonus += pts;
            else if ((careerReq[cat] || 0) >= 4) strengthBonus += Math.round(pts * 0.5);
          }
          S_niche = Math.min(100, S_niche + Math.min(12, strengthBonus));
        }

        // [AVOID] Trừ điểm nếu nghề vi phạm điều người dùng KHÔNG muốn
        if (ikigaiAvoid && AVOID_PENALTY_MAP[ikigaiAvoid]) {
          let avoidPenalty = 0;
          for (const [cat, pts] of Object.entries(AVOID_PENALTY_MAP[ikigaiAvoid])) {
            if ((careerReq[cat] || 0) >= 7) avoidPenalty += pts;       // Ngành đặc trưng mạnh → phạt đủ
            else if ((careerReq[cat] || 0) >= 5) avoidPenalty += Math.round(pts * 0.5); // Trung bình → phạt nhẹ
          }
          S_niche = Math.max(0, S_niche + Math.max(-15, avoidPenalty)); // Tối đa phạt -15
        }

        // ══════════════════════════════════════════════════════════════════
        //  IKIGAI TALENT BONUS — ĐẦY ĐỦ 3 CHIỀU + ARTS GATE
        // ══════════════════════════════════════════════════════════════════

        // [1a] CRAFT — Thực hành tay chân cơ học (Holland R mạnh hoặc ngành thủ công)
        const isCraftCareer = RE_CRAFT_DOMAIN.test(nameLC) || (c.holland_req?.R || 0) >= 6;
        if (isCraftCareer) {
          if (ikigaiTalent.CRAFT >= 4) {
            S_niche = Math.min(100, S_niche + 15); // Năng khiếu thực hành mạnh ✓
          } else if (ikigaiTalent.CRAFT <= 2) {
            S_niche *= 0.30; // Không phù hợp tay nghề ✗
          }
        }

        // [1b] ARTS GATE — Nghề đòi hỏi NĂNG KHIẾU NGHỆ THUẬT / VẼ / BIỂU DIỄN
        //  Khác với CRAFT cơ học — đây là nhóm cần tài năng sáng tạo bẩm sinh:
        //  Thiết kế đồ họa (cần biết vẽ), Diễn viên, Ca sĩ, Nhạc sĩ, Vũ công...
        //  → Nếu người dùng tự đánh giá CRAFT thấp (1-2): phạt nặng
        //  → Nếu CRAFT cao (4-5) hoặc Holland A mạnh: thưởng
        const RE_ARTS_DOMAIN = /thiết kế đồ họa|mỹ thuật|họa sĩ|điêu khắc|vẽ tranh|tranh|diễn viên|ca sĩ|nhạc sĩ|nhạc cụ|nhạc viện|vũ công|múa|ballet|sân khấu kịch|nghệ thuật biểu diễn|biên đạo|đạo diễn sân khấu|phim hoạt hình|concept art|game art|illustration|nhiếp ảnh nghệ thuật/i;
        const isArtsCareer = RE_ARTS_DOMAIN.test(nameLC) ||
          ((c.holland_req?.A || 0) >= 7 && (c.holland_req?.R || 0) < 4);

        if (isArtsCareer && !isCraftCareer) { // Tránh tính 2 lần
          if (ikigaiTalent.CRAFT <= 2) {
            S_niche *= 0.30; // Không có năng khiếu nghệ thuật → loại khỏi top ✗
          } else if (ikigaiTalent.CRAFT >= 4) {
            S_niche = Math.min(100, S_niche + 12); // Năng khiếu nghệ thuật mạnh ✓
          }
        }

        // [2a] GIÁO VIÊN — Dạy học chính quy (cần SPEECH + EMPATHIZE/F)
        const isTeacherCareer = RE_TEACHER_DOMAIN.test(nameLC);
        if (isTeacherCareer) {
          const isEmpathetic = (mbtiCode.includes('F') || ikigaiStrength === 'EMPATHIZE' || ikigaiStrength === 'COMMUNICATE');
          if (ikigaiTalent.SPEECH >= 4 && isEmpathetic) {
            S_niche = Math.min(100, S_niche + 15); // Giáo viên: SPEECH + đồng cảm ✓
          } else if (ikigaiTalent.SPEECH >= 4) {
            S_niche = Math.min(100, S_niche + 8);  // Có khả năng truyền đạt nhưng thiếu đồng cảm
          } else if (ikigaiTalent.SPEECH <= 2) {
            S_niche *= 0.75; // Khó truyền đạt → giảm điểm
          }
        }

        // [2b] NHÀ ĐÀO TẠO — Đào tạo người lớn/doanh nghiệp (cần SPEECH + STRATEGY)
        const isTrainerCareer = RE_TRAINER_DOMAIN.test(nameLC);
        if (isTrainerCareer) {
          const isResultsDriven = (mbtiCode.includes('E') || mbtiCode.includes('J') || ikigaiStrength === 'COMMUNICATE');
          if (ikigaiTalent.SPEECH >= 4 && ikigaiTalent.STRATEGY >= 4) {
            S_niche = Math.min(100, S_niche + 18); // Nhà đào tạo đỉnh: SPEECH + STRATEGY ✓✓
          } else if (ikigaiTalent.SPEECH >= 4 && isResultsDriven) {
            S_niche = Math.min(100, S_niche + 12); // SPEECH mạnh + hướng kết quả ✓
          } else if (ikigaiTalent.SPEECH <= 2) {
            S_niche *= 0.65; // Thiếu kỹ năng truyền đạt → phạt nặng hơn giáo viên
          }
        }

        // [2c] SPEECH chung (tư vấn, hướng dẫn không phân loại rõ)
        const isSpeechCareer = !isTeacherCareer && !isTrainerCareer && RE_SPEECH_DOMAIN.test(nameLC);
        // [3] STRATEGY — Chiến lược, tâm lý, tư vấn
        const isStrategyCareer = RE_STRATEGY_DOMAIN.test(nameLC);

        if (isSpeechCareer || isStrategyCareer) {
          if (ikigaiTalent.SPEECH >= 4 || ikigaiTalent.STRATEGY >= 4) {
            S_niche = Math.min(100, S_niche + 12);
          }
          if (ikigaiTalent.SPEECH >= 4 && ikigaiTalent.STRATEGY >= 4) {
            S_niche = Math.min(100, S_niche + 5);
          }
        }


        // ══════════════════════════════════════════════════════════════════
        //  DREAM ALIGNMENT — INTENT MAPPING
        //  Đối chiếu ý định sâu:
        //  BIZ + INSPIRE → khớp ngành có S≥85 và E≥80 (Lãnh đạo xã hội + Kinh doanh)
        //  BIZ only     → khớp ngành có E≥80
        //  INSPIRE only → khớp ngành có S≥80
        //  CARE only    → khớp ngành có S≥80 trong Y tế/Tâm lý
        //  TECH only    → khớp ngành có I≥75 hoặc R≥75
        // ══════════════════════════════════════════════════════════════════
        let dreamBonus = 0;
        let isDreamMatch = false;

        if (dreamText.length > 0) {
          const careerS = c.holland_req?.S || 0;
          const careerE = c.holland_req?.E || 0;
          const careerI = c.holland_req?.I || 0;
          const careerR = c.holland_req?.R || 0;

          if (hasBiz && hasInspire) {
            // "Dấu ấn định vị khớp đỉnh": doanh nhân + truyền cảm hứng
            // Chỉ khớp ngành có cả 2 chiều: Xã hội (S) và Kinh doanh (E)
            if (careerS >= 85 && careerE >= 80) {
              dreamBonus = 20; isDreamMatch = true;
            } else if (careerS >= 70 && careerE >= 70) {
              dreamBonus = 12; isDreamMatch = true;
            }
          } else if (hasBiz) {
            if (careerE >= 80) { dreamBonus = 15; isDreamMatch = true; }
            else if (careerE >= 65) { dreamBonus = 8; }
          } else if (hasInspire) {
            if (careerS >= 80) { dreamBonus = 15; isDreamMatch = true; }
            else if (careerS >= 65) { dreamBonus = 8; }
          } else if (hasCare) {
            const isMedOrPsy = /y tế|y khoa|dược|chăm sóc|tâm lý|tham vấn|điều dưỡng/i.test(nameLC);
            if (isMedOrPsy && careerS >= 75) { dreamBonus = 15; isDreamMatch = true; }
          } else if (hasTech) {
            if (careerI >= 75 || careerR >= 75) { dreamBonus = 15; isDreamMatch = true; }
          }

          S_niche = Math.min(100, S_niche + dreamBonus);
        }

        S_niche = Math.max(0, +S_niche.toFixed(4));

        return { c, S_identity, S_niche, dreamBonus, isDreamMatch, careerTopH };
      })
      .sort((a, b) => b.S_niche - a.S_niche);

    // ── DIVERSITY PRE-FILTER SAU VÒNG 2: giữ tối đa 2 entries per industry ──
    // Tránh để 1 ngành chiếm hết slot trong Vòng 3
    const round2Filtered = (() => {
      const _indCount = {};
      return round2.filter(({ c }) => {
        const ind = c.industry || 'other';
        _indCount[ind] = (_indCount[ind] || 0) + 1;
        return _indCount[ind] <= 2;
      }).slice(0, 15);
    })();

    // ── CLINICAL CONSTRAINT FLAGS (từ câu Q_CONSTRAINT_CLINICAL) ─────────────
    const clinicalAnswer = answers["Q_CONSTRAINT_CLINICAL"] || "CLINICAL_NA";
    const avoidsClinical = clinicalAnswer === "CLINICAL_AVOID";
    const mildClinical   = clinicalAnswer === "CLINICAL_MILD";

    // ── CONSTRAINT FLAGS — 4 ngành đặc thù mới ────────────────────────────────
    const artsAnswer     = answers["Q_CONSTRAINT_ARTS"]     || "ARTS_NA";
    const eduAnswer      = answers["Q_CONSTRAINT_EDU"]      || "EDU_NA";
    const bizAnswer      = answers["Q_CONSTRAINT_BIZ"]      || null;
    const lawAnswer      = answers["Q_CONSTRAINT_LAW"]      || "LAW_NA";

    // Regex nhận diện các ngành đặc thù — dùng trong Vòng 3 penalty/boost
    const RE_ARTS_PERF    = /diễn viên|ca sĩ|vũ công|nhạc sĩ|biên đạo|biểu diễn nghệ thuật|sân khấu|khởi cười|vũ đoàn|thanh nhạc/i;
    const RE_EDU_DOMAIN   = /giáo viên|giảng viên|nhà đào tạo|huấn luyện viên|sư phạm|đào tạo viên|life coach|khai vấn|hướng nghiệp|trainer|facilitator|đứng lớp|truyền đạt kiến thức/i;
    const RE_BIZ_STARTUP  = /khởi nghiệp|doanh nhân|startup|founder|giám đốc điều hành|ceo|tự kinh doanh|chủ doanh nghiệp/i;
    const RE_LAW          = /luật sư|pháp chế|công tố viên|thẩm phán|kiểm sát viên|trọng tài|luật gia|pháp luật|luật công ty/i;


    //  VÒNG 3 — TỐI ƯU XU HƯỚNG & GIÁ TRỊ DÒNG TIỀN (10 → TOP 5)
    //  S_market = demand×0.55 + salary×0.45
    //  ICI = S_identity×0.60 + S_niche×0.25 + S_market×0.15
    //  + Theory Penalty + Bucket Classification
    // ══════════════════════════════════════════════════════════════════════════
    const round3 = round2Filtered
      .map(({ c, S_identity, S_niche, dreamBonus, isDreamMatch, careerTopH }) => {
        const demand = c.market_demand ?? 50;
        const salary = c.market_salary ?? 50;

        // Hệ số phạt lý thuyết thuần bão hòa (demand < 75)
        const theoryPenalty = RE_THEORY_PENALTY.test(c.name) && demand < 75 ? 0.60 : 1.0;
        const S_market = (demand * theoryPenalty * 0.55) + (salary * theoryPenalty * 0.45);

        // ── CLINICAL CONSTRAINT PENALTY (sợ máu / tránh lâm sàng) ───────────
        const nameLC2 = (c.name + ' ' + (c.niche || '')).toLowerCase();
        const isClinicalDirect = RE_CLINICAL_DIRECT.test(nameLC2);
        const isClinicalSafe   = RE_CLINICAL_SAFE.test(nameLC2);
        let clinicalMultiplier = 1.0;
        let clinicalBoost = 0;
        if (avoidsClinical) {
          if (isClinicalDirect) clinicalMultiplier = 0.50;  // phạt nặng: Bác sĩ, Điều dưỡng cạnh giường
          if (isClinicalSafe)   clinicalBoost = +10;         // boost: Tâm lý, Y tế Công cộng, Nghiên cứu Dược
        } else if (mildClinical) {
          if (isClinicalDirect) clinicalMultiplier = 0.85;  // phạt nhẹ
          if (isClinicalSafe)   clinicalBoost = +4;
        }

        // ── ARTS CONSTRAINT PENALTY ───────────────────────────────────────────
        let artsMultiplier = 1.0;
        let artsBoost = 0;
        if (RE_ARTS_PERF.test(nameLC2)) {
          if (artsAnswer === 'ARTS_AVOID') artsMultiplier = 0.50; // Không muốn biểu diễn → phạt nặng
          else if (artsAnswer === 'ARTS_MILD') artsMultiplier = 0.80; // Do dự → phạt nhẹ
          else if (artsAnswer === 'ARTS_OK')   artsBoost = +10;        // Sẵn sàng → boost
        }

        // ── EDU CONSTRAINT PENALTY ─────────────────────────────────────────
        let eduMultiplier = 1.0;
        let eduBoost = 0;
        if (RE_EDU_DOMAIN.test(nameLC2)) {
          if (eduAnswer === 'EDU_AVOID') eduMultiplier = 0.55;   // Không muốn dạy học → phạt nặng
          else if (eduAnswer === 'EDU_MILD') eduMultiplier = 0.82; // Do dự → phạt nhẹ
          else if (eduAnswer === 'EDU_OK')   eduBoost = +12;       // Yêu thích dạy học → boost mạnh
        }

        // ── BIZ CONSTRAINT PENALTY ──────────────────────────────────────────────
        let bizMultiplier = 1.0;
        let bizBoost = 0;
        if (RE_BIZ_STARTUP.test(nameLC2)) {
          if (bizAnswer === 'BIZ_AVOID')  bizMultiplier = 0.65; // Muốn việc ổn định → phạt startup
          else if (bizAnswer === 'BIZ_MILD') bizBoost = +4;     // Muốn thử → boost nhẹ
          else if (bizAnswer === 'BIZ_OK')   bizBoost = +12;    // Sẵn sàng rủi ro → boost mạnh
        }

        // ── LAW CONSTRAINT PENALTY ───────────────────────────────────────────────
        let lawMultiplier = 1.0;
        let lawBoost = 0;
        if (RE_LAW.test(nameLC2)) {
          if (lawAnswer === 'LAW_AVOID')  lawMultiplier = 0.55; // Không muốn ngành luật
          else if (lawAnswer === 'LAW_MILD') lawBoost = +4;
          else if (lawAnswer === 'LAW_OK')   lawBoost = +8;
        }

        // Công thức ICI 3 lớp cốt lõi
        const ICI = Math.min(100,
          ((S_identity * 0.60) +
          (S_niche * 0.25) +
          (S_market * 0.15))
          * clinicalMultiplier * artsMultiplier * eduMultiplier * bizMultiplier * lawMultiplier
          + clinicalBoost + artsBoost + eduBoost + bizBoost + lawBoost
        );

        // Điểm chuẩn tham chiếu mô phỏng
        const mockCutoff = Math.round((20.0 + (demand / 100) * 9.5) * 100) / 100;
        let bucket = 'PHÙ HỢP';
        let advice = 'Ngành ứng dụng thực tế có chỉ số tương thích bẩm sinh xuất sắc.';

        if (hasScores) {
          const delta = Math.round((finalUserScore - mockCutoff) * 100) / 100;
          if (delta >= 1.5) { bucket = 'SAFE'; advice = 'Phao cứu sinh an toàn tuyệt đối — bệ đỡ tâm lý vững chắc.'; }
          else if (delta >= 0) { bucket = 'MATCH'; advice = 'Vừa tầm, cơ hội đỗ cực kỳ cao — nên đặt giữa danh sách nguyện vọng.'; }
          else if (delta >= -1.2) { bucket = 'DREAM'; advice = 'Nguyện vọng mơ ước, điểm sát nút — đặt ở NV1 hoặc NV2.'; }
          else { bucket = 'RISK'; advice = 'Điểm chuẩn vượt xa năng lực hiện tại — cân nhắc kỹ trước khi đặt.'; }
        }

        // ── Tổ hợp môn & kiến thức nền tảng — mapping theo NGÀNH & TÊN NGHỀ ──
        let displayCombo = c.suggested_combinations || '';
        let displaySubjects = c.core_knowledge || '';
        if (!displayCombo) {
          const nm  = (c.name || '').toLowerCase();
          const ind = (c.industry || '').toLowerCase();

          // ── NGHỆ THUẬT / BIỂU DIỄN ────────────────────────────────────────
          if (/thiết kế đồ họa|mỹ thuật|hội họa|nhiếp ảnh|hoạt hình|animation|nội thất|thời trang|concept art|illustration/i.test(nm)) {
            displayCombo = 'H01 / D01 (Toán - Văn - Vẽ Mỹ thuật / Toán - Văn - Anh)';
            displaySubjects = 'Hình họa khối, Bố cục màu sắc, Tư duy thẩm mỹ thị giác, Đồ họa kỹ thuật số.';

          } else if (/diễn viên|âm nhạc|thanh nhạc|múa|biên đạo|sân khấu|kịch/i.test(nm)) {
            displayCombo = 'N00 / N01 (Năng khiếu Âm nhạc / Sân khấu / Múa)';
            displaySubjects = 'Kỹ thuật thanh nhạc, Biểu diễn sân khấu, Ngôn ngữ cơ thể, Cảm thụ nghệ thuật.';

          // ── Y DƯỢC & SỨC KHỎE (B00/B08 ưu tiên, A00 bổ sung) ─────────────
          } else if (ind.includes('y dược') || ind.includes('sức khỏe')
              || /bác sĩ|điều dưỡng|dược sĩ|y tá|hộ sinh|y học|y tế|chăm sóc sức khỏe|sinh lý|dịch tễ|dinh dưỡng|phục hồi chức năng|vật lý trị liệu/i.test(nm)) {
            displayCombo = 'B00 / B08 / A00 (Toán - Hóa - Sinh / Toán - Sinh - Anh / Toán - Lý - Hóa)';
            displaySubjects = 'Sinh học tế bào & phân tử, Hóa sinh hữu cơ, Giải phẫu học nền tảng, Toán thống kê y tế.';

          // ── TÂM LÝ HỌC / SỨC KHỎE TÂM THẦN (Khoa học Xã hội) ──────────────
          } else if (/tâm lý học|tham vấn tâm lý|trị liệu tâm lý|sức khỏe tâm thần|y tế công cộng|sức khỏe cộng đồng/i.test(nm)) {
            displayCombo = 'C00 / D01 (Văn - Sử - Địa / Toán - Văn - Anh)';
            displaySubjects = 'Tâm lý học đại cương, Xã hội học, Kỹ năng lắng nghe & tham vấn, Thống kê ứng dụng.';

          // ── CÔNG NGHỆ THÔNG TIN / LẬP TRÌNH / AI ─────────────────────────
          } else if (ind.includes('công nghệ thông tin') || ind.includes('phần mềm')
              || /lập trình|phần mềm|công nghệ thông tin|kỹ sư phần mềm|data|ai|machine learning|trí tuệ nhân tạo|an ninh mạng|blockchain|devops|cloud/i.test(nm)) {
            displayCombo = 'A00 / A01 (Toán - Lý - Hóa / Toán - Lý - Anh)';
            displaySubjects = 'Toán rời rạc & giải tích, Vật lý điện tử, Lập trình nền tảng, Tiếng Anh kỹ thuật.';

          // ── KỸ THUẬT & CÔNG NGHỆ (Cơ, Điện, Tự động hóa) ────────────────
          } else if (ind.includes('kỹ thuật') || /kỹ sư cơ khí|kỹ sư điện|tự động hóa|robot|cơ điện tử|chế tạo máy|điện lạnh|điện tử|kỹ thuật hóa học/i.test(nm)) {
            displayCombo = 'A00 / A01 (Toán - Lý - Hóa / Toán - Lý - Anh)';
            displaySubjects = 'Vật lý điện từ & cơ học, Toán giải tích, Hóa kỹ thuật, Kỹ năng đo lường & thực hành.';

          // ── KHOA HỌC TỰ NHIÊN / NGHIÊN CỨU ──────────────────────────────
          } else if (ind.includes('khoa học tự nhiên') || /nhà nghiên cứu|khoa học gia|vật lý|hóa học|sinh học phân tử|hóa sinh|vi sinh|công nghệ sinh học/i.test(nm)) {
            displayCombo = 'A00 / B00 (Toán - Lý - Hóa / Toán - Hóa - Sinh)';
            displaySubjects = 'Tư duy logic khoa học, Hóa hữu cơ & vô cơ, Sinh học phân tử, Thống kê nghiên cứu.';

          // ── NÔNG LÂM NGƯ NGHIỆP ───────────────────────────────────────────
          } else if (ind.includes('nông') || /nông nghiệp|lâm nghiệp|thủy sản|thú y|trồng trọt|chăn nuôi|giống cây|giống vật/i.test(nm)) {
            displayCombo = 'B00 / A00 (Toán - Hóa - Sinh / Toán - Lý - Hóa)';
            displaySubjects = 'Sinh học thực vật & động vật, Hóa học nông nghiệp, Khoa học đất & môi trường.';

          // ── MÔI TRƯỜNG & NĂNG LƯỢNG XANH ─────────────────────────────────
          } else if (ind.includes('môi trường') || /năng lượng tái tạo|điện mặt trời|điện gió|xử lý nước thải|ô nhiễm|carbon|esg|môi trường/i.test(nm)) {
            displayCombo = 'A00 / B00 (Toán - Lý - Hóa / Toán - Hóa - Sinh)';
            displaySubjects = 'Hóa học môi trường, Vật lý năng lượng, Sinh thái học, Toán mô hình hóa.';

          // ── XÂY DỰNG & KIẾN TRÚC ──────────────────────────────────────────
          } else if (ind.includes('xây dựng') || /kiến trúc sư|kỹ sư xây dựng|kết cấu|cầu đường|nội thất không gian|quy hoạch|đô thị/i.test(nm)) {
            displayCombo = 'A00 / H01 (Toán - Lý - Hóa / Toán - Văn - Vẽ Mỹ thuật)';
            displaySubjects = 'Toán kỹ thuật, Vật lý kết cấu, Mỹ học kiến trúc, Hình họa & Bản vẽ kỹ thuật.';

          // ── KINH TẾ & TÀI CHÍNH ───────────────────────────────────────────
          } else if (ind.includes('kinh tế') || ind.includes('tài chính')
              || /kế toán|kiểm toán|tài chính|ngân hàng|đầu tư|chứng khoán|bảo hiểm|fintech|wealth|cfo/i.test(nm)) {
            displayCombo = 'A01 / D01 (Toán - Lý - Anh / Toán - Văn - Anh)';
            displaySubjects = 'Toán tài chính, Kinh tế vi mô & vĩ mô, Tiếng Anh thương mại, Thống kê ứng dụng.';

          // ── QUẢN TRỊ & MARKETING ──────────────────────────────────────────
          } else if (ind.includes('quản trị') || /marketing|kinh doanh|bán hàng|thương mại|quản lý doanh nghiệp|brand|pr/i.test(nm)) {
            displayCombo = 'D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)';
            displaySubjects = 'Kinh tế học nền tảng, Kỹ năng viết thuyết phục, Tiếng Anh thương mại, Tư duy phân tích thị trường.';

          // ── TRUYỀN THÔNG & BÁO CHÍ ────────────────────────────────────────
          } else if (ind.includes('truyền thông') || /truyền thông|báo chí|phóng viên|biên tập|content|podcast|social media/i.test(nm)) {
            displayCombo = 'D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)';
            displaySubjects = 'Kỹ năng viết lách sáng tạo, Tư duy truyền thông số, Ngôn ngữ học, Quan hệ công chúng.';

          // ── PHÁP LUẬT & TƯ PHÁP ───────────────────────────────────────────
          } else if (ind.includes('pháp luật') || /luật sư|pháp lý|tư pháp|công chứng|hòa giải|tranh tụng/i.test(nm)) {
            displayCombo = 'C00 / D01 (Văn - Sử - Địa / Toán - Văn - Anh)';
            displaySubjects = 'Ngữ văn lập luận, Lịch sử pháp luật, Địa chính trị, Tiếng Anh pháp lý.';

          // ── GIÁO DỤC & ĐÀO TẠO ───────────────────────────────────────────
          } else if (ind.includes('giáo dục') || /giáo viên|giảng viên|nhà đào tạo|huấn luyện viên|sư phạm|hướng nghiệp|life coach|khai vấn/i.test(nm)) {
            displayCombo = 'D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)';
            displaySubjects = 'Ngôn ngữ & giao tiếp, Tâm lý giáo dục, Phương pháp giảng dạy, Kiến thức chuyên ngành sâu.';

          // ── NGÔN NGỮ & VĂN HÓA / NGOẠI GIAO ─────────────────────────────
          } else if (ind.includes('ngôn ngữ') || /phiên dịch|biên dịch|ngoại giao|ngôn ngữ học|văn hóa nước ngoài/i.test(nm)) {
            displayCombo = 'D01 / D14 (Toán - Văn - Anh / Văn - Sử - Anh)';
            displaySubjects = 'Tiếng Anh nâng cao, Ngữ văn, Lịch sử & văn hóa thế giới, Ngôn ngữ học đại cương.';

          // ── QUẢN TRỊ NHÂN SỰ ──────────────────────────────────────────────
          } else if (ind.includes('nhân sự') || /nhân sự|hr |tuyển dụng|đào tạo nhân viên/i.test(nm)) {
            displayCombo = 'D01 / A01 (Toán - Văn - Anh / Toán - Lý - Anh)';
            displaySubjects = 'Tâm lý học tổ chức, Kinh tế lao động, Tiếng Anh thương mại, Kỹ năng giao tiếp.';

          // ── DU LỊCH & KHÁCH SẠN ───────────────────────────────────────────
          } else if (ind.includes('du lịch') || /hướng dẫn du lịch|khách sạn|lễ tân|nhà hàng|quản lý resort/i.test(nm)) {
            displayCombo = 'D01 / D14 (Toán - Văn - Anh / Văn - Sử - Anh)';
            displaySubjects = 'Tiếng Anh giao tiếp du lịch, Địa lý du lịch, Văn hóa & lịch sử Việt Nam, Nghiệp vụ lễ tân.';

          // ── DỊCH VỤ CÁ NHÂN & LIFESTYLE ──────────────────────────────────
          } else if (ind.includes('dịch vụ') || /làm đẹp|tóc|nail|spa|massage|bếp|ẩm thực|barista|cà phê chuyên nghiệp/i.test(nm)) {
            displayCombo = 'D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa) hoặc học nghề';
            displaySubjects = 'Kỹ thuật thực hành nghề, Hóa mỹ phẩm cơ bản, Dinh dưỡng ẩm thực, Kỹ năng chăm sóc khách hàng.';

          // ── HÀNH CHÍNH & DỊCH VỤ CÔNG ────────────────────────────────────
          } else if (ind.includes('hành chính') || /công chức|hành chính nhà nước|dịch vụ công|cán bộ|quản lý nhà nước/i.test(nm)) {
            displayCombo = 'C00 / D01 (Văn - Sử - Địa / Toán - Văn - Anh)';
            displaySubjects = 'Luật hành chính, Kinh tế chính trị, Ngữ văn lập luận, Lịch sử & địa lý quốc gia.';

          // ── THỂ THAO & PHÁT TRIỂN THỂ LỰC ───────────────────────────────
          } else if (ind.includes('thể thao') || /vận động viên|huấn luyện viên thể thao|thể dục|yoga|personal trainer/i.test(nm)) {
            displayCombo = 'T00 / D01 (Toán - Văn - Năng khiếu TDTT / Toán - Văn - Anh)';
            displaySubjects = 'Sinh lý học vận động, Giải phẫu học thể thao, Dinh dưỡng thể thao, Kỹ thuật môn thể thao chuyên sâu.';

          // ── KHOA HỌC THẦN KINH / BIOTECH / KHÔNG GIAN / LƯỢNG TỬ ─────────
          } else if (/thần kinh|neuroscience|bci|não bộ|lượng tử|quantum|không gian|vũ trụ|nanotechnology|vật liệu tiên tiến|genomic|bioinformatics/i.test(nm)) {
            displayCombo = 'A00 / B00 (Toán - Lý - Hóa / Toán - Hóa - Sinh)';
            displaySubjects = 'Toán cao cấp & vật lý lý thuyết, Hóa sinh phân tử, Lập trình khoa học, Tiếng Anh học thuật chuyên sâu.';

          // ── CÔNG AN & AN NINH QUỐC GIA ─────────────────────────────────────
          } else if (ind.includes('công an') || ind.includes('an ninh quốc gia')
              || /sĩ quan cảnh sát|điều tra viên hình sự|cảnh sát nhân dân|an ninh nhân dân|tội phạm mạng.*công an|pháp y hình sự/i.test(nm)) {
            displayCombo = 'A00 / C00 / D01 (Toán - Lý - Hóa / Văn - Sử - Địa / Toán - Văn - Anh)';
            displaySubjects = 'Toán học logic, Ngữ văn pháp luật, Lịch sử & địa lý quốc phòng, Thể lực chiến đấu.';

          // ── QUÂN SỰ & QUỐC PHÒNG ────────────────────────────────────────────
          } else if (ind.includes('quân sự') || ind.includes('quốc phòng')
              || /sĩ quan quân đội|kỹ sư kỹ thuật quân sự|tình báo điện tử|an ninh mạng quân|sĩ quan chỉ huy|vũ khí trang bị|hậu cần quân/i.test(nm)) {
            if (/kỹ sư|kỹ thuật quân sự|vũ khí|an ninh mạng quân|cyber warfare/i.test(nm)) {
              displayCombo = 'A00 / A01 (Toán - Lý - Hóa / Toán - Lý - Anh)';
            } else {
              displayCombo = 'A00 / C00 (Toán - Lý - Hóa / Văn - Sử - Địa)';
            }
            displaySubjects = 'Toán kỹ thuật, Vật lý ứng dụng, Lịch sử & địa lý quốc phòng, Thể lực chiến đấu, Tiếng Anh quân sự.';

          // ── TÂM LÝ HỌC ỨNG DỤNG (không phải y tế lâm sàng) ──────────────
          } else if (ind.includes('tâm lý') || /executive coach|life coach|tư vấn tâm lý|khai vấn|art therapist/i.test(nm)) {
            displayCombo = 'D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)';
            displaySubjects = 'Tâm lý học đại cương, Khoa học hành vi, Ngôn ngữ & giao tiếp, Xã hội học.';

          // ── FALLBACK DỰA VÀO HOLLAND TOP ──────────────────────────────────
          } else if (careerTopH === 'R' || careerTopH === 'I') {
            displayCombo = 'A00 / B00 (Toán - Lý - Hóa / Toán - Hóa - Sinh)';
            displaySubjects = 'Tư duy logic toán, Khoa học tự nhiên, Kỹ thuật ứng dụng, Lập trình nền tảng.';
          } else if (careerTopH === 'A') {
            displayCombo = 'H01 / D01 (Toán - Văn - Vẽ / Toán - Văn - Anh)';
            displaySubjects = 'Tư duy sáng tạo, Mỹ học & thẩm mỹ, Ngôn ngữ nghệ thuật, Thực hành nghề sáng tạo.';
          } else {
            displayCombo = 'D01 / C00 (Toán - Văn - Anh / Văn - Sử - Địa)';
            displaySubjects = 'Khoa học xã hội, Ngôn ngữ, Kỹ năng giao tiếp thuyết phục, Quản trị nền tảng.';
          }
        }

        return {
          name: c.name,
          niche: c.niche || c.name,
          industry: c.industry || '',
          study_major: c.study_major || '',
          ICI: +ICI.toFixed(2),
          S_identity: +S_identity.toFixed(1),
          S_niche: +S_niche.toFixed(1),
          S_market: +S_market.toFixed(1),
          cutoff: mockCutoff,
          bucket,
          advice,
          dreamBonus,
          isDreamMatch,
          displayCombo,
          displaySubjects,
          numerology_peak: c.numerology_peak || null
        };
      })
      .sort((a, b) => b.ICI - a.ICI);

    // ── Diversity Guard v5.1 — STRICT 1-PER-INDUSTRY + PROF-TITLE DEDUP ──────
    //  Thuật toán 4 lớp:
    //  Tiền xử lý: Tính profTitle thực tế cho mỗi entry (tên hiển thị cho người dùng)
    //  Lớp 1: 1 nghề tốt nhất mỗi INDUSTRY (industry bảo vệ cốt lõi)
    //  Lớp 2: Chặn tên nghề PROFESSION TITLE giống nhau hoặc gần giống (dedup thực)
    //  Lớp 3: Fallback thông minh nếu pool < 5

    // Helper: trích xuất core name (phần trước dấu '-' hoặc '(')
    const getCoreJobName = (name) => {
      const raw = name || '';
      const atParen = raw.indexOf('(');
      const atDash  = raw.indexOf(' - Ngành');
      let cutAt = raw.length;
      if (atParen > 0) cutAt = Math.min(cutAt, atParen);
      if (atDash  > 0) cutAt = Math.min(cutAt, atDash);
      return raw.substring(0, cutAt).trim().toLowerCase();
    };

    // Helper: tokenize để so sánh similarity (loại bỏ stop words)
    const STOP = new Set(['và','&','hoặc','của','cho','trong','với','về','theo','là',
                          'kỹ','sư','chuyên','gia','nhà','viên','người','quản','lý']);
    const tokenize = (s) => s.toLowerCase()
      .replace(/[^a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w));

    // Kiểm tra 2 tên có quá tương đồng không (≥2 token chung → similar)
    const isTooSimilar = (nameA, nameB) => {
      const tokA = new Set(tokenize(nameA));
      const tokB = new Set(tokenize(nameB));
      let shared = 0;
      for (const t of tokA) { if (tokB.has(t)) shared++; }
      return shared >= 2;
    };

    // ── TIỀN XỬ LÝ: Gắn profTitle thực tế vào từng entry (tên hiển thị = tên nghề người dùng thấy) ──
    // Đây là bước cốt lõi: dedup phải dựa trên TÊN HIỂN THỊ, không phải entry.niche từ database
    for (const entry of round3) {
      const pInfo = getProfessionDisplay(entry.industry, hPct, profile.thptScores, ikigaiStrength, mbtiCode);
      entry._profTitle = pInfo.profession || entry.niche || entry.name;
    }

    // LỚP 1: Lấy 1 nghề tốt nhất mỗi industry (round3 đã sort ICI giảm dần)
    const industryBestMap = {};
    for (const entry of round3) {
      const ind = entry.industry || 'other';
      if (!industryBestMap[ind]) {
        industryBestMap[ind] = entry;
      }
    }

    // Sort theo ICI → danh sách ứng viên chính
    const primaryCandidates = Object.values(industryBestMap)
      .sort((a, b) => b.ICI - a.ICI);

    // LỚP 2: Lọc tiếp bằng PROFESSION TITLE dedup (tên hiển thị thực tế)
    const top5 = [];
    const usedProfTitles = []; // Dùng profTitle (tên hiển thị) để so sánh, không dùng niche

    for (const entry of primaryCandidates) {
      if (top5.length >= 5) break;
      const entryProfTitle = entry._profTitle;
      // Chặn nếu tên nghề hiển thị đã giống với nghề đã chọn
      const isDupProf = usedProfTitles.some(p =>
        p === entryProfTitle || isTooSimilar(entryProfTitle, p)
      );
      if (!isDupProf) {
        top5.push(entry);
        usedProfTitles.push(entryProfTitle);
      }
    }

    // LỚP 3: Fallback — nếu vẫn < 5, thêm từ toàn bộ round3 với kiểm tra profTitle
    if (top5.length < 5) {
      for (const entry of round3) {
        if (top5.length >= 5) break;
        if (top5.includes(entry)) continue;
        const entryProfTitle = entry._profTitle;
        const isDupProf = usedProfTitles.some(p =>
          p === entryProfTitle || isTooSimilar(entryProfTitle, p)
        );
        if (!isDupProf) {
          top5.push(entry);
          usedProfTitles.push(entryProfTitle);
        }
      }
    }

    // Absolute fallback: tránh trang trắng (chấp nhận trùng tên, không trùng object)
    if (top5.length < 3) {
      for (const entry of round3) {
        if (top5.length >= 5) break;
        if (!top5.includes(entry)) top5.push(entry);
      }
    }


    // ══════════════════════════════════════════════════════════════════════════
    //  ĐỔ DỮ LIỆU LÊN GIAO DIỆN & HIỂN THỊ PAYWALL (MÔ HÌNH FREEMIUM 568K)
    // ══════════════════════════════════════════════════════════════════════════
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('report-container').classList.remove('hidden');

    // Cấu hình payload cho Báo cáo PDF (sẽ dùng khi thanh toán xong)
    window.pdfPayload = {
      HOTEN: profile.fullName,
      EMAIL: profile.email || "Không cung cấp",
      DIEN_THOAI: profile.phone || "Không cung cấp",
      NGAY_SINH: profile.birthDate || "Không cung cấp",
      MA_SO_HO_SO: `NCN-${Math.floor(Math.random()*10000)}`,
      NGAY_XUAT_BAN: new Date().toLocaleDateString('vi-VN'),
      R_PCT: hPct.R, I_PCT: hPct.I, A_PCT: hPct.A, S_PCT: hPct.S, E_PCT: hPct.E, C_PCT: hPct.C,
      MBTI: mbtiCode,
      LIFEPATH: lifepathNum,
      SOUL: soulNum,
      MISSION: missionNum,
      TALENT: talentNum,
      PASSION: passionNums.join(' & '),
      HOLLAND: sortedHolland.slice(0, 3).map(x => x[0]).join(''),
    };
    
    top5.forEach((entry, idx) => {
      const i = idx + 1;
      const profInfo = getProfessionDisplay(entry.industry, hPct, profile.thptScores, ikigaiStrength, mbtiCode);
      window.pdfPayload[`TOP${i}_TITLE`] = profInfo.profession ? `${profInfo.profession}${profInfo.nicheStr}` : entry.niche;
      window.pdfPayload[`TOP${i}_NICHE`] = entry.niche;
      window.pdfPayload[`TOP${i}_REF`] = entry.industry || "Chưa phân loại";
      window.pdfPayload[`TOP${i}_FIELD`] = entry.study_major || "Đa ngành";
      window.pdfPayload[`TOP${i}_ICI`] = entry.ICI;
      window.pdfPayload[`TOP${i}_ICI_DETAIL`] = `Id:${entry.S_identity} · Ni:${entry.S_niche} · Mk:${entry.S_market}`;
      window.pdfPayload[`TOP${i}_SUBJECTS`] = entry.displayCombo || "Theo trường";
      window.pdfPayload[`TOP${i}_KNOWLEDGE`] = entry.displaySubjects || "";
      window.pdfPayload[`TOP${i}_ADVICE`] = entry.advice || "";
    });

    // — Header —
    const contactInfo = [
      profile.email ? `📧 ${profile.email}` : '',
      profile.phone ? `📱 ${profile.phone}` : ''
    ].filter(Boolean).join('  ·  ');

    document.getElementById('report-student-name').innerHTML =
      `BÁO CÁO ĐỊNH VỊ NGHỀ NGHIỆP CHO: <strong>${profile.fullName}</strong>`
      + (contactInfo ? `<br><span style="font-size:13px;color:#718096;font-weight:400;">${contactInfo}</span>` : '');


    // — 5 chỉ số Nhân số học —
    document.getElementById('res-lifepath').innerText = lifepathNum;
    document.getElementById('res-soul').innerText = soulNum;
    document.getElementById('res-mission').innerText = missionNum;
    document.getElementById('res-talent').innerText = talentNum;
    document.getElementById('res-passion').innerText = passionNums.join(' & ');
    document.getElementById('res-mbti').innerText = mbtiCode;
    document.getElementById('res-holland').innerText = sortedHolland.slice(0, 2).map(x => x[0]).join(' & ');

    // (Đã bỏ phần Điểm xét tuyển)

    // — Banner lộ trình —
    const bannerEl = document.getElementById('vocational-route-banner');
    const titleEl = document.getElementById('career-section-title');

    if (!hasScores) {
      titleEl.innerText = '🌟 TOP 5 HƯỚNG ĐI TIỀM NĂNG & TỔ HỢP MÔN CẦN CHUẨN BỊ';
      bannerEl.innerHTML = `
        <div style="background:linear-gradient(135deg,#276749,#2f855a);border-radius:12px;
          padding:16px 20px;margin-bottom:22px;color:#fff;border-left:5px solid #68d391;">
          <h4 style="color:#68d391;margin:0 0 8px;font-size:15px;">📚 CHẾ ĐỘ HƯỚNG NGHIỆP SỚM — XÂY BỆ PHÓNG NGAY TỪ BÂY GIỜ</h4>
          <p style="margin:0;font-size:14px;line-height:1.75;">
            Hệ thống gợi ý <strong>tổ hợp môn &amp; kiến thức nền tảng</strong> THPT cần xây dựng
            sớm để làm bệ phóng vững chắc cho từng ngách ngành cụ thể.
          </p>
        </div>`;
    } else {
      titleEl.innerText = '🌟 TOP 5 NGUYỆN VỌNG VÀNG ĐƯỢC GỢI Ý';
      bannerEl.innerHTML = '';
    }

    // ── Render Khóa Paywall ──────────────────────────────────────────────────
    const space = document.getElementById('career-recommendations-space');
    
    // Đổi tiêu đề banner
    titleEl.innerHTML = '🔒 ĐỂ BIẾT CHÍNH XÁC NGHỀ NÀO DÀNH CHO BẠN?';
    titleEl.style.color = '#f59e0b'; // Màu cam/vàng cảnh báo
    
    // Xóa banner cũ (nếu có)
    if (bannerEl) bannerEl.innerHTML = '';

    space.innerHTML = `
      <div style="background: #1e293b; border: 2px solid #334155; border-radius: 12px; padding: 25px; margin-top: 10px;">
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Mở khóa <strong>BÁO CÁO PDF ĐỘC QUYỀN (SIÊU CHI TIẾT)</strong> phân tích riêng cho bạn để xem chi tiết:
        </p>
        
        <div style="background: #0f172a; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <h4 style="color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">📄 MỤC LỤC BÁO CÁO BẠN SẼ NHẬN ĐƯỢC:</h4>
          <ul style="color: #e2e8f0; font-size: 14px; line-height: 1.8; list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG I</span> Bạn Là Ai? (Xu hướng vận hành tự nhiên & Nhận thức)</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG I</span> Trí Tuệ Cảm Xúc & Năng lực vượt trội</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG II</span> Top 5 Hướng Đi Tiềm Năng & Tổ Hợp Môn</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG II</span> Khám Phá Sự Phù Hợp (Phân tích chi tiết 5 nghề)</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG III</span> Đặc Điểm Cần Cải Thiện & Quản Trị Rủi Ro</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG IV</span> Môi Trường Làm Việc Tối Ưu & Kỹ Năng Bổ Trợ</li>
            <li style="margin-bottom: 8px;"><span style="color:#7c3aed; font-weight:bold; width: 85px; display:inline-block;">CHƯƠNG V</span> Lời Kết & Khung Cam Kết Hành Động</li>
          </ul>
        </div>
        
        <div style="text-align: center; border-top: 1px dashed #334155; padding-top: 25px;">
          <!-- Khung nhập mã ưu đãi -->
          <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
            <input type="text" id="promo-code-input" placeholder="Nhập mã ưu đãi (nếu có)" style="padding: 10px 15px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: white; width: 200px; text-transform: uppercase;">
            <button id="btn-apply-promo" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Áp dụng</button>
          </div>
          <p id="promo-message" style="font-size: 13px; margin-top: -10px; margin-bottom: 15px;"></p>
          
          <button id="btn-show-qr" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; padding: 14px 30px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            🔓 MỞ KHÓA TOÀN BỘ & FILE PDF
          </button>
          
          <p style="color: #64748b; font-size: 12px; margin-top: 15px; font-style: italic;">
            (Hệ thống sẽ tự động tải file về máy và đồng thời gửi bản sao lưu Báo cáo PDF vào email của bạn)
          </p>
        </div>
        
        <!-- Khu vực hiển thị mã QR (Ẩn mặc định) -->
        <div id="qr-payment-area" style="display: none; margin-top: 25px; text-align: center; background: #fff; padding: 20px; border-radius: 8px;">
          <h4 style="color: #0f172a; margin-bottom: 10px;">Quét mã QR dưới đây để thanh toán</h4>
          <p style="color: #ef4444; font-weight: bold; margin-bottom: 15px;">Nội dung chuyển khoản: <span style="color:#2563eb">${profile.phone || profile.fullName} - ${window.pdfPayload.MA_SO_HO_SO}</span></p>
          
          <!-- Mã QR mẫu, sẽ thay bằng API PayOS hoặc link img.vietqr.io sau -->
          <img src="https://img.vietqr.io/image/OCB-61666666-compact2.png?amount=568000&addInfo=${encodeURIComponent((profile.phone || profile.fullName) + " " + window.pdfPayload.MA_SO_HO_SO)}&accountName=PHAM%20THI%20NGAN" alt="QR Code" style="max-width: 250px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
          
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xác nhận.</p>
          
          <button id="btn-confirm-payment" style="background: #10b981; color: white; border: none; padding: 12px 25px; font-size: 15px; font-weight: bold; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
            <span>Tôi đã chuyển khoản thành công</span>
          </button>
        </div>
      </div>
    `;

    let finalAmount = 568000;
    
    document.getElementById('btn-apply-promo').addEventListener('click', function() {
      const code = document.getElementById('promo-code-input').value.trim().toUpperCase();
      const msgEl = document.getElementById('promo-message');
      
      if (code === 'GIADINH') {
        finalAmount = 568000 - 500000;
        msgEl.innerHTML = '<span style="color: #10b981;">Áp dụng thành công! Đã giảm 500.000đ</span>';
      } else if (code === 'GIAM50') {
        finalAmount = 568000 - 50000;
        msgEl.innerHTML = '<span style="color: #10b981;">Áp dụng thành công! Đã giảm 50.000đ</span>';
      } else if (code === 'MIENPHI1') {
        finalAmount = 0;
        msgEl.innerHTML = '<span style="color: #10b981;">Áp dụng thành công! Miễn phí 100%</span>';
      } else {
        finalAmount = 568000;
        msgEl.innerHTML = '<span style="color: #ef4444;">Mã ưu đãi không hợp lệ!</span>';
      }
    });

    // Logic xử lý khi bấm nút "Thanh toán QR"
    document.getElementById('btn-show-qr').addEventListener('click', async function() {
      const btn = this;
      btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Đang xử lý...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      const orderId = window.pdfPayload.MA_SO_HO_SO; // VD: NCN-1234
      const amount = finalAmount;
      // Chỉ lấy phần số của orderId làm orderCode cho PayOS (PayOS yêu cầu orderCode là số nguyên dương <= 9007199254740991)
      const orderCodeNum = parseInt(orderId.replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000000);

      // --- TRƯỜNG HỢP MIỄN PHÍ 100% ---
      if (amount === 0) {
        try {
          btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Đang xuất PDF miễn phí...';
          const pdfRes = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.pdfPayload)
          });
          if (!pdfRes.ok) throw new Error("Lỗi xuất PDF");
          const blob = await pdfRes.blob();
          const url = window.URL.createObjectURL(blob);
          
          btn.style.display = 'none';
          const qrArea = document.getElementById('qr-payment-area');
          qrArea.style.display = 'block';
          qrArea.innerHTML = `
            <div style="color: #10b981; font-size: 20px; font-weight: bold; margin-bottom: 15px;">🎉 Mở Khóa Thành Công (Miễn phí)!</div>
            <p style="color: #334155; margin-bottom: 15px;">Báo cáo PDF đã được tạo thành công.</p>
            <a href="${url}" target="_blank" download="Bao-Cao-Dinh-Vi-Tuong-Lai-${profile.fullName.replace(/\s+/g, '-')}.pdf" style="background: #10b981; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">TẢI FILE PDF VỀ MÁY NGAY</a>
          `;
        } catch(err) {
          console.error(err);
          btn.innerHTML = 'Có lỗi xảy ra. Thử lại sau.';
          btn.disabled = false;
        }
        return; // Dừng luồng tại đây, không gọi PayOS
      }

      // --- TRƯỜNG HỢP CẦN THANH TOÁN ---
      try {
        // 1. Tạo đơn hàng PENDING trên Firestore
        await db.collection('orders').doc(orderCodeNum.toString()).set({
          orderId: orderId,
          orderCode: orderCodeNum,
          amount: amount,
          status: 'PENDING',
          customerName: profile.fullName,
          customerPhone: profile.phone,
          payload: window.pdfPayload,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Gọi API PayOS để lấy thông tin thanh toán
        const res = await fetch('https://ncn-academy-web.vercel.app/api/payos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderCode: orderCodeNum,
            amount: amount,
            description: `NCN ${orderCodeNum}`,
            buyerName: profile.fullName,
            buyerPhone: profile.phone
          })
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Không thể tạo link thanh toán");

        btn.style.display = 'none';
        
        // 3. Hiển thị QR Code từ PayOS
        const qrArea = document.getElementById('qr-payment-area');
        qrArea.style.display = 'block';
        
        // Tạo URL QR VietQR chuẩn từ thông tin PayOS trả về
        const qrImgUrl = `https://img.vietqr.io/image/${data.data.bin}-${data.data.accountNumber}-compact2.png?amount=${data.data.amount}&addInfo=${encodeURIComponent(data.data.description)}&accountName=${encodeURIComponent(data.data.accountName)}`;

        qrArea.innerHTML = `
          <h4 style="color: #0f172a; margin-bottom: 10px;">Quét mã QR dưới đây để thanh toán</h4>
          <p style="color: #10b981; font-size: 18px; font-weight: bold; margin-bottom: 10px;">Giá thanh toán: ${amount.toLocaleString('vi-VN')} VNĐ</p>
          <p style="color: #ef4444; font-weight: bold; margin-bottom: 15px;">Nội dung chuyển khoản: <span style="color:#2563eb">${data.data.description}</span></p>
          
          <img src="${qrImgUrl}" alt="QR Code PayOS" style="max-width: 250px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px;">
          
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Hệ thống đang tự động lắng nghe giao dịch. Vui lòng không đóng trang này.<br><br>💡 <b>Lưu ý dành cho điện thoại:</b> Bạn có thể chụp ảnh màn hình mã QR này, sau đó mở ứng dụng Ngân hàng và chọn tính năng "Quét mã từ thư viện ảnh".</p>
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #f59e0b; font-weight: bold; font-size: 14px;">
            <span class="spinner" style="width:16px;height:16px;border:2px solid #f59e0b;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Đang chờ thanh toán...
          </div>
        `;

        // 4. Lắng nghe Realtime Firestore để tự động tải PDF khi Backend đã tạo xong
        const unsubscribe = db.collection('orders').doc(orderCodeNum.toString())
          .onSnapshot(async (doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data.status === 'PAID' && !data.pdfBase64) {
                qrArea.innerHTML = `
                  <div style="padding: 20px 0;">
                    <h3 style="color: #10b981; margin-bottom: 15px;">🎉 Đã nhận thanh toán! Đang tạo Báo cáo & Gửi Email...</h3>
                    <div class="spinner" style="margin: 0 auto; width:30px;height:30px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;display:block;animation:spin 1s linear infinite;"></div>
                  </div>
                `;
              }
              
              if (data.status === 'PAID' && data.pdfBase64) {
                unsubscribe(); // Dừng lắng nghe
                
                try {
                  // Chuyển Base64 thành Blob
                  const byteCharacters = atob(data.pdfBase64);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/pdf' });
                  
                  const url = window.URL.createObjectURL(blob);
                  
                  qrArea.innerHTML = `
                    <div style="padding: 20px 0;">
                      <h3 style="color: #10b981; margin-bottom: 10px;">🎉 Thanh toán & Tải Báo cáo thành công!</h3>
                      <p style="color: #475569; font-weight: 500; margin-bottom: 15px;">Báo cáo đã sẵn sàng và <b>cũng đã được gửi vào Email</b> của bạn. Vui lòng bấm nút dưới đây để tải về:</p>
                      <a href="${url}" download="Bao-Cao-Dinh-Vi-Tuong-Lai-${profile.fullName.replace(/\s+/g, '-')}.pdf" style="background: #10b981; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block;">LƯU BÁO CÁO VỀ MÁY</a>
                    </div>
                  `;
                } catch (pdfErr) {
                  console.error(pdfErr);
                  qrArea.innerHTML = `<div style="color: red; padding: 20px 0;">Đã tạo PDF nhưng có lỗi khi hiển thị. Vui lòng kiểm tra Email hoặc liên hệ Admin.</div>`;
                }
              }
            }
          });

      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối PayOS: " + err.message);
        btn.innerHTML = '💳 THANH TOÁN QUA MÃ QR';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });


    // === NEW PREVIEW FETCH LOGIC ===
    const previewContainer = document.getElementById('free-preview-container');
    if (previewContainer) {
      previewContainer.classList.remove('hidden');
      document.getElementById('preview-loading').style.display = 'block';
      document.getElementById('preview-content').classList.add('hidden');
      
      fetch('https://ncn-academy-web.vercel.app/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(window.pdfPayload)
      })
      .then(r => r.json())
      .then(data => {
        document.getElementById('preview-p1').innerText = data.AI_PAGE3_P1 || '';
        document.getElementById('preview-p2').innerText = data.AI_PAGE3_P2 || '';
        document.getElementById('preview-p3').innerText = data.AI_PAGE3_P3 || '';
        
        const colors = { R: '#8b5cf6', I: '#3b82f6', A: '#ec4899', S: '#10b981', E: '#f59e0b', C: '#64748b' };
        const labels = { R: 'Thực tế (Realistic)', I: 'Nghiên cứu (Investigative)', A: 'Nghệ thuật (Artistic)', S: 'Xã hội (Social)', E: 'Quản lý (Enterprising)', C: 'Tổ chức (Conventional)' };
        let barsHtml = '';
        const pct = window.pdfPayload;
        const scores = [
          { k: 'R', v: pct.R_PCT }, { k: 'I', v: pct.I_PCT }, { k: 'A', v: pct.A_PCT },
          { k: 'S', v: pct.S_PCT }, { k: 'E', v: pct.E_PCT }, { k: 'C', v: pct.C_PCT }
        ];
        
        scores.forEach(s => {
          barsHtml += "<div style='margin-bottom: 12px'><div style='font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 6px;'>" + s.k + " — " + labels[s.k] + "</div><div style='width: 100%; background: #f1f5f9; border-radius: 6px; height: 12px; overflow: hidden;'><div style='height: 100%; background: " + colors[s.k] + "; width: " + s.v + "%; border-radius: 6px;'></div></div></div>";
        });
        
        document.getElementById('preview-holland-bars').innerHTML = barsHtml;
        
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').classList.remove('hidden');
      })
      .catch(e => {
         console.error('Preview error', e);
         previewContainer.style.display = 'none';
      });
    }

  } catch (err) {
    console.error('Lỗi thực thi Universal Layered Algorithm v5.0:', err);
    alert('Đã xảy ra sự cố trong quá trình phân tích ma trận. Vui lòng thử lại!');
  }
}
