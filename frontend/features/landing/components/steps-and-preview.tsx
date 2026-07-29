import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { workflowSteps } from "../data/landing-content";

const previewItems = [
  {
    title: "Tổng quan hiệu quả",
    value: "2,45 tỷ VND",
    src: "/tong-quan-hieu-qua.png",
    alt: "Dashboard tổng quan hiệu quả dự án BESS"
  },
  {
    title: "Dòng tiền dự án",
    value: "",
    src: "/dong-tien-du-an.png",
    alt: "Biểu đồ dòng tiền dự án BESS"
  },
  {
    title: "Phân tích công suất",
    value: "",
    src: "/phan-tich-cong-xuat.png",
    alt: "Biểu đồ phân tích công suất BESS"
  },
  {
    title: "Cơ cấu vốn & lợi nhuận",
    value: "120,00",
    src: "/co-cau-von-loi-nhuan.png",
    alt: "Biểu đồ cơ cấu vốn và lợi nhuận dự án BESS"
  },
  {
    title: "Báo cáo mẫu",
    value: "Báo cáo phân tích dự án BESS",
    src: "/bao-cao-mau.png",
    alt: "Báo cáo phân tích dự án BESS"
  }
];

export function StepsAndPreview() {
  return (
    <section className="site-container pb-4">
      <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 max-xl:grid-cols-1">
        <div className="rounded-xl border border-brand-line bg-white p-4 shadow-none">
          <h2 className="text-base font-bold text-brand-navy">3 bước đơn giản để đánh giá giải pháp BESS</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {workflowSteps.map(({ icon: Icon, number, text, title }, index) => (
              <Card className="relative min-h-[128px] border-slate-200 bg-white p-3 shadow-none" key={title}>
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-green text-xs font-bold text-white">{number}</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-brand-blue">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-[11px] font-bold leading-4 text-brand-navy">{title}</h3>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-brand-muted">{text}</p>
                {index < workflowSteps.length - 1 ? <span className="absolute -right-3 top-1/2 w-3 border-t-2 border-dashed border-slate-300 max-md:hidden" /> : null}
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-line bg-white p-4 shadow-none">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-brand-navy">Xem trước báo cáo & Dashboard</h2>
            <a className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand-blue" href="/bao-cao-mau">
              Xem báo cáo mẫu <ArrowRight size={14} />
            </a>
          </div>
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="grid min-w-[760px] grid-cols-5 gap-2.5">
              {previewItems.map((item) => (
                <PreviewCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ alt, src, title, value }: { alt: string; src: string; title: string; value: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-brand-line bg-white">
      <figcaption className="min-h-[45px] border-b border-brand-line px-2.5 py-2">
        <span className="block text-[9px] font-bold text-brand-muted">{title}</span>
        {value ? <strong className="mt-0.5 block truncate text-[10px] font-bold text-brand-navy">{value}</strong> : null}
      </figcaption>
      <div className="relative h-[105px] w-full overflow-hidden bg-slate-50">
        <Image
          fill
          className="object-cover object-center"
          src={src}
          alt={alt}
          sizes="160px"
        />
      </div>
    </figure>
  );
}
