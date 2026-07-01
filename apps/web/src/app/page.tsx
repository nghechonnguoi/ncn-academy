import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { StatsSection } from "@/components/home/stats-section";
import { ProductsSection } from "@/components/home/products-section";
import { ProcessSection } from "@/components/home/process-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ncn-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <ProductsSection />
      <ProcessSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
