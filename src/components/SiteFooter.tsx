import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-border bg-gov-blue text-gov-blue-foreground">
      <div className="container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-base font-semibold">市人才服务中心</h3>
          <p className="mt-3 text-sm leading-relaxed text-gov-blue-foreground/80">
            为各类人才提供政策咨询、引进落户、补贴兑现、安居保障等"一站式"服务，
            打造近悦远来的人才生态。
          </p>
        </div>
        <div>
          <h3 className="text-base font-semibold">联系方式</h3>
          <ul className="mt-3 space-y-2 text-sm text-gov-blue-foreground/85">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-gov-gold" />
              政务服务热线：12345（24h）
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-gov-gold" />
              rencai@gov.example.cn
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-gov-gold" />
              市政务服务中心 3 号楼 B 区
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold">友情链接</h3>
          <ul className="mt-3 space-y-2 text-sm text-gov-blue-foreground/85">
            <li><a href="#" className="hover:text-gov-gold">市人民政府门户</a></li>
            <li><a href="#" className="hover:text-gov-gold">人力资源和社会保障局</a></li>
            <li><a href="#" className="hover:text-gov-gold">教育局</a></li>
            <li><a href="#" className="hover:text-gov-gold">住房和城乡建设局</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gov-blue-foreground/70">
        © 2026 市人才工作领导小组办公室 · 备案号 苏ICP备示例00000000号
      </div>
    </footer>
  );
}
