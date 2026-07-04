import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] p-[70px_60px_30px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-[60px] mb-[60px]">
          <div>
            <Link href="/" className="flex items-center gap-[10px] mb-4">
              <div className="w-[36px] h-[36px] bg-ncn-orange rounded-[6px] flex items-center justify-center text-[18px]">🧭</div>
              <div className="text-[17px] font-extrabold tracking-[-0.3px] text-white">Nghề<span className="text-ncn-orange">Chọn</span>Người</div>
            </Link>
            <p className="text-[13.5px] text-ncn-gray leading-[1.7] max-w-[280px]">
              Hệ thống định vị sự nghiệp hàng đầu Việt Nam. Kết hợp khoa học tâm lý hiện đại với dữ liệu thị trường lao động để giúp người trẻ tìm đúng con đường.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-extrabold tracking-[2px] uppercase text-ncn-orange mb-[20px]">Liên kết nhanh</h4>
            <ul className="list-none space-y-[10px]">
              <li><Link href="#services" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Dịch vụ</Link></li>
              <li><Link href="#products" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Sản phẩm</Link></li>
              <li><Link href="#process" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Quy trình</Link></li>
              <li><Link href="#testimonials" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Phản hồi</Link></li>
              <li><Link href="#contact" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Liên hệ</Link></li>
              <li><Link href="https://nghechonnguoi.com/dang-ky-affiliate.html" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Affiliate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-extrabold tracking-[2px] uppercase text-ncn-orange mb-[20px]">Sản phẩm</h4>
            <ul className="list-none space-y-[10px]">
              <li><Link href="https://quiz.nghechonnguoi.com" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Khảo sát Nghề nghiệp</Link></li>
              <li><Link href="/sales" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Báo cáo PDF Premium</Link></li>
              <li><Link href="#contact" className="text-[13.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Tư vấn Hướng nghiệp</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-extrabold tracking-[2px] uppercase text-ncn-orange mb-[20px]">Liên hệ</h4>
            <div className="flex items-start gap-[10px] mb-[12px]">
              <span className="text-ncn-orange text-[14px] shrink-0 mt-[2px]">📧</span>
              <span className="text-[13.5px] text-ncn-gray leading-[1.5]">info@nghechonnguoi.com</span>
            </div>
            <div className="flex items-start gap-[10px] mb-[12px]">
              <span className="text-ncn-orange text-[14px] shrink-0 mt-[2px]">🌐</span>
              <span className="text-[13.5px] text-ncn-gray leading-[1.5]">nghechonnguoi.com</span>
            </div>
            <div className="flex items-start gap-[10px] mb-[12px]">
              <span className="text-ncn-orange text-[14px] shrink-0 mt-[2px]">🕐</span>
              <span className="text-[13.5px] text-ncn-gray leading-[1.5]">Thứ 2 – Thứ 7<br />8:00 – 18:00</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-[24px] flex justify-between items-center flex-wrap gap-[16px]">
          <p className="text-[12.5px] text-ncn-gray">© 2026 NghechonNguoi.com — Tất cả quyền được bảo lưu</p>
          <div className="flex gap-[24px]">
            <Link href="#" className="text-[12.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Chính sách bảo mật</Link>
            <Link href="#" className="text-[12.5px] text-ncn-gray transition-colors hover:text-ncn-orange">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
