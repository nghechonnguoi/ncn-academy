const activities = [
  { icon: "🎯", text: "Hoàn thành bài test RIASEC", time: "2 giờ trước" },
  { icon: "📊", text: "Nhận kết quả phân tích nghề nghiệp", time: "2 giờ trước" },
  { icon: "🤖", text: "Chat với AI Advisor lần đầu", time: "1 ngày trước" },
  { icon: "💳", text: "Nâng cấp lên gói Pro", time: "3 ngày trước" },
];

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-900 text-sm mb-4">Hoạt động gần đây</h3>
      <div className="space-y-3">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-base">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 leading-relaxed">{a.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
