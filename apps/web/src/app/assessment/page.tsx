"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/hooks/useAssessment";
import { toast } from "@/hooks/use-toast";

// ── 60 câu hỏi RIASEC (10 câu × 6 nhóm) ───────────────────────────────────
const QUESTIONS = [
  // R — Realistic (Thực tế)
  { id: "R1", text: "Tôi thích làm việc với máy móc, công cụ hoặc thiết bị kỹ thuật", category: "R" },
  { id: "R2", text: "Tôi hứng thú với các hoạt động xây dựng, lắp ráp hoặc sửa chữa", category: "R" },
  { id: "R3", text: "Tôi thích làm việc ngoài trời, tiếp xúc với thiên nhiên", category: "R" },
  { id: "R4", text: "Tôi cảm thấy thoải mái khi làm việc với đôi tay hơn là ngồi bàn giấy", category: "R" },
  { id: "R5", text: "Tôi quan tâm đến các lĩnh vực như kỹ thuật, cơ khí hoặc điện tử", category: "R" },
  { id: "R6", text: "Tôi thích những công việc có kết quả rõ ràng và cụ thể", category: "R" },
  { id: "R7", text: "Tôi thích hoạt động thể chất và rèn luyện sức bền", category: "R" },
  { id: "R8", text: "Tôi muốn làm trong ngành nông nghiệp, lâm nghiệp hoặc môi trường", category: "R" },
  { id: "R9", text: "Tôi thích vận hành máy móc, xe cộ hoặc thiết bị hạng nặng", category: "R" },
  { id: "R10", text: "Tôi giỏi giải quyết các vấn đề kỹ thuật thực tiễn", category: "R" },

  // I — Investigative (Nghiên cứu)
  { id: "I1", text: "Tôi thích phân tích dữ liệu, tìm kiếm quy luật ẩn sau các con số", category: "I" },
  { id: "I2", text: "Tôi hứng thú với nghiên cứu khoa học và thí nghiệm", category: "I" },
  { id: "I3", text: "Tôi thích đọc sách, tìm hiểu về các lý thuyết phức tạp", category: "I" },
  { id: "I4", text: "Tôi giải quyết vấn đề bằng cách thu thập thông tin và phân tích kỹ", category: "I" },
  { id: "I5", text: "Tôi thích toán học, thống kê hoặc lập trình", category: "I" },
  { id: "I6", text: "Tôi hay đặt câu hỏi về cách thức hoạt động của mọi thứ xung quanh", category: "I" },
  { id: "I7", text: "Tôi hứng thú với lĩnh vực y học, sinh học hoặc hóa học", category: "I" },
  { id: "I8", text: "Tôi thích làm việc độc lập hơn là trong nhóm lớn", category: "I" },
  { id: "I9", text: "Tôi muốn tìm hiểu sâu về một chủ đề hơn là biết sơ về nhiều chủ đề", category: "I" },
  { id: "I10", text: "Tôi cảm thấy thỏa mãn khi giải được bài toán khó", category: "I" },

  // A — Artistic (Nghệ thuật)
  { id: "A1", text: "Tôi thích sáng tạo — viết lách, vẽ, âm nhạc hoặc thiết kế", category: "A" },
  { id: "A2", text: "Tôi muốn thể hiện bản thân qua các tác phẩm nghệ thuật", category: "A" },
  { id: "A3", text: "Tôi hay xem phim, đọc văn học và quan tâm đến triết học", category: "A" },
  { id: "A4", text: "Tôi thích môi trường làm việc sáng tạo, không gò bó quy tắc", category: "A" },
  { id: "A5", text: "Tôi giỏi nhìn nhận thẩm mỹ và cảm nhận cái đẹp", category: "A" },
  { id: "A6", text: "Tôi thích thiết kế đồ họa, UI/UX hoặc sản xuất nội dung", category: "A" },
  { id: "A7", text: "Tôi hứng thú với quảng cáo sáng tạo, copywriting hoặc storytelling", category: "A" },
  { id: "A8", text: "Tôi thường nghĩ ngoài khuôn khổ và không thích làm theo lối mòn", category: "A" },
  { id: "A9", text: "Tôi dễ bị thu hút bởi màu sắc, hình ảnh và không gian thẩm mỹ", category: "A" },
  { id: "A10", text: "Tôi muốn sự nghiệp gắn liền với sáng tạo và tự do biểu đạt", category: "A" },

  // S — Social (Xã hội)
  { id: "S1", text: "Tôi thích giúp đỡ, hỗ trợ và tư vấn cho người khác", category: "S" },
  { id: "S2", text: "Tôi muốn làm trong ngành giáo dục, y tế hoặc công tác xã hội", category: "S" },
  { id: "S3", text: "Tôi dễ dàng kết nối và tạo dựng quan hệ với người mới", category: "S" },
  { id: "S4", text: "Tôi thích làm việc nhóm và đóng góp cho cộng đồng", category: "S" },
  { id: "S5", text: "Tôi giỏi lắng nghe và thấu hiểu cảm xúc người khác", category: "S" },
  { id: "S6", text: "Tôi cảm thấy có ý nghĩa khi công việc tạo ra tác động xã hội tích cực", category: "S" },
  { id: "S7", text: "Tôi thích huấn luyện, đào tạo hoặc hướng dẫn người khác", category: "S" },
  { id: "S8", text: "Tôi quan tâm đến phúc lợi cộng đồng và các vấn đề xã hội", category: "S" },
  { id: "S9", text: "Tôi thoải mái khi làm việc trong môi trường đông người", category: "S" },
  { id: "S10", text: "Tôi hứng thú với tâm lý học, nhân sự hoặc công tác từ thiện", category: "S" },

  // E — Enterprising (Dám nghĩ dám làm)
  { id: "E1", text: "Tôi thích lãnh đạo, thuyết phục và tạo ảnh hưởng đến người khác", category: "E" },
  { id: "E2", text: "Tôi muốn khởi nghiệp hoặc điều hành công ty riêng", category: "E" },
  { id: "E3", text: "Tôi giỏi đàm phán, bán hàng và thuyết trình", category: "E" },
  { id: "E4", text: "Tôi hứng thú với kinh doanh, marketing và tài chính", category: "E" },
  { id: "E5", text: "Tôi thích đặt mục tiêu cao và cạnh tranh để đạt kết quả", category: "E" },
  { id: "E6", text: "Tôi cảm thấy hứng khởi khi tiên phong trong lĩnh vực mới", category: "E" },
  { id: "E7", text: "Tôi muốn có thu nhập cao và thăng tiến nhanh trong sự nghiệp", category: "E" },
  { id: "E8", text: "Tôi giỏi ra quyết định nhanh và chịu áp lực tốt", category: "E" },
  { id: "E9", text: "Tôi thích quản lý dự án, đội nhóm hoặc nguồn lực", category: "E" },
  { id: "E10", text: "Tôi tự tin trình bày ý tưởng trước đám đông", category: "E" },

  // C — Conventional (Quy củ)
  { id: "C1", text: "Tôi thích công việc có quy trình rõ ràng, chi tiết và có tổ chức", category: "C" },
  { id: "C2", text: "Tôi giỏi quản lý hồ sơ, dữ liệu và hệ thống tài liệu", category: "C" },
  { id: "C3", text: "Tôi hứng thú với kế toán, tài chính hoặc kiểm toán", category: "C" },
  { id: "C4", text: "Tôi thích làm việc theo tiêu chuẩn và quy định cụ thể", category: "C" },
  { id: "C5", text: "Tôi cảm thấy thoải mái với công việc lặp lại có độ chính xác cao", category: "C" },
  { id: "C6", text: "Tôi chú ý đến chi tiết và ít mắc lỗi trong công việc", category: "C" },
  { id: "C7", text: "Tôi thích môi trường làm việc ổn định, có cấu trúc rõ ràng", category: "C" },
  { id: "C8", text: "Tôi giỏi lên kế hoạch, phân tích ngân sách và tối ưu quy trình", category: "C" },
  { id: "C9", text: "Tôi hứng thú với lĩnh vực hành chính, văn phòng hoặc pháp lý", category: "C" },
  { id: "C10", text: "Tôi tin rằng sự kỷ luật và cẩn thận là chìa khóa thành công", category: "C" },
];

const GROUPS = [
  { key: "R", label: "Nhóm R", subtitle: "Thực Tế", color: "bg-amber-500", light: "bg-amber-50 border-amber-200 text-amber-700" },
  { key: "I", label: "Nhóm I", subtitle: "Nghiên Cứu", color: "bg-blue-500", light: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "A", label: "Nhóm A", subtitle: "Nghệ Thuật", color: "bg-pink-500", light: "bg-pink-50 border-pink-200 text-pink-700" },
  { key: "S", label: "Nhóm S", subtitle: "Xã Hội", color: "bg-green-500", light: "bg-green-50 border-green-200 text-green-700" },
  { key: "E", label: "Nhóm E", subtitle: "Doanh Nhân", color: "bg-orange-500", light: "bg-orange-50 border-orange-200 text-orange-700" },
  { key: "C", label: "Nhóm C", subtitle: "Quy Củ", color: "bg-violet-500", light: "bg-violet-50 border-violet-200 text-violet-700" },
];

const SCALE = [
  { value: 1, label: "Rất không phù hợp" },
  { value: 2, label: "Không phù hợp" },
  { value: 3, label: "Bình thường" },
  { value: 4, label: "Phù hợp" },
  { value: 5, label: "Rất phù hợp" },
];

export default function AssessmentPage() {
  const router = useRouter();
  const { submit, isSubmitting } = useAssessment();
  const [currentGroup, setCurrentGroup] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentGroupKey = GROUPS[currentGroup].key;
  const currentQuestions = QUESTIONS.filter((q) => q.category === currentGroupKey);
  const group = GROUPS[currentGroup];

  const groupAnswered = currentQuestions.filter((q) => answers[q.id]).length;
  const isGroupComplete = groupAnswered === currentQuestions.length;
  const totalAnswered = Object.keys(answers).length;
  const progress = (totalAnswered / QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!isGroupComplete) {
      toast({ title: "Vui lòng trả lời tất cả câu hỏi trong nhóm này", variant: "destructive" });
      return;
    }
    if (currentGroup < GROUPS.length - 1) {
      setCurrentGroup((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isGroupComplete) {
      toast({ title: "Vui lòng trả lời tất cả câu hỏi", variant: "destructive" });
      return;
    }
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const result = await submit(answersArray);
      toast({ title: "Phân tích hoàn tất! 🎉", description: "Đang chuyển đến kết quả của bạn..." });
      router.push(`/dashboard?assessment=${result.assessment.id}`);
    } catch {
      toast({ title: "Có lỗi xảy ra", description: "Vui lòng thử lại", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">Trắc Nghiệm RIASEC</h1>
            <p className="text-xs text-gray-400">{totalAnswered}/{QUESTIONS.length} câu đã trả lời</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1">
              {GROUPS.map((g, i) => (
                <button
                  key={g.key}
                  onClick={() => i < currentGroup && setCurrentGroup(i)}
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-bold transition-all",
                    i < currentGroup
                      ? "bg-[#635bff] text-white"
                      : i === currentGroup
                      ? "ring-2 ring-[#635bff] ring-offset-1 bg-white text-[#635bff]"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {g.key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-3xl mt-3">
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-3xl px-6 pt-32 pb-32">
        {/* Group Header */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-6 ${group.light}`}>
          <span className={`w-2 h-2 rounded-full ${group.color}`} />
          {group.label} — {group.subtitle}
          <span className="ml-2 text-xs opacity-70">{groupAnswered}/10 câu</span>
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-8">
          Đánh giá mức độ phù hợp của bạn với các đặc điểm sau:
        </h2>

        {/* Questions */}
        <div className="space-y-6">
          {currentQuestions.map((q, idx) => (
            <div
              key={q.id}
              className={cn(
                "bg-white rounded-2xl border p-6 transition-all",
                answers[q.id] ? "border-[#635bff]/30 shadow-sm shadow-[#635bff]/10" : "border-gray-100"
              )}
            >
              <p className="font-medium text-gray-800 mb-5">
                <span className="text-[#635bff] font-black mr-2">{idx + 1}.</span>
                {q.text}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SCALE.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleAnswer(q.id, s.value)}
                    className={cn(
                      "flex-1 min-w-[56px] py-2.5 rounded-xl text-xs font-semibold border transition-all",
                      answers[q.id] === s.value
                        ? "bg-[#635bff] text-white border-[#635bff]"
                        : "bg-gray-50 text-gray-500 border-gray-100 hover:border-[#635bff]/50 hover:text-[#635bff]"
                    )}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-300 mt-1.5 px-1">
                <span>Không phù hợp</span>
                <span>Rất phù hợp</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => currentGroup > 0 && setCurrentGroup((p) => p - 1)}
            disabled={currentGroup === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Trước
          </Button>

          <div className="flex items-center gap-2">
            {!isGroupComplete && (
              <span className="text-xs text-gray-400">Còn {10 - groupAnswered} câu</span>
            )}
            {isGroupComplete && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Hoàn thành nhóm {group.key}
              </span>
            )}
          </div>

          {currentGroup < GROUPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isGroupComplete}
              className="bg-[#635bff] hover:bg-[#5248e8] text-white gap-2"
            >
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isGroupComplete || isSubmitting}
              className="bg-[#635bff] hover:bg-[#5248e8] text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  Xem kết quả
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
