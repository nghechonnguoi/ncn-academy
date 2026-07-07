"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle,
  GraduationCap, Wrench, User, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/hooks/useAssessment";
import { toast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════════════
//  ĐỊNH NGHĨA 42 CÂU HỎI GỐC (từ data/questions.json)
//  18 Holland + 12 MBTI + 12 Ikigai/Constraint
// ═══════════════════════════════════════════════════════════════════════════════

type QuestionType = "likert" | "ab" | "choice" | "textarea" | "talent";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  category?: string;
  dimension?: string;
  options?: { value: string; text: string }[];
}

const QUESTIONS: Question[] = [
  // ── Holland RIASEC — 18 câu, Likert 1–5 ─────────────────────────────────
  { id:"Q_R1", type:"likert", category:"R",
    text:"Bạn thích tự tay tháo lắp, sửa chữa đồ điện/máy móc, hoặc nghịch phá rồi ráp lại một thiết bị để tìm hiểu cơ chế hoạt động." },
  { id:"Q_R3", type:"likert", category:"R",
    text:"Bạn cảm thấy hứng thú khi nhìn thấy một công trình xây dựng, một cỗ máy vận hành, hoặc xem phim tài liệu về kỹ thuật chế tạo." },
  { id:"Q_R4", type:"likert", category:"R",
    text:"Nếu được chọn, bạn thích học nghề có kết quả nhìn thấy rõ ràng (sản phẩm, công trình, thiết bị) hơn công việc xử lý thông tin trừu tượng." },
  { id:"Q_I1", type:"likert", category:"I",
    text:"Khi gặp hiện tượng tự nhiên kỳ lạ (sấm sét, nhật thực, cầu vồng...), bạn chủ động tìm hiểu nguyên nhân khoa học thay vì chỉ ngắm nhìn." },
  { id:"Q_I2", type:"likert", category:"I",
    text:"Bạn thích giải câu đố logic, bài toán tư duy, chơi cờ vua/game chiến thuật, hoặc thách thức bản thân với đề thi khó hơn mức cần thiết." },
  { id:"Q_I3", type:"likert", category:"I",
    text:"Bạn thường đọc thêm sách về khoa học, công nghệ, lịch sử, hoặc triết học ngoài giờ học vì tự nhiên tò mò, không phải vì bắt buộc." },
  { id:"Q_A1", type:"likert", category:"A",
    text:"Bạn có thói quen tự viết nhật ký, sáng tác thơ/truyện, vẽ phác thảo, hoặc biên tập video/ảnh theo phong cách riêng của mình." },
  { id:"Q_A3", type:"likert", category:"A",
    text:"Bạn dễ nhận ra sự khác biệt tinh tế về màu sắc, bố cục, phong cách thẩm mỹ (trang phục, thiết kế phòng, bao bì sản phẩm...) mà nhiều người không để ý." },
  { id:"Q_A5", type:"likert", category:"A",
    text:"Bạn chơi hoặc từng học một nhạc cụ, tham gia CLB nhiếp ảnh, kịch nghệ, vẽ, múa, hoặc bất kỳ hình thức nghệ thuật nào vì thực sự yêu thích." },
  { id:"Q_S1", type:"likert", category:"S",
    text:"Khi bạn bè có chuyện buồn hoặc rắc rối, họ thường tìm đến bạn để tâm sự, và bạn thực sự muốn giúp — không chỉ vì lịch sự." },
  { id:"Q_S2", type:"likert", category:"S",
    text:"Bạn tìm thấy ý nghĩa khi kết quả công sức của mình trực tiếp cải thiện cuộc sống hoặc cảm xúc của người khác." },
  { id:"Q_S4", type:"likert", category:"S",
    text:"Bạn có khả năng đọc được cảm xúc của người khác khá tốt — biết khi nào nên nói, khi nào nên im lặng và lắng nghe." },
  { id:"Q_E1", type:"likert", category:"E",
    text:"Bạn tự nguyện đứng ra tổ chức, điều phối nhóm trong bài tập lớn hoặc sự kiện — và cảm thấy hứng khởi khi có vai trò dẫn dắt." },
  { id:"Q_E3", type:"likert", category:"E",
    text:"Bạn đã từng bán hàng online, làm affiliate, tổ chức sự kiện nhỏ kiếm tiền, hoặc mơ về việc tự kinh doanh riêng." },
  { id:"Q_E5", type:"likert", category:"E",
    text:"Khi đọc về các CEO, doanh nhân thành công, bạn cảm thấy bị cuốn hút và muốn học theo hành trình của họ." },
  { id:"Q_C1", type:"likert", category:"C",
    text:"Bạn luôn lập kế hoạch học tập/sinh hoạt trước (to-do list, lịch học tuần, mục tiêu tháng...) và lo lắng khi không có kế hoạch rõ ràng." },
  { id:"Q_C2", type:"likert", category:"C",
    text:"Bạn rất chú trọng sự chính xác — khi làm bài, bạn kiểm tra lại ít nhất 1–2 lần để chắc chắn không có lỗi nhỏ nào." },
  { id:"Q_C3", type:"likert", category:"C",
    text:"Bạn thấy thoải mái, thậm chí thích thú khi làm việc với bảng tính Excel, sổ theo dõi quỹ lớp, hoặc hệ thống ghi chép số liệu có cấu trúc." },

  // ── MBTI — 12 câu, chọn A/B ──────────────────────────────────────────────
  { id:"Q_M1", type:"ab", dimension:"EI",
    text:"Sau một tuần học mệt mỏi, bạn nạp lại năng lượng bằng cách nào nhiều hơn? (A) Ra ngoài gặp bạn bè, tụ tập đông vui / (B) Ở một mình, đọc sách, nghe nhạc hoặc xem phim yêu thích." },
  { id:"Q_M2", type:"ab", dimension:"EI",
    text:"Trong các buổi thảo luận nhóm, bạn thường làm gì? (A) Nói ra suy nghĩ ngay khi nảy ra, thoải mái phát biểu dù chưa nghĩ xong / (B) Lắng nghe hết, tổng hợp trong đầu rồi mới phát biểu khi đã chắc chắn." },
  { id:"Q_M3", type:"ab", dimension:"EI",
    text:"Bạn nhận ra mình thuộc kiểu nào hơn? (A) Có nhiều bạn bè, dễ làm quen người lạ, thích không khí đông vui / (B) Có ít bạn thân nhưng rất sâu sắc, thích không gian yên tĩnh và cuộc trò chuyện có chiều sâu." },
  { id:"Q_M4", type:"ab", dimension:"SN",
    text:"Khi học một môn mới, bạn tiếp cận theo cách nào? (A) Tìm ví dụ thực tế, bước đi cụ thể để làm ngay — học qua thực hành / (B) Muốn hiểu rõ bức tranh tổng thể, nguyên lý sâu xa trước khi bắt tay vào làm." },
  { id:"Q_M5", type:"ab", dimension:"SN",
    text:"Khi lên kế hoạch cho mục tiêu quan trọng, bạn suy nghĩ theo hướng nào? (A) Từ hiện tại — những bước đi thực tế, nguồn lực có sẵn ngay bây giờ / (B) Từ tương lai — hình dung kết quả mơ ước, rồi ngược lại tìm đường đi." },
  { id:"Q_M6", type:"ab", dimension:"SN",
    text:"Bạn tin tưởng điều gì hơn khi đưa ra quyết định lớn? (A) Kinh nghiệm thực tế đã được kiểm chứng, dữ liệu và bằng chứng cụ thể / (B) Linh cảm mạnh mẽ và khả năng nhìn thấy các xu hướng tương lai." },
  { id:"Q_M7", type:"ab", dimension:"TF",
    text:"Khi đưa ra phán xét về một tình huống xảy ra trong nhóm, bạn dựa vào điều gì? (A) Logic, quy tắc và sự công bằng khách quan — ai đúng ai sai / (B) Bối cảnh cảm xúc, hoàn cảnh từng người và sự hòa hợp của cả nhóm." },
  { id:"Q_M8", type:"ab", dimension:"TF",
    text:"Khi góp ý cho bài làm của bạn bè, bạn thường: (A) Nói thẳng, thành thật về các điểm yếu dù có thể khiến bạn ấy không vui nhất thời / (B) Tìm cách nói tế nhị, nhấn mạnh điểm tốt trước để bạn cảm thấy được tôn trọng." },
  { id:"Q_M9", type:"ab", dimension:"TF",
    text:"Điều gì khiến bạn hài lòng hơn sau khi hoàn thành việc? (A) Biết rằng mình đã làm đúng quy trình, đạt kết quả đo lường được cụ thể / (B) Cảm giác mọi người xung quanh đều vui vẻ và cảm thấy tốt hơn." },
  { id:"Q_M10", type:"ab", dimension:"JP",
    text:"Trước một sự kiện lớn (thi cuối kỳ, chuyến dã ngoại...), bạn thường: (A) Chuẩn bị kỹ từ trước, lên lịch chi tiết và tuân theo đúng kế hoạch / (B) Để mọi thứ linh hoạt, chuẩn bị những gì cần thiết nhưng không cần cứng nhắc." },
  { id:"Q_M11", type:"ab", dimension:"JP",
    text:"Bạn cảm thấy dễ chịu hơn trong môi trường nào? (A) Deadline rõ ràng, nhiệm vụ được phân công cụ thể, mọi thứ được chốt trước / (B) Có sự linh hoạt, được thay đổi kế hoạch theo tình hình." },
  { id:"Q_M12", type:"ab", dimension:"JP",
    text:"Khi còn thời gian rảnh và chưa đến deadline, bạn thường làm gì? (A) Tranh thủ hoàn thành việc trước để rảnh rang sau / (B) Giữ lại khoảng trống đó để tiếp tục suy nghĩ và hoàn thiện vào cuối." },

  // ── Ikigai & Constraint — 12 câu ────────────────────────────────────────
  { id:"Q_IKIGAI_DREAM", type:"textarea",
    text:"Nếu tiền bạc không phải vấn đề và bạn có thể làm bất cứ nghề nào, bạn muốn làm gì? Hãy mô tả cụ thể — không cần thực tế, cứ viết điều bạn thực sự mơ ước." },
  { id:"Q_IKIGAI_TALENT_1", type:"talent",
    text:"Khi nói chuyện, thuyết trình hoặc giải thích một vấn đề, người khác thường hiểu ngay và cảm thấy bị cuốn hút — bạn thấy mình làm tốt điều này ở mức nào?" },
  { id:"Q_IKIGAI_TALENT_2", type:"talent",
    text:"Bạn có khả năng nhìn thấy bức tranh tổng thể, phân tích tình huống phức tạp, hoặc đưa ra kế hoạch chiến lược — bạn tự đánh giá năng lực chiến lược & tâm lý của mình ở mức nào?" },
  { id:"Q_IKIGAI_TALENT_3", type:"talent",
    text:"Bạn có xu hướng học nhanh và làm tốt các kỹ năng thực hành tay chân — nấu ăn, sửa chữa, cắt may, chế tác, vận hành thiết bị — mà không cần hướng dẫn quá nhiều. Bạn tự đánh giá ở mức nào?" },
  { id:"Q_IKIGAI_VALUE", type:"choice",
    text:"Trong tương lai, điều nào quan trọng nhất với bạn trong công việc?",
    options:[
      { value:"MONEY",       text:"Thu nhập cao — sự ổn định tài chính là nền tảng của mọi thứ" },
      { value:"IMPACT",      text:"Tạo ra tác động tích cực — công việc phải có ý nghĩa với cộng đồng" },
      { value:"FREEDOM",     text:"Tự do — tự quyết thời gian, địa điểm và cách làm việc" },
      { value:"MASTERY",     text:"Làm chủ chuyên môn — trở thành người giỏi nhất trong lĩnh vực" },
      { value:"RECOGNITION", text:"Được công nhận — có địa vị, danh tiếng và sự ngưỡng mộ từ xã hội" },
    ]},
  { id:"Q_IKIGAI_STRENGTH", type:"choice",
    text:"Bạn bè hoặc thầy cô thường khen bạn nhất về điều gì?",
    options:[
      { value:"COMMUNICATE", text:"Nói chuyện cuốn hút, diễn đạt rõ ràng, dễ thuyết phục người khác" },
      { value:"ANALYZE",     text:"Tư duy sắc bén, phân tích vấn đề sâu, luôn hỏi \"Tại sao?\"" },
      { value:"CREATE",      text:"Sáng tạo, luôn có ý tưởng mới lạ, nhìn mọi thứ theo góc độ khác biệt" },
      { value:"ORGANIZE",    text:"Ngăn nắp, có tổ chức, luôn làm mọi thứ bài bản và đúng hạn" },
      { value:"EMPATHIZE",   text:"Đồng cảm tốt, biết lắng nghe, mọi người cảm thấy được hiểu khi ở cạnh bạn" },
    ]},
  { id:"Q_IKIGAI_AVOID", type:"choice",
    text:"Điều nào dưới đây bạn chắc chắn KHÔNG muốn có trong công việc tương lai?",
    options:[
      { value:"AVOID_ROUTINE",   text:"Làm đi làm lại một việc không đổi ngày qua ngày" },
      { value:"AVOID_PEOPLE",    text:"Phải tiếp xúc với quá nhiều người lạ liên tục, không có không gian riêng" },
      { value:"AVOID_PRESSURE",  text:"Áp lực cao, deadline dồn dập, luôn trong tình trạng khẩn cấp" },
      { value:"AVOID_ABSTRACT",  text:"Chỉ làm việc với lý thuyết, số liệu — không thấy kết quả thực tế rõ ràng" },
      { value:"AVOID_RULES",     text:"Bị kiểm soát chặt bởi quy trình, không có không gian sáng tạo hay tự quyết" },
    ]},
  { id:"Q_CONSTRAINT_CLINICAL", type:"choice",
    text:"🏥 Nếu được gợi ý nghề trong lĩnh vực Y tế / Sức khỏe, bạn cảm thấy thế nào về việc tiếp xúc trực tiếp với bệnh nhân, máu và thương tích?",
    options:[
      { value:"CLINICAL_OK",    text:"✅ Hoàn toàn thoải mái — tôi muốn trực tiếp chăm sóc, điều trị bệnh nhân" },
      { value:"CLINICAL_MILD",  text:"🟡 Tạm ổn — có thể chịu được, nhưng không phải thế mạnh của tôi" },
      { value:"CLINICAL_AVOID", text:"❌ Tôi sợ máu / không muốn tiếp xúc thương tích — muốn làm y tế theo hướng khác" },
      { value:"CLINICAL_NA",    text:"➖ Không liên quan — tôi không định làm trong lĩnh vực y tế" },
    ]},
  { id:"Q_CONSTRAINT_ARTS", type:"choice",
    text:"🎭 Nếu được gợi ý nghề Nghệ sĩ biểu diễn / Diễn viên / Ca sĩ / Vũ công — bạn cảm thấy thế nào về thu nhập không ổn định trong nhiều năm đầu?",
    options:[
      { value:"ARTS_OK",    text:"✅ Tôi chấp nhận — đam mê và biểu diễn quan trọng hơn thu nhập ổn định" },
      { value:"ARTS_MILD",  text:"🟡 Tôi do dự — thích nhưng lo ngại rủi ro tài chính dài hạn" },
      { value:"ARTS_AVOID", text:"❌ Tôi không muốn nghề biểu diễn sân khấu/truyền thông" },
      { value:"ARTS_NA",    text:"➖ Không liên quan — tôi không có định hướng nghệ thuật biểu diễn" },
    ]},
  { id:"Q_CONSTRAINT_EDU", type:"choice",
    text:"🏫 Nếu được gợi ý nghề Giáo viên / Giảng viên / Nhà đào tạo — bạn cảm thấy thế nào về việc gắn bó lâu dài với môi trường dạy học?",
    options:[
      { value:"EDU_OK",    text:"✅ Tôi rất muốn — dạy học và truyền cảm hứng là điều tôi thực sự yêu thích" },
      { value:"EDU_MILD",  text:"🟡 Có thể — tôi thích chia sẻ nhưng chưa chắc muốn đây là nghề chính" },
      { value:"EDU_AVOID", text:"❌ Không phù hợp — tôi không muốn đứng lớp hoặc đào tạo lâu dài" },
      { value:"EDU_NA",    text:"➖ Không liên quan — tôi không có định hướng vào giáo dục" },
    ]},
  { id:"Q_CONSTRAINT_BIZ", type:"choice",
    text:"💼 Nếu được gợi ý nghề Doanh nhân / Khởi nghiệp / Tự kinh doanh — bạn cảm thấy thế nào về rủi ro thất bại và thu nhập không cố định?",
    options:[
      { value:"BIZ_OK",    text:"✅ Tôi chấp nhận rủi ro — tôi thích làm chủ và không ngại bắt đầu lại từ đầu" },
      { value:"BIZ_MILD",  text:"🟡 Tôi muốn thử — nhưng muốn có lương ổn định trước rồi mới khởi nghiệp" },
      { value:"BIZ_AVOID", text:"❌ Tôi muốn việc làm ổn định, không thích rủi ro tài chính cao" },
    ]},
  { id:"Q_CONSTRAINT_LAW", type:"choice",
    text:"⚖️ Nếu được gợi ý nghề Luật sư / Pháp chế — bạn có sẵn sàng theo học ngành Luật (5+ năm) và vượt qua các kỳ thi chứng chỉ hành nghề khắt khe?",
    options:[
      { value:"LAW_OK",    text:"✅ Hoàn toàn sẵn sàng — tôi thích môi trường pháp lý và tranh tụng" },
      { value:"LAW_MILD",  text:"🟡 Có thể cân nhắc — nếu hướng nghề phù hợp tôi sẵn sàng đầu tư" },
      { value:"LAW_AVOID", text:"❌ Không — tôi không muốn ngành pháp lý" },
      { value:"LAW_NA",    text:"➖ Không liên quan — tôi chưa nghĩ đến hướng này" },
    ]},
];

const TOTAL = QUESTIONS.length; // 42

// ── Màu cho từng nhóm Holland ──────────────────────────────────────────────
const RIASEC_COLOR: Record<string, { bg: string; ring: string; text: string; dot: string }> = {
  R:{ bg:"bg-amber-50",  ring:"ring-amber-400",  text:"text-amber-700",  dot:"bg-amber-400" },
  I:{ bg:"bg-blue-50",   ring:"ring-blue-400",   text:"text-blue-700",   dot:"bg-blue-400" },
  A:{ bg:"bg-pink-50",   ring:"ring-pink-400",   text:"text-pink-700",   dot:"bg-pink-400" },
  S:{ bg:"bg-green-50",  ring:"ring-green-400",  text:"text-green-700",  dot:"bg-green-400" },
  E:{ bg:"bg-orange-50", ring:"ring-orange-400", text:"text-orange-700", dot:"bg-orange-400" },
  C:{ bg:"bg-violet-50", ring:"ring-violet-400", text:"text-violet-700", dot:"bg-violet-400" },
};

// ── Nhãn đầy đủ loại câu hỏi ──────────────────────────────────────────────
const SECTION_LABEL: Record<string, string> = {
  R:"Nhóm R — Thực Tế", I:"Nhóm I — Nghiên Cứu", A:"Nhóm A — Nghệ Thuật",
  S:"Nhóm S — Xã Hội",  E:"Nhóm E — Dám Nghĩ Dám Làm", C:"Nhóm C — Quy Củ",
  MBTI:"Phong Cách Tư Duy (MBTI)", IKIGAI:"Định Vị Bản Thân (Ikigai)",
};

function getSectionKey(q: Question): string {
  if (q.category) return q.category;
  if (q.dimension) return "MBTI";
  return "IKIGAI";
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AssessmentPage() {
  const router = useRouter();
  const { submit, isSubmitting } = useAssessment();

  // Step 0: chọn track, Step 1: profile form, Step 2+: câu hỏi
  const [step, setStep] = useState<"track" | "profile" | "quiz">("track");
  const [track, setTrack] = useState<"university" | "vocational" | null>(null);

  // Profile form
  const [profile, setProfile] = useState({
    fullName: "", birthDate: "", email: "", phone: "",
    favoriteSubjects: "", pastActivities: "", familyOrientation: "", specialTalents: "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [textareaValue, setTextareaValue] = useState("");

  const q = QUESTIONS[currentIdx];
  const sectionKey = q ? getSectionKey(q) : "";
  const color = RIASEC_COLOR[sectionKey] ?? { bg:"bg-slate-50", ring:"ring-[#635bff]", text:"text-[#635bff]", dot:"bg-[#635bff]" };
  const progress = (Object.keys(answers).length / TOTAL) * 100;

  // ── Validate profile ────────────────────────────────────────────────────
  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!profile.fullName.trim())  errs.fullName  = "Vui lòng nhập họ tên";
    if (!profile.birthDate.trim()) errs.birthDate = "Vui lòng nhập ngày sinh";
    if (!profile.email.trim())     errs.email     = "Vui lòng nhập email";
    if (!profile.phone.trim())     errs.phone     = "Vui lòng nhập số điện thoại";
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Trả lời câu hỏi ────────────────────────────────────────────────────
  const handleAnswer = (value: string | number) => {
    setAnswers(prev => ({ ...prev, [q.id]: value }));
    setTimeout(() => {
      if (currentIdx < TOTAL - 1) {
        setCurrentIdx(i => i + 1);
        setTextareaValue("");
        window.scrollTo(0, 0);
      }
    }, 200);
  };

  const handleTextareaConfirm = () => {
    const val = textareaValue.trim() || "(Không điền)";
    setAnswers(prev => ({ ...prev, [q.id]: val }));
    if (currentIdx < TOTAL - 1) {
      setCurrentIdx(i => i + 1);
      setTextareaValue("");
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const result = await submit(answersArray, track ?? "university", profile);

      // Đăng ký lead để kích hoạt chuỗi mail chăm sóc khách hàng (không chặn điều hướng nếu lỗi)
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          name: profile.fullName,
          hollandCode: result.riasecResult?.topCode,
        }),
      }).catch(() => {});

      toast({ title: "Phân tích hoàn tất! 🎉", description: "Đang chuyển đến kết quả của bạn..." });
      router.push(`/dashboard?assessment=${result.assessment.id}`);
    } catch {
      toast({ title: "Có lỗi xảy ra", description: "Vui lòng thử lại", variant: "destructive" });
    }
  };

  const isLastQuestion = currentIdx === TOTAL - 1;
  const isCurrentAnswered = answers[q?.id] !== undefined || (q?.type === "textarea" && textareaValue.trim().length > 0);

  // ════════════════════════════════════════════════════════════════════════════
  //  BƯỚC 0 — CHỌN TRACK
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "track") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#635bff]/10 text-[#635bff] text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 bg-[#635bff] rounded-full animate-pulse" />
              Trắc Nghiệm Hướng Nghiệp — NCN Academy
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-3">Bạn đang định hướng theo con đường nào?</h1>
            <p className="text-gray-500 text-base max-w-md mx-auto">Câu trả lời giúp hệ thống gợi ý nghề phù hợp nhất với kế hoạch của bạn.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setTrack("university"); setStep("profile"); }}
              className="group relative bg-white rounded-3xl border-2 border-gray-100 p-8 text-left hover:border-[#635bff] hover:shadow-xl hover:shadow-[#635bff]/10 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#635bff] transition-colors">
                <GraduationCap className="w-7 h-7 text-[#635bff] group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Học đại học / cao đẳng</h2>
              <p className="text-sm text-gray-500 leading-relaxed">Tôi đang hoặc có kế hoạch học đại học, cao đẳng chính quy (2–4 năm).</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#635bff] opacity-0 group-hover:opacity-100 transition-opacity">
                Chọn con đường này <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              onClick={() => { setTrack("vocational"); setStep("profile"); }}
              className="group relative bg-white rounded-3xl border-2 border-gray-100 p-8 text-left hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-amber-500 transition-colors">
                <Wrench className="w-7 h-7 text-amber-500 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Học nghề — đi làm luôn</h2>
              <p className="text-sm text-gray-500 leading-relaxed">Tôi muốn học nghề ngắn hạn (vài tuần – 2 năm) tại trung tâm, trường nghề, hoặc học việc trực tiếp.</p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Chọn con đường này <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Bạn sẽ điền thông tin cá nhân và làm bài trắc nghiệm 42 câu (Holland + MBTI + Ikigai).
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  BƯỚC 1 — THÔNG TIN CÁ NHÂN
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "profile") {
    const inputCls = (field: string) => cn(
      "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 transition-all",
      profileErrors[field] ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
    );
    const trackColor = track === "vocational" ? "text-amber-600 bg-amber-50" : "text-[#635bff] bg-violet-50";

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-4 py-12">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={cn("inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4", trackColor)}>
              {track === "vocational" ? <Wrench className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              {track === "vocational" ? "Học nghề — Đi làm luôn" : "Học Đại học / Cao đẳng"}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Thông tin học sinh</h1>
            <p className="text-sm text-gray-500">Vui lòng điền chính xác để hệ thống phân tích đúng nhất.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Nguyễn Văn An" value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                className={inputCls("fullName")} />
              {profileErrors.fullName && <p className="text-xs text-red-500 mt-1">{profileErrors.fullName}</p>}
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ngày tháng năm sinh <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-1">(DD/MM/YYYY — điền chính xác để tính nhân số)</span>
              </label>
              <input type="text" placeholder="15/08/2007" value={profile.birthDate}
                onChange={e => setProfile(p => ({ ...p, birthDate: e.target.value }))}
                className={inputCls("birthDate")} />
              {profileErrors.birthDate && <p className="text-xs text-red-500 mt-1">{profileErrors.birthDate}</p>}
            </div>

            {/* Email + SĐT */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="email@gmail.com" value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className={inputCls("email")} />
                {profileErrors.email && <p className="text-xs text-red-500 mt-1">{profileErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" placeholder="0912 345 678" value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className={inputCls("phone")} />
                {profileErrors.phone && <p className="text-xs text-red-500 mt-1">{profileErrors.phone}</p>}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-400 mb-4">Thông tin thêm (không bắt buộc — nhưng giúp kết quả chính xác hơn)</p>

              {/* Môn học / năng khiếu */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Môn học yêu thích hoặc năng khiếu nổi bật</label>
                <textarea rows={2} placeholder="Ví dụ: Giỏi Toán, thích vẽ, giỏi tiếng Anh, đam mê âm nhạc..."
                  value={profile.favoriteSubjects}
                  onChange={e => setProfile(p => ({ ...p, favoriteSubjects: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 resize-none hover:border-gray-300 transition-all" />
              </div>

              {/* Hoạt động nổi bật */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hoạt động nổi bật đã làm</label>
                <textarea rows={2} placeholder="Ví dụ: Làm MC sự kiện, bán hàng online, tham gia CLB robotics, đoạt giải cuộc thi..."
                  value={profile.pastActivities}
                  onChange={e => setProfile(p => ({ ...p, pastActivities: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 resize-none hover:border-gray-300 transition-all" />
              </div>

              {/* Định hướng gia đình */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Định hướng của gia đình (nếu có)</label>
                <textarea rows={2} placeholder="Ví dụ: Bố mẹ muốn học y dược, hoặc muốn con theo ngành kinh tế, hoặc tôn trọng quyết định của tôi..."
                  value={profile.familyOrientation}
                  onChange={e => setProfile(p => ({ ...p, familyOrientation: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 resize-none hover:border-gray-300 transition-all" />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={() => { if (validateProfile()) setStep("quiz"); }}
              className="w-full bg-[#635bff] hover:bg-[#5248e8] text-white h-12 rounded-xl font-semibold text-sm gap-2 mt-2"
            >
              Bắt đầu bài trắc nghiệm
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <button onClick={() => setStep("track")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-4 mx-auto">
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại chọn lộ trình
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  BƯỚC 2 — 42 CÂU HỎI
  // ════════════════════════════════════════════════════════════════════════════
  const LIKERT = [
    { value:1, label:"Hoàn toàn không đúng" },
    { value:2, label:"Ít khi đúng" },
    { value:3, label:"Vừa phải / Trung hòa" },
    { value:4, label:"Khá đúng / Thích" },
    { value:5, label:"Hoàn toàn chính xác / Rất đam mê" },
  ];
  const TALENT = [
    { value:1, label:"1 — Rất yếu / Chưa bao giờ làm tốt" },
    { value:2, label:"2 — Dưới trung bình / Còn nhiều hạn chế" },
    { value:3, label:"3 — Trung bình / Bình thường như mọi người" },
    { value:4, label:"4 — Khá tốt / Tự tin & được ghi nhận" },
    { value:5, label:"5 — Rất mạnh / Đây là điểm vượt trội rõ ràng của tôi" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header cố định */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#635bff]">{SECTION_LABEL[sectionKey] || "Câu hỏi"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{currentIdx + 1} / {TOTAL} câu</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#635bff] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-2xl px-4 pt-28 pb-32">
        <div className={cn("rounded-2xl border p-6 sm:p-8 transition-all", color.bg, "border-gray-100")}>
          {/* Nhãn section */}
          <div className={cn("inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5", color.bg, color.text, "ring-1", color.ring)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", color.dot)} />
            {SECTION_LABEL[sectionKey] || "Câu hỏi"}
          </div>

          {/* Câu hỏi */}
          <p className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed mb-6">
            <span className={cn("font-black mr-2", color.text)}>{currentIdx + 1}.</span>
            {q.text}
          </p>

          {/* ── Likert 1–5 ── */}
          {q.type === "likert" && (
            <div className="space-y-2">
              {LIKERT.map(opt => (
                <button key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                    answers[q.id] === opt.value
                      ? "bg-[#635bff] text-white border-[#635bff] shadow-sm"
                      : "bg-white border-gray-100 text-gray-600 hover:border-[#635bff]/40 hover:text-[#635bff]"
                  )}>
                  <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    answers[q.id] === opt.value ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400")}>
                    {opt.value}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Talent 1–5 ── */}
          {q.type === "talent" && (
            <div className="space-y-2">
              {TALENT.map(opt => (
                <button key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                    answers[q.id] === opt.value
                      ? "bg-[#635bff] text-white border-[#635bff] shadow-sm"
                      : "bg-white border-gray-100 text-gray-600 hover:border-[#635bff]/40 hover:text-[#635bff]"
                  )}>
                  <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    answers[q.id] === opt.value ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400")}>
                    {opt.value}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* ── MBTI A/B ── */}
          {q.type === "ab" && (() => {
            const parts = q.text.split(" / ");
            const textA = parts[0]?.replace(/^.*\(A\)\s*/, "").trim() ?? "Đáp án A";
            const textB = parts[1]?.replace(/\s*\(B\)\s*/, "").trim() ?? "Đáp án B";
            return (
              <div className="space-y-3">
                {[{ val:"A", text:textA }, { val:"B", text:textB }].map(opt => (
                  <button key={opt.val}
                    onClick={() => handleAnswer(opt.val)}
                    className={cn(
                      "w-full flex items-start gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all",
                      answers[q.id] === opt.val
                        ? "bg-[#635bff] text-white border-[#635bff] shadow-sm"
                        : "bg-white border-gray-100 text-gray-600 hover:border-[#635bff]/40 hover:text-[#635bff]"
                    )}>
                    <span className={cn("mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                      answers[q.id] === opt.val ? "bg-white/20 text-white" : "bg-gray-50 text-gray-500")}>
                      {opt.val}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* ── Choice (Ikigai/Constraint) ── */}
          {q.type === "choice" && (
            <div className="space-y-2">
              {(q.options ?? []).map(opt => (
                <button key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    "w-full px-5 py-3.5 rounded-xl border text-sm text-left transition-all leading-relaxed",
                    answers[q.id] === opt.value
                      ? "bg-[#635bff] text-white border-[#635bff] shadow-sm"
                      : "bg-white border-gray-100 text-gray-600 hover:border-[#635bff]/40 hover:text-[#635bff]"
                  )}>
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {/* ── Textarea (Dream) ── */}
          {q.type === "textarea" && (
            <div>
              <textarea rows={4}
                placeholder="Nhập ước mơ nghề nghiệp của bạn... (có thể để trống nếu chưa biết)"
                value={textareaValue}
                onChange={e => setTextareaValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 resize-none bg-white mb-3" />
              <Button
                onClick={handleTextareaConfirm}
                className="bg-[#635bff] hover:bg-[#5248e8] text-white gap-2 rounded-xl">
                {isLastQuestion && isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
                ) : (
                  <>{isLastQuestion ? "Xem kết quả" : "Xác nhận & Tiếp tục"} <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <Button variant="ghost" size="sm"
            onClick={() => { if (currentIdx > 0) { setCurrentIdx(i => i - 1); window.scrollTo(0,0); } }}
            disabled={currentIdx === 0}
            className="gap-2 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Câu trước
          </Button>

          <span className="text-xs text-gray-400">
            {currentIdx + 1} / {TOTAL}
          </span>

          {q.type !== "textarea" && (
            isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!isCurrentAnswered || isSubmitting}
                className="bg-[#635bff] hover:bg-[#5248e8] text-white gap-2 rounded-xl">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Xem kết quả</>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => { if (isCurrentAnswered) { setCurrentIdx(i=>i+1); window.scrollTo(0,0); } }}
                disabled={!isCurrentAnswered}
                variant="outline" size="sm"
                className="gap-2 border-[#635bff]/30 text-[#635bff] hover:bg-[#635bff]/5">
                Câu sau <ArrowRight className="w-4 h-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
