"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2, Landmark, Gavel, Wallet, Users, UserCheck, CalendarClock, BadgePercent,
  Search, Bell, Plus, X, TrendingUp, MapPin, Star, Clock, Phone, Zap, Crown, Trophy,
  Flame, Check, Sparkles, ShieldCheck, Banknote, Home, Timer, Eye, Filter, ChevronLeft,
  LayoutGrid, Car, TreePine, Factory, Cpu, Castle, Sun, ArrowUpRight, ArrowDownRight, Trash2,
} from "lucide-react";

// ---------- helpers ----------
const fmtMoney = (n: number) => `${Number(n || 0).toLocaleString("en-US")} ر.س`;
const fmtNum = (n: number) => Number(n || 0).toLocaleString("en-US");
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function timeLeft(endsAt: string | Date | null): string {
  if (!endsAt) return "—";
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "انتهى";
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} يوم و ${h % 24} س`;
  if (h > 0) return `${h} س و ${m % 60} د`;
  const s = Math.floor((diff % 60000) / 1000);
  return `${m} د و ${s} ث`;
}

const DISTRICT_COLORS: Record<string, string> = {
  "حي المالية": "#F5C451",
  "حي الياسمين": "#34D399",
  "حي النخيل": "#4ADE80",
  "حي الميناء": "#60A5FA",
  "حي التقنية": "#A78BFA",
  "حي الواحة": "#FB923C",
  "حي القلعة": "#F472B6",
};

const TYPE_ICON: Record<string, string> = {
  villa: "فيلا", land: "أرض", apartment: "شقة", tower: "برج", commercial: "تجاري",
};
const TYPE_LABEL: Record<string, string> = {
  villa: "فيلا", land: "أرض", apartment: "شقة", tower: "برج", commercial: "تجاري",
};

type DistrictKey = "overview" | "ownership" | "auctions" | "wallet" | "agents" | "clients" | "appointments" | "offers";

const NAV: { key: DistrictKey; label: string; sub: string; icon: unknown }[] = [
  { key: "overview", label: "ساحة المدينة", sub: "نظرة شاملة", icon: LayoutGrid },
  { key: "ownership", label: "الملكية", sub: "العقارات والصكوك", icon: Building2 },
  { key: "auctions", label: "المزادات", sub: "مزايدات حية", icon: Gavel },
  { key: "wallet", label: "الرصيد", sub: "المحفظة والعمليات", icon: Wallet },
  { key: "agents", label: "الوكلاء", sub: "شبكة الوسطاء", icon: UserCheck },
  { key: "clients", label: "العملاء", sub: "إدارة العلاقات", icon: Users },
  { key: "appointments", label: "المواعيد", sub: "الزيارات والتوقيع", icon: CalendarClock },
  { key: "offers", label: "العروض", sub: "الخصومات الحصرية", icon: BadgePercent },
];

export default function DigitalCity() {
  const [active, setActive] = useState<DistrictKey>("overview");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [agents, setAgents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [clock, setClock] = useState("");
  const [tick, setTick] = useState(0);
  const [search, setSearch] = useState("");
  const [propFilter, setPropFilter] = useState("الكل");
  const [clientFilter, setClientFilter] = useState("الكل");
  const [selectedProp, setSelectedProp] = useState<any>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  // modals
  const [bidAuction, setBidAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidName, setBidName] = useState("أمير المدينة");
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletKind, setWalletKind] = useState<"deposit" | "withdraw">("deposit");
  const [walletAmount, setWalletAmount] = useState("");
  const [apptOpen, setApptOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [auctionOpen, setAuctionOpen] = useState(false);

  const [fAppt, setFAppt] = useState({ title: "", clientName: "", agentName: "", propertyCode: "", dateText: "2026-10-13", timeText: "17:30", type: "viewing", notes: "" });
  const [fClient, setFClient] = useState({ name: "", phone: "", interest: "فيلا", budget: "2000000", agentName: "", source: "المنصة" });
  const [fProp, setFProp] = useState({ title: "", district: "حي الياسمين", type: "villa", area: "400", price: "1500000", bedrooms: "5", bathrooms: "4", description: "" });
  const [fAgent, setFAgent] = useState({ name: "", phone: "", district: "حي الياسمين", specialty: "فلل فاخرة", experience: "3" });
  const [fOffer, setFOffer] = useState({ title: "", propertyCode: "", oldPrice: "1000000", newPrice: "900000", description: "", tag: "حصري" });
  const [fAuction, setFAuction] = useState({ title: "", district: "حي النخيل", startPrice: "1000000", minIncrement: "20000" });

  const toast = useCallback((msg: string, ok = true) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const addXp = useCallback(async (deltaXp: number) => {
    try { await fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deltaXp }) }); } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [s, p, a, w, ag, c, ap, o] = await Promise.all([
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/properties").then((r) => r.json()),
        fetch("/api/auctions").then((r) => r.json()),
        fetch("/api/wallet").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/appointments").then((r) => r.json()),
        fetch("/api/offers").then((r) => r.json()),
      ]);
      if (s.ok) { setStats(s.totals); }
      if (p.ok) {
        setProperties(p.data);
        if (!selectedProp && p.data.length) setSelectedProp(p.data[1] ?? p.data[0]);
      }
      if (a.ok) setAuctions(a.data);
      if (w.ok) { setTransactions(w.data); setBalance(w.balance); }
      if (ag.ok) setAgents(ag.data);
      if (c.ok) setClients(c.data);
      if (ap.ok) setAppointments(ap.data);
      if (o.ok) setOffers(o.data);
      if (p.ok && p.data.length === 0) {
        setSeeding(true);
        await fetch("/api/seed");
        setSeeding(false);
        // retry once
        const r2 = await Promise.all([
          fetch("/api/stats").then((r) => r.json()),
          fetch("/api/properties").then((r) => r.json()),
          fetch("/api/auctions").then((r) => r.json()),
          fetch("/api/wallet").then((r) => r.json()),
          fetch("/api/agents").then((r) => r.json()),
          fetch("/api/clients").then((r) => r.json()),
          fetch("/api/appointments").then((r) => r.json()),
          fetch("/api/offers").then((r) => r.json()),
        ]);
        if (r2[0].ok) setStats(r2[0].totals);
        if (r2[1].ok) { setProperties(r2[1].data); setSelectedProp(r2[1].data[1] ?? r2[1].data[0]); }
        if (r2[2].ok) setAuctions(r2[2].data);
        if (r2[3].ok) { setTransactions(r2[3].data); setBalance(r2[3].balance); }
        if (r2[4].ok) setAgents(r2[4].data);
        if (r2[5].ok) setClients(r2[5].data);
        if (r2[6].ok) setAppointments(r2[6].data);
        if (r2[7].ok) setOffers(r2[7].data);
      }
    } catch {
      toast("تعذر الاتصال بخوادم المدينة", false);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString("ar-SA-u-nu-latn", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (tick > 0 && tick % 20 === 0) {
      fetch("/api/auctions").then((r) => r.json()).then((j) => { if (j.ok) setAuctions(j.data); }).catch(() => {});
    }
  }, [tick]);

  const liveAuctions = useMemo(() => auctions.filter((a) => a.status === "live"), [auctions]);
  const filteredProps = useMemo(() => {
    return properties.filter((p) => {
      const q = search.trim();
      const matchQ = !q || p.title.includes(q) || p.code.includes(q) || p.district.includes(q);
      const matchF = propFilter === "الكل" || p.district === propFilter || p.status === propFilter || p.type === propFilter;
      return matchQ && matchF;
    });
  }, [properties, search, propFilter]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = search.trim();
      const matchQ = !q || c.name.includes(q) || (c.phone ?? "").includes(q);
      const matchF = clientFilter === "الكل" || c.status === clientFilter;
      return matchQ && matchF;
    });
  }, [clients, search, clientFilter]);

  const submitBid = async () => {
    if (!bidAuction) return;
    const amount = Number(bidAmount);
    if (!amount) { toast("أدخل مبلغ المزايدة", false); return; }
    const res = await fetch("/api/bids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auctionId: bidAuction.id, amount, bidderName: bidName || "أمير المدينة" }) });
    const j = await res.json();
    if (!j.ok) { toast(j.error ?? "فشلت المزايدة", false); return; }
    toast("تم تسجيل مزايدتك — أنت المتصدر الآن");
    addXp(60);
    setBidAuction(null); setBidAmount("");
    fetchAll();
  };

  const submitWallet = async () => {
    const amount = Number(walletAmount);
    if (!amount) { toast("أدخل المبلغ", false); return; }
    const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: walletKind, amount, description: walletKind === "deposit" ? "شحن يدوي من لوحة المدينة" : "سحب يدوي من لوحة المدينة" }) });
    const j = await res.json();
    if (!j.ok) { toast(j.error ?? "فشلت العملية", false); return; }
    toast(walletKind === "deposit" ? "تم شحن رصيدك بنجاح" : "تم تنفيذ السحب");
    addXp(25);
    setWalletOpen(false); setWalletAmount("");
    fetchAll();
  };

  const setApptStatus = async (id: number, status: string) => {
    await fetch("/api/appointments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    toast(status === "done" ? "تم إنجاز الموعد" : status === "cancelled" ? "تم إلغاء الموعد" : "تم تأكيد الموعد");
    if (status === "done") addXp(40);
    fetchAll();
  };
  const setClientStatus = async (id: number, status: string) => {
    await fetch("/api/clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    toast("تم تحديث حالة العميل");
    fetchAll();
  };
  const buyProperty = async (p: any) => {
    if (balance < p.price) { toast("رصيدك لا يكفي — اشحن المحفظة أولاً", false); setWalletOpen(true); return; }
    await fetch("/api/properties", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, status: "owned", owner: "أمير المدينة" }) });
    await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "withdraw", amount: p.price, description: `شراء ${p.title} ${p.code}` }) });
    await fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deltaXp: 150 }) });
    toast(`مبارك! أصبحت مالك ${p.title}`);
    fetchAll();
  };

  const level = stats?.level ?? 12;
  const xp = stats?.xp ?? 8450;
  const xpPct = Math.min(100, ((xp % 800) / 800) * 100);

  const feed = useMemo(() => {
    const items: { t: string; d: string; k: string }[] = [];
    auctions.slice(0, 4).forEach((a) => items.push({ t: `مزايدة جديدة على ${a.title}`, d: `${fmtMoney(a.currentBid)} — المتصدر: ${a.leader}`, k: "auction" }));
    appointments.slice(0, 3).forEach((a) => items.push({ t: a.title, d: `${a.dateText} • ${a.timeText} — ${a.clientName}`, k: "appt" }));
    transactions.slice(0, 3).forEach((tx) => items.push({ t: tx.description ?? "", d: `${tx.amount > 0 ? "+" : ""}${fmtMoney(tx.amount)}`, k: "tx" }));
    return items.slice(0, 7);
  }, [auctions, appointments, transactions]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center city-grid-bg">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl gold-glow grid place-items-center bg-gradient-to-br from-amber-400 to-amber-700 pulse-gold">
            <Landmark className="w-10 h-10 text-[#0a0f22]" />
          </div>
          <h1 className="mt-6 text-3xl font-black gold-text">جاري بناء مدينة الأمير…</h1>
          <p className="mt-2 text-slate-400">نجهز الأحياء والمزادات والمحفظة والوكلاء</p>
          <div className="mt-6 w-64 h-2 rounded-full bg-white/10 overflow-hidden mx-auto"><div className="h-full w-1/2 rounded-full bg-gradient-to-l from-amber-300 to-amber-600 shine-bar" /></div>
          {seeding && <p className="mt-3 text-xs text-amber-300">توليد بيانات المدينة لأول مرة…</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen city-grid-bg">
      {/* ===== HUD TOP ===== */}
      <header className="sticky top-0 z-40 border-b border-amber-200/10 bg-[#070c1f]/90 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 gold-glow shrink-0">
              <Castle className="w-6 h-6 text-[#0a0f22]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black leading-none">مدينة الأمير <span className="gold-text">الرقمية</span></h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-300/20 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" /> متصل</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">FAKSAB CITY • الملكية • المزادات • الوكلاء • المواعيد في شاشة واحدة</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 mr-4 glass rounded-2xl px-4 py-2">
            <Crown className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">مستوى المدينة {level} <span className="text-amber-300 font-bold">{fmtNum(xp)} XP</span></div>
              <div className="w-44 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-amber-200 to-amber-600" style={{ width: `${xpPct}%` }} /></div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300"><Sun className="w-4 h-4 text-amber-300" /> {clock}</div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 glass rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن عقار، عميل، مزاد…" className="bg-transparent outline-none text-sm w-56 placeholder:text-slate-500" />
          </div>

          <button onClick={() => { setWalletKind("deposit"); setWalletOpen(true); }} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-gradient-to-l from-amber-300 to-amber-600 text-[#0a0f22] font-black text-sm hover:brightness-110 gold-glow">
            <Wallet className="w-4 h-4" /> {fmtMoney(balance)}
            <span className="text-[10px] bg-black/20 rounded-full px-2 py-0.5">شحن</span>
          </button>

          <button onClick={() => setShowNotif((s) => !s)} className="relative w-11 h-11 grid place-items-center rounded-2xl glass hover:border-amber-300/40">
            <Bell className="w-5 h-5 text-amber-200" />
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] grid place-items-center font-bold">{feed.length}</span>
          </button>
        </div>

        {/* ticker */}
        <div className="border-t border-white/5 bg-black/30 overflow-hidden">
          <div className="flex whitespace-nowrap ticker-track w-max py-1.5 text-[12px]">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-8 px-4">
                {liveAuctions.map((a) => (
                  <span key={`${k}-${a.id}`} className="flex items-center gap-2 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> {a.title}: <b className="text-amber-300">{fmtMoney(a.currentBid)}</b>
                    <span className="text-emerald-300">متبقي {timeLeft(a.endsAt)}</span> <span className="text-slate-600">•</span>
                  </span>
                ))}
                <span className="flex items-center gap-2 text-slate-300"><Trophy className="w-3.5 h-3.5 text-amber-300" /> قيمة أملاك المدينة {fmtMoney(stats?.totalEstateValue ?? 0)} <span className="text-slate-600">•</span></span>
                <span className="flex items-center gap-2 text-slate-300"><Users className="w-3.5 h-3.5 text-sky-300" /> {stats?.clients ?? 0} عميل نشط و {stats?.agents ?? 0} وكلاء معتمدين <span className="text-slate-600">•</span></span>
              </div>
            ))}
          </div>
        </div>

        {showNotif && (
          <div className="absolute left-4 top-[110px] w-80 glass rounded-2xl p-3 shadow-2xl animate-rise z-50">
            <p className="text-sm font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-300" /> النبض الحي للمدينة</p>
            <div className="space-y-2 max-h-72 overflow-auto">
              {feed.map((f, i) => (
                <div key={i} className="rounded-xl bg-white/5 p-2.5 text-[12px]"><p className="font-bold text-slate-100">{f.t}</p><p className="text-slate-400 mt-0.5">{f.d}</p></div>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-[1440px] mx-auto px-4 py-5 grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-4">
        {/* ===== RIGHT NAV (districts) ===== */}
        <aside className="space-y-3 order-1">
          <div className="glass rounded-3xl p-3">
            <p className="text-[11px] font-bold text-slate-400 px-2 mb-2 tracking-wide">أحياء المدينة — اختر الحي للتحكم</p>
            <div className="space-y-1.5">
              {NAV.map((n) => {
                const Icon = n.icon as any;
                const isActive = active === n.key;
                const count = n.key === "ownership" ? properties.length : n.key === "auctions" ? liveAuctions.length : n.key === "agents" ? agents.length : n.key === "clients" ? clients.length : n.key === "appointments" ? appointments.filter((a) => a.status !== "done").length : n.key === "offers" ? offers.length : n.key === "wallet" ? transactions.length : stats?.properties ?? 0;
                return (
                  <button key={n.key} onClick={() => setActive(n.key)} className={cx("w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition", isActive ? "bg-gradient-to-l from-amber-400/25 to-amber-600/10 border border-amber-300/30 gold-glow" : "hover:bg-white/5 border border-transparent")}>
                    <span className={cx("w-10 h-10 rounded-xl grid place-items-center shrink-0", isActive ? "bg-gradient-to-br from-amber-300 to-amber-700 text-[#0a0f22]" : "bg-white/5 text-amber-200")}><Icon className="w-5 h-5" /></span>
                    <span className="flex-1"><span className="block text-sm font-black">{n.label}</span><span className="block text-[11px] text-slate-400">{n.sub}</span></span>
                    <span className="text-[11px] font-black px-2 py-1 rounded-full bg-white/5 border border-white/10">{count}</span>
                    <ChevronLeft className={cx("w-4 h-4", isActive ? "text-amber-300" : "text-slate-600")} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <p className="text-xs font-black flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-300" /> فحص الموقع الأصلي</p>
            <div className="text-[12px] leading-6 text-slate-300 bg-black/30 rounded-2xl p-3 border border-white/5">
              <p>رابطك <span className="text-amber-300 font-mono" dir="ltr">alamir.kesug.com/faksab3</span> يعمل على استضافة مجانية ومحمي بجدار <b>Anti-Bot (AES cookie)</b> يمنع الأرشفة والفحص الآلي.</p>
              <p className="mt-2 text-slate-400">لذلك أعدنا بناء المنظومة كاملة هنا كـ <b className="text-white">مدينة رقمية متكاملة</b> بنفس الأقسام: الملكية، المزادات، الرصيد، الوكلاء، العملاء، المواعيد، العروض — مع قاعدة بيانات حقيقية بدل صفحات PHP الثابتة.</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl bg-emerald-400/10 border border-emerald-300/20 p-2"><p className="text-lg font-black text-emerald-300">{stats?.ownedValue ? `${(stats.ownedValue / 1000000).toFixed(1)}M` : "—"}</p><p className="text-[10px] text-slate-400">قيمة ممتلكاتك</p></div>
              <div className="rounded-2xl bg-amber-400/10 border border-amber-300/20 p-2"><p className="text-lg font-black text-amber-300">{stats?.liveAuctions ?? 0} حي</p><p className="text-[10px] text-slate-400">مزادات مشتعلة</p></div>
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <p className="text-xs font-black mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-300" /> إنجازات المدينة</p>
            <div className="space-y-2 text-[12px]">
              {[["تاجر المدينة", "امتلك 3 عقارات", true], ["قناص المزادات", "اربح مزاداً واحداً", true], ["عمدة الأحياء", "فعّل 7 أحياء", false], ["مليونير الواحة", "تجاوز رصيدك 5M", true]].map(([t, d, done], i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 p-2 border border-white/5">
                  <span className={cx("w-8 h-8 rounded-lg grid place-items-center", done ? "bg-amber-400 text-black" : "bg-white/10 text-slate-400")}>{done ? <Check className="w-4 h-4" /> : <Star className="w-4 h-4" />}</span>
                  <span><b className="block text-[12px]">{t}</b><span className="text-slate-400 text-[11px]">{d}</span></span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ===== CENTER ===== */}
        <main className="space-y-4 order-2 min-w-0">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { l: "إجمالي الملكيات", v: fmtNum(stats?.properties ?? 0), s: `${((stats?.totalEstateValue ?? 0) / 1000000).toFixed(1)}M قيمة السوق`, ic: Building2, c: "text-amber-300" },
              { l: "مزادات حية", v: fmtNum(stats?.liveAuctions ?? 0), s: `${stats?.totalBids ?? 0} مزايدة`, ic: Gavel, c: "text-orange-300" },
              { l: "رصيد المحفظة", v: `${((balance ?? 0) / 1000000).toFixed(2)}M`, s: "ر.س متاح الآن", ic: Wallet, c: "text-emerald-300" },
              { l: "الوكلاء", v: fmtNum(stats?.agents ?? 0), s: "وكيل معتمد", ic: UserCheck, c: "text-sky-300" },
              { l: "العملاء", v: fmtNum(stats?.clients ?? 0), s: "في المنظومة", ic: Users, c: "text-violet-300" },
              { l: "مواعيد قادمة", v: fmtNum(stats?.todayCount ?? 0), s: "بانتظار التنفيذ", ic: CalendarClock, c: "text-pink-300" },
            ].map((k, i) => {
              const Icon = k.ic;
              return (
                <div key={i} className="glass rounded-2xl p-3 hover:border-amber-300/30 transition">
                  <Icon className={cx("w-5 h-5 mb-2", k.c)} />
                  <p className="text-xl font-black leading-none">{k.v}</p>
                  <p className="text-[11px] font-bold mt-1">{k.l}</p>
                  <p className="text-[10px] text-slate-400">{k.s}</p>
                </div>
              );
            })}
          </div>

          {/* CITY MAP */}
          <section className="glass rounded-3xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 pt-4 flex-wrap">
              <h2 className="font-black text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-300" /> خريطة المدينة الحية <span className="text-[11px] font-normal text-slate-400">— انقر أي مبنى لعرض صكه</span></h2>
              <div className="flex-1" />
              <div className="flex gap-1.5 text-[11px]">
                {["الكل", ...Object.keys(DISTRICT_COLORS)].map((d) => (
                  <button key={d} onClick={() => setPropFilter(d)} className={cx("px-2.5 py-1 rounded-full border", propFilter === d ? "bg-amber-400 text-black font-black border-amber-300" : "bg-white/5 text-slate-300 border-white/10 hover:border-amber-300/40")}>{d}</button>
                ))}
              </div>
            </div>

            <div className="m-4 rounded-2xl relative overflow-hidden border border-amber-200/10 bg-[#080e24] min-h-[480px] city-grid-bg">
              {/* roads */}
              <div className="absolute top-[38%] left-0 right-0 h-10 bg-[#0d142e] border-y border-white/10 flex items-center overflow-hidden">
                <div className="absolute w-full h-[2px] bg-amber-300/40 top-1/2" style={{ backgroundImage: "linear-gradient(90deg, #f5c451 50%, transparent 50%)", backgroundSize: "22px 2px" }} />
                <div className="road-car absolute top-1 flex items-center gap-1 text-amber-300" style={{ animationDuration: "14s" }}><Car className="w-5 h-5" /></div>
                <div className="road-car absolute bottom-1 flex items-center gap-1 text-sky-300" style={{ animationDuration: "19s", animationDelay: "-6s" }}><Car className="w-5 h-5 rotate-180" /></div>
              </div>
              <div className="absolute left-[30%] top-0 bottom-0 w-10 bg-[#0d142e] border-x border-white/10 flex justify-center overflow-hidden">
                <div className="absolute h-full w-[2px] bg-amber-300/40 left-1/2" style={{ backgroundImage: "linear-gradient(#f5c451 50%, transparent 50%)", backgroundSize: "2px 22px" }} />
              </div>
              {/* central landmark */}
              <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-700 grid place-items-center gold-glow pulse-gold"><Castle className="w-8 h-8 text-[#0a0f22]" /></div>
                <p className="mt-1 text-[11px] font-black bg-black/60 rounded-full px-3 py-0.5 border border-amber-300/30 inline-block">قلعة المدينة — المركز</p>
              </div>
              {/* park + factory deco */}
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-300/20 rounded-full px-2.5 py-1"><TreePine className="w-3.5 h-3.5" /> الحديقة المركزية</div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-sky-300 bg-sky-400/10 border border-sky-300/20 rounded-full px-2.5 py-1"><Factory className="w-3.5 h-3.5" /> المنطقة اللوجستية</div>
              <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] text-violet-300 bg-violet-400/10 border border-violet-300/20 rounded-full px-2.5 py-1"><Cpu className="w-3.5 h-3.5" /> حي التقنية</div>

              {/* buildings */}
              {(propFilter === "الكل" ? properties : properties.filter((p) => p.district === propFilter)).map((p) => {
                const color = DISTRICT_COLORS[p.district] ?? "#F5C451";
                const h = 34 + Math.min(72, Math.log10(p.price) * 9);
                const isSel = selectedProp?.id === p.id;
                const isAuction = p.status === "auction";
                return (
                  <button key={p.id} onClick={() => setSelectedProp(p)} className="building absolute flex flex-col items-center gap-1 z-20" style={{ left: `${p.posX}%`, top: `${p.posY}%` }} title={p.title}>
                    <span className={cx("text-[9px] font-black px-1.5 py-0.5 rounded-full border backdrop-blur", isAuction ? "bg-orange-500/90 text-white border-orange-200 live-dot" : "bg-black/70 text-slate-200 border-white/15")}>{isAuction ? "مزاد حي" : p.code}</span>
                    <span className="flex items-end gap-[2px]" style={{ height: h }}>
                      <span className="w-7 rounded-t-md border border-white/20 relative overflow-hidden" style={{ height: h, background: `linear-gradient(180deg, ${color}, #0b1026 130%)` }}>
                        <span className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "100% 8px" }} />
                        {isAuction && <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />}
                      </span>
                      {p.type === "tower" && <span className="w-5 rounded-t-md border border-white/20" style={{ height: h * 0.72, background: `linear-gradient(180deg, ${color}99, #0b1026)` }} />}
                      {p.type === "villa" && <span className="w-9 h-3 rounded-t-full border border-white/20 -mb-0.5" style={{ background: color }} />}
                    </span>
                    <span className={cx("w-12 h-2 rounded-[50%] blur-[1px]", isSel ? "bg-amber-300/70" : "bg-black/70")} />
                  </button>
                );
              })}

              {/* selected card */}
              {selectedProp && (
                <div className="absolute bottom-3 right-3 left-3 md:left-auto md:w-[380px] glass rounded-2xl p-3.5 border-amber-200/20 shadow-2xl animate-rise z-30">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: DISTRICT_COLORS[selectedProp.district] ?? "#F5C451" }}>
                      <Home className="w-5 h-5 text-black" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{selectedProp.title}</p>
                      <p className="text-[11px] text-slate-400">{selectedProp.code} • {selectedProp.district} • {TYPE_LABEL[selectedProp.type] ?? selectedProp.type} • {fmtNum(selectedProp.area)}م²</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-amber-300 font-black text-sm">{fmtMoney(selectedProp.price)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-300/20">عائد {selectedProp.roi}%</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{selectedProp.status === "owned" ? "مملوك لك" : selectedProp.status === "auction" ? "في المزاد" : selectedProp.status === "sold" ? "مباع" : "متاح"}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedProp(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[12px] text-slate-300 leading-6 mt-2 line-clamp-2">{selectedProp.description}</p>
                  <div className="flex gap-2 mt-2.5">
                    {selectedProp.status !== "owned" && selectedProp.status !== "sold" && (
                      <button onClick={() => buyProperty(selectedProp)} className="flex-1 rounded-xl bg-gradient-to-l from-amber-300 to-amber-600 text-black text-[13px] font-black py-2 hover:brightness-110">تملك الآن</button>
                    )}
                    <button onClick={() => { setActive("ownership"); }} className="flex-1 rounded-xl bg-white/5 border border-white/10 text-[13px] font-bold py-2 hover:border-amber-300/40">تفاصيل الحي</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===== MODULE PANELS ===== */}
          {active === "overview" && (
            <section className="grid md:grid-cols-2 gap-4">
              <div className="glass rounded-3xl p-4">
                <h3 className="font-black mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-300" /> قوة الأحياء السبعة</h3>
                <div className="space-y-2.5">
                  {(stats?.districtStats ?? ( [] as any[])).length === 0 && <p className="text-xs text-slate-500">لا بيانات بعد</p>}
                  {(stats?.districtStats ?? []).map((d: any) => {
                    const max = Math.max(1, ...(stats?.districtStats ?? []).map((x: any) => x.value));
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-[12px] mb-1"><span className="font-bold">{d.name}</span><span className="text-slate-400">{d.count} عقارات • {(d.value / 1000000).toFixed(1)}M</span></div>
                        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(6, (d.value / max) * 100)}%`, background: DISTRICT_COLORS[d.name] ?? "#F5C451" }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="glass rounded-3xl p-4">
                <h3 className="font-black mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> مزادات مشتعلة الآن</h3>
                <div className="space-y-2">
                  {liveAuctions.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-2xl bg-gradient-to-l from-orange-500/15 to-transparent border border-orange-300/20 p-3 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-orange-500 grid place-items-center shrink-0"><Gavel className="w-5 h-5 text-white" /></span>
                      <div className="flex-1 min-w-0"><p className="text-[13px] font-black truncate">{a.title}</p><p className="text-[11px] text-slate-400 flex items-center gap-1"><Timer className="w-3 h-3" /> متبقي {timeLeft(a.endsAt)} • {a.bidsCount} مزايدة</p></div>
                      <div className="text-left"><p className="font-black text-amber-300 text-sm">{fmtMoney(a.currentBid)}</p><button onClick={() => { setBidAuction(a); setBidAmount(String(a.currentBid + a.minIncrement)); }} className="text-[11px] font-black bg-amber-400 text-black rounded-full px-3 py-1 mt-1 hover:brightness-110">زايد</button></div>
                    </div>
                  ))}
                  {liveAuctions.length === 0 && <p className="text-xs text-slate-500">لا مزادات حية حالياً</p>}
                  <button onClick={() => setActive("auctions")} className="w-full text-[12px] font-bold text-amber-300 hover:underline">عرض كل المزادات ←</button>
                </div>
              </div>
            </section>
          )}

          {active === "ownership" && (
            <section className="glass rounded-3xl p-4 animate-rise">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="font-black text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-300" /> سجل الملكية والصكوك</h3>
                <div className="flex-1" />
                <div className="flex gap-1.5 text-[11px] flex-wrap">
                  {["الكل", "available", "auction", "owned", "sold"].map((f) => (
                    <button key={f} onClick={() => setPropFilter(f)} className={cx("px-3 py-1 rounded-full border", propFilter === f ? "bg-amber-400 text-black font-black" : "bg-white/5 border-white/10")}>{f === "الكل" ? "الكل" : f === "available" ? "متاح" : f === "auction" ? "مزاد" : f === "owned" ? "مملوك" : "مباع"}</button>
                  ))}
                </div>
                <button onClick={() => setPropOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-emerald-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> إضافة عقار</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProps.map((p) => (
                  <div key={p.id} className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 hover:border-amber-300/40 transition group">
                    <div className="h-24 relative flex items-end p-2.5" style={{ background: `linear-gradient(140deg, ${DISTRICT_COLORS[p.district] ?? "#F5C451"}55, #0b1026 70%)` }}>
                      <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-black/60 border border-white/15">{p.code}</span>
                      <span className={cx("absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full", p.status === "owned" ? "bg-emerald-400 text-black" : p.status === "auction" ? "bg-orange-500 text-white live-dot" : p.status === "sold" ? "bg-slate-500 text-white" : "bg-amber-400 text-black")}>{p.status === "owned" ? "مملوك" : p.status === "auction" ? "مزاد حي" : p.status === "sold" ? "مباع" : "متاح"}</span>
                      <div><p className="font-black text-sm">{p.title}</p><p className="text-[11px] text-slate-300">{p.district} • {TYPE_ICON[p.type] ?? p.type}</p></div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-[12px]"><span className="text-slate-400">{fmtNum(p.area)}م² • {p.bedrooms} غرف • عائد {p.roi}%</span></div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-amber-300">{fmtMoney(p.price)}</span>
                        {p.status !== "owned" && p.status !== "sold" ? (
                          <button onClick={() => buyProperty(p)} className="text-[11px] font-black bg-white/5 border border-amber-300/30 rounded-full px-3 py-1 hover:bg-amber-400 hover:text-black">تملك</button>
                        ) : (
                          <span className="text-[11px] text-emerald-300 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> صك موثق</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "auctions" && (
            <section className="space-y-3 animate-rise">
              <div className="glass rounded-3xl p-4 flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg flex items-center gap-2"><Gavel className="w-5 h-5 text-orange-300" /> قاعة المزادات الكبرى</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-300/20 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full live-dot" /> بث حي</span>
                <div className="flex-1" />
                <button onClick={() => setAuctionOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-amber-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> مزاد جديد</button>
              </div>
              <div className="grid lg:grid-cols-2 gap-3">
                {auctions.map((a) => (
                  <div key={a.id} className={cx("glass rounded-3xl p-4 border", a.status === "live" ? "border-orange-300/30" : "opacity-90")}>
                    <div className="flex items-start gap-3">
                      <span className={cx("w-12 h-12 rounded-2xl grid place-items-center shrink-0", a.status === "live" ? "bg-gradient-to-br from-orange-400 to-red-600" : a.status === "upcoming" ? "bg-gradient-to-br from-sky-400 to-indigo-600" : "bg-white/10")}><Gavel className="w-6 h-6 text-white" /></span>
                      <div className="flex-1">
                        <p className="font-black">{a.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">الافتتاحي {fmtMoney(a.startPrice)} • خطوة {fmtMoney(a.minIncrement)} • {a.district}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cx("text-[11px] font-black px-2.5 py-0.5 rounded-full", a.status === "live" ? "bg-red-500 text-white live-dot" : a.status === "upcoming" ? "bg-sky-500/20 text-sky-300 border border-sky-300/30" : "bg-white/10 text-slate-400")}>{a.status === "live" ? `ينتهي خلال ${timeLeft(a.endsAt)}` : a.status === "upcoming" ? "قريباً" : "انتهى"}</span>
                          <span className="text-[11px] text-slate-400">{a.bidsCount} مزايدة • المتصدر: <b className="text-amber-300">{a.leader}</b></span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-black/40 border border-white/5 p-3 flex items-center justify-between">
                      <div><p className="text-[11px] text-slate-400">أعلى مزايدة</p><p className="text-xl font-black text-amber-300">{fmtMoney(a.currentBid)}</p></div>
                      {a.status === "live" ? (
                        <button onClick={() => { setBidAuction(a); setBidAmount(String(a.currentBid + a.minIncrement)); }} className="rounded-xl bg-gradient-to-l from-amber-300 to-orange-500 text-black font-black px-6 py-2.5 text-sm hover:brightness-110 flex items-center gap-1"><Zap className="w-4 h-4" /> زايد الآن</button>
                      ) : (
                        <span className="text-[12px] text-slate-500">المزايدة مغلقة</span>
                      )}
                    </div>
                    {a.history?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {a.history.slice(0, 3).map((h: any) => (
                          <div key={h.id} className="flex justify-between text-[12px] bg-white/[.03] rounded-lg px-2.5 py-1.5"><span>{h.bidderName}</span><b className="text-emerald-300">{fmtMoney(h.amount)}</b></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "wallet" && (
            <section className="grid lg:grid-cols-[1fr_1.2fr] gap-4 animate-rise">
              <div>
                <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 text-[#0a0f22] gold-glow relative overflow-hidden">
                  <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                  <p className="text-[12px] font-bold flex items-center gap-1"><Banknote className="w-4 h-4" /> محفظة أمير المدينة</p>
                  <p className="text-4xl font-black mt-2" dir="ltr">{fmtNum(balance)} <span className="text-sm">ر.س</span></p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setWalletKind("deposit"); setWalletOpen(true); }} className="flex-1 rounded-xl bg-black text-amber-300 font-black py-2.5 text-sm flex items-center justify-center gap-1"><ArrowDownRight className="w-4 h-4" /> شحن</button>
                    <button onClick={() => { setWalletKind("withdraw"); setWalletOpen(true); }} className="flex-1 rounded-xl bg-white/25 font-black py-2.5 text-sm flex items-center justify-center gap-1"><ArrowUpRight className="w-4 h-4" /> سحب</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                    <div className="rounded-xl bg-black/25 p-2"><p className="font-black">{fmtMoney(stats?.deposits ?? 0)}</p><p className="text-[10px]">إجمالي الإيداعات</p></div>
                    <div className="rounded-xl bg-black/25 p-2"><p className="font-black">{fmtMoney(stats?.spent ?? 0)}</p><p className="text-[10px]">إجمالي الصرف</p></div>
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 mt-3">
                  <p className="text-sm font-black mb-2">طرق الشحن المعتمدة</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    {["مدى", "تحويل بنكي", "آبل باي"].map((m) => (
                      <div key={m} className="rounded-xl bg-white/5 border border-white/10 py-2.5 font-bold">{m}</div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">إيداع فوري بدون رسوم • سحب خلال 24 ساعة • حماية بنكية كاملة</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-4">
                <h3 className="font-black mb-3">سجل العمليات المالية</h3>
                <div className="space-y-2 max-h-[460px] overflow-auto pl-1">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white/[.03] border border-white/5 p-2.5">
                      <span className={cx("w-10 h-10 rounded-xl grid place-items-center shrink-0", t.amount >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300")}>{t.amount >= 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}</span>
                      <div className="flex-1 min-w-0"><p className="text-[13px] font-bold truncate">{t.description}</p><p className="text-[11px] text-slate-500">{t.type} • {t.status === "completed" ? "مكتملة" : "معلقة"}</p></div>
                      <b className={cx("text-sm", t.amount >= 0 ? "text-emerald-300" : "text-rose-300")} dir="ltr">{t.amount >= 0 ? "+" : ""}{fmtNum(t.amount)}</b>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-xs text-slate-500">لا عمليات بعد</p>}
                </div>
              </div>
            </section>
          )}

          {active === "agents" && (
            <section className="glass rounded-3xl p-4 animate-rise">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-black text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-sky-300" /> شبكة وكلاء المدينة</h3>
                <div className="flex-1" />
                <button onClick={() => setAgentOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-sky-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> اعتماد وكيل</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {agents.map((g) => (
                  <div key={g.id} className="rounded-2xl bg-black/30 border border-white/10 p-3.5 hover:border-amber-300/40 transition text-center">
                    <div className="relative inline-block">
                      <span className="w-16 h-16 rounded-2xl grid place-items-center text-2xl font-black text-black mx-auto" style={{ background: `linear-gradient(135deg, ${g.color}, #0b1026 160%)` }}>{g.name.replace("أ. ", "").replace("م. ", "").slice(0, 1)}</span>
                      <span className={cx("absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-[#0b1026]", g.status === "online" ? "bg-emerald-400" : g.status === "busy" ? "bg-amber-400" : "bg-slate-500")} />
                    </div>
                    <p className="font-black text-sm mt-2">{g.name}</p>
                    <p className="text-[11px] text-slate-400">{g.specialty} • {g.district}</p>
                    <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-1"><Phone className="w-3 h-3" /> <span dir="ltr">{g.phone}</span></p>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cx("w-3.5 h-3.5", s <= Math.round(g.rating) ? "text-amber-300 fill-amber-300" : "text-slate-600")} />
                      ))}
                      <span className="text-[11px] font-black mr-1">{g.rating}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
                      <div className="rounded-lg bg-white/5 p-1.5"><p className="font-black text-sm">{g.deals}</p><p className="text-[9px] text-slate-500">صفقة</p></div>
                      <div className="rounded-lg bg-white/5 p-1.5"><p className="font-black text-sm">{g.experience}س</p><p className="text-[9px] text-slate-500">خبرة</p></div>
                      <div className="rounded-lg bg-white/5 p-1.5"><p className="font-black text-sm">{(g.commission / 1000).toFixed(0)}K</p><p className="text-[9px] text-slate-500">عمولة</p></div>
                    </div>
                    <button onClick={() => { setFAppt((f) => ({ ...f, agentName: g.name })); setApptOpen(true); }} className="w-full mt-2.5 rounded-xl bg-white/5 border border-white/10 text-[12px] font-bold py-1.5 hover:border-amber-300/50 hover:text-amber-300">احجز مع الوكيل</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "clients" && (
            <section className="glass rounded-3xl p-4 animate-rise">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="font-black text-lg flex items-center gap-2"><Users className="w-5 h-5 text-violet-300" /> سجل العملاء</h3>
                <div className="flex gap-1.5 text-[11px]">
                  {["الكل", "new", "negotiating", "contracted", "vip"].map((f) => (
                    <button key={f} onClick={() => setClientFilter(f)} className={cx("px-3 py-1 rounded-full border", clientFilter === f ? "bg-violet-400 text-black font-black" : "bg-white/5 border-white/10")}>{f === "الكل" ? "الكل" : f === "new" ? "جديد" : f === "negotiating" ? "تفاوض" : f === "contracted" ? "متعاقد" : "VIP"}</button>
                  ))}
                </div>
                <div className="flex-1" />
                <button onClick={() => setClientOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-violet-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> عميل جديد</button>
              </div>
              <div className="grid md:grid-cols-2 gap-2.5">
                {filteredClients.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-700 grid place-items-center font-black text-lg shrink-0">{c.name.slice(0, 1)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm flex items-center gap-2">{c.name} {c.status === "vip" && <Crown className="w-3.5 h-3.5 text-amber-300" />}</p>
                      <p className="text-[11px] text-slate-400">يهتم بـ {c.interest} • ميزانية {fmtMoney(c.budget)} • الوكيل: {c.agentName || "—"}</p>
                      <div className="flex gap-1 mt-1.5">
                        {(["new", "negotiating", "contracted", "vip"] as string[]).map((s) => (
                          <button key={s} onClick={() => setClientStatus(c.id, s)} className={cx("text-[10px] px-2 py-0.5 rounded-full border", c.status === s ? "bg-amber-400 text-black font-black border-amber-300" : "border-white/10 text-slate-400 hover:border-amber-300/40")}>{s === "new" ? "جديد" : s === "negotiating" ? "تفاوض" : s === "contracted" ? "تعاقد" : "VIP"}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && <p className="text-xs text-slate-500">لا عملاء مطابقين</p>}
              </div>
            </section>
          )}

          {active === "appointments" && (
            <section className="glass rounded-3xl p-4 animate-rise">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-black text-lg flex items-center gap-2"><CalendarClock className="w-5 h-5 text-pink-300" /> جدول المواعيد والمعاينات</h3>
                <div className="flex-1" />
                <button onClick={() => setApptOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-pink-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> حجز موعد</button>
              </div>
              <div className="grid lg:grid-cols-2 gap-2.5">
                {appointments.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-white/10 bg-black/30 p-3.5 flex gap-3">
                    <div className="w-14 rounded-2xl bg-gradient-to-b from-pink-400/30 to-transparent border border-pink-300/20 grid place-items-center text-center shrink-0 py-2">
                      <div><p className="text-[10px] text-slate-400">{a.dateText.slice(5)}</p><p className="font-black text-sm">{a.timeText}</p></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm">{a.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap"><Eye className="w-3 h-3" /> {a.clientName} • {a.agentName} • {a.propertyCode} • {a.type === "viewing" ? "معاينة" : a.type === "signing" ? "توقيع" : a.type === "consultation" ? "استشارة" : "فحص"}</p>
                      {a.notes && <p className="text-[11px] text-slate-500 mt-1">ملاحظة: {a.notes}</p>}
                      <div className="flex gap-1.5 mt-2">
                        <span className={cx("text-[10px] font-black px-2 py-0.5 rounded-full", a.status === "confirmed" ? "bg-emerald-400 text-black" : a.status === "done" ? "bg-white/10 text-slate-300" : a.status === "cancelled" ? "bg-rose-500/20 text-rose-300" : "bg-amber-400/20 text-amber-300 border border-amber-300/30")}>{a.status === "confirmed" ? "مؤكد" : a.status === "done" ? "منجز" : a.status === "cancelled" ? "ملغي" : "بانتظار"}</span>
                        <div className="flex-1" />
                        {a.status !== "done" && a.status !== "cancelled" && (
                          <>
                            <button onClick={() => setApptStatus(a.id, "confirmed")} className="text-[11px] font-bold text-emerald-300 hover:underline">تأكيد</button>
                            <button onClick={() => setApptStatus(a.id, "done")} className="text-[11px] font-bold text-sky-300 hover:underline">إنجاز</button>
                            <button onClick={() => setApptStatus(a.id, "cancelled")} className="text-[11px] font-bold text-rose-300 hover:underline">إلغاء</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === "offers" && (
            <section className="animate-rise">
              <div className="glass rounded-3xl p-4 flex items-center gap-2 mb-3">
                <h3 className="font-black text-lg flex items-center gap-2"><BadgePercent className="w-5 h-5 text-emerald-300" /> سوق العروض الحصرية</h3>
                <div className="flex-1" />
                <button onClick={() => setOfferOpen(true)} className="flex items-center gap-1 text-[12px] font-black bg-emerald-400 text-black rounded-full px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> عرض جديد</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {offers.map((o) => (
                  <div key={o.id} className="rounded-3xl overflow-hidden border border-emerald-300/20 bg-gradient-to-b from-emerald-400/10 to-black/40">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-400 text-black">{o.tag}</span>
                        <span className="text-2xl font-black text-emerald-300">-{o.discount}%</span>
                      </div>
                      <p className="font-black mt-2">{o.title}</p>
                      <p className="text-[12px] text-slate-400 mt-1 leading-6">{o.description}</p>
                      <div className="flex items-end gap-2 mt-2">
                        <p className="font-black text-lg text-white">{fmtMoney(o.newPrice)}</p>
                        <p className="text-[12px] text-slate-500 line-through mb-0.5">{fmtMoney(o.oldPrice)}</p>
                      </div>
                      <p className="text-[11px] text-orange-300 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {o.expiresAt} • {o.propertyCode}</p>
                      <button onClick={() => { const p = properties.find((x) => x.code === o.propertyCode); if (p) buyProperty(p); else toast("تواصل مع الوكيل لتفعيل العرض"); }} className="w-full mt-3 rounded-xl bg-gradient-to-l from-emerald-300 to-teal-500 text-black font-black py-2 text-sm hover:brightness-110">اقتنص العرض</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ===== LEFT FEED ===== */}
        <aside className="space-y-3 order-3">
          <div className="glass rounded-3xl p-4">
            <p className="text-sm font-black flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-amber-300" /> النبض الحي</p>
            <div className="space-y-2 max-h-64 overflow-auto pl-1">
              {feed.map((f, i) => (
                <div key={i} className="rounded-xl bg-white/[.04] border border-white/5 p-2.5 text-[12px] animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <p className="font-bold leading-5">{f.t}</p><p className="text-slate-400 text-[11px] mt-0.5">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <p className="text-sm font-black flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-amber-300" /> صدارة الوكلاء</p>
            <div className="space-y-2">
              {agents.slice().sort((a, b) => b.deals - a.deals).slice(0, 4).map((g, i) => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className={cx("w-6 h-6 rounded-lg grid place-items-center text-[11px] font-black shrink-0", i === 0 ? "bg-amber-400 text-black" : "bg-white/10 text-slate-300")}>{i + 1}</span>
                  <span className="w-9 h-9 rounded-xl grid place-items-center font-black text-black text-sm shrink-0" style={{ background: g.color }}>{g.name.slice(0, 1)}</span>
                  <div className="flex-1 min-w-0"><p className="text-[12px] font-black truncate">{g.name}</p><p className="text-[10px] text-slate-500">{g.deals} صفقة • {g.rating}★</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <p className="text-sm font-black flex items-center gap-2 mb-3"><CalendarClock className="w-4 h-4 text-pink-300" /> مواعيد اليوم</p>
            <div className="space-y-2">
              {appointments.filter((a) => a.status !== "done" && a.status !== "cancelled").slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-xl bg-pink-400/10 border border-pink-300/20 p-2.5 text-[12px]">
                  <p className="font-black">{a.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.timeText} — {a.clientName}</p>
                </div>
              ))}
              {appointments.filter((a) => a.status !== "done").length === 0 && <p className="text-[11px] text-slate-500">لا مواعيد معلقة</p>}
              <button onClick={() => { setActive("appointments"); setApptOpen(true); }} className="w-full rounded-xl border border-dashed border-white/15 text-[12px] font-bold py-2 text-slate-300 hover:border-pink-300/50 hover:text-pink-300">+ حجز موعد جديد</button>
            </div>
          </div>

          <div className="rounded-3xl p-4 bg-gradient-to-br from-violet-500/25 to-fuchsia-600/10 border border-violet-300/20">
            <p className="text-sm font-black flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> مهمة اليوم</p>
            <p className="text-[12px] text-slate-300 mt-1.5 leading-6">احسم 3 مزايدات واجمع <b className="text-amber-300">+180 XP</b> لترقية المدينة للمستوى {level + 1} وفتح حي جديد.</p>
            <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full bg-gradient-to-l from-violet-300 to-fuchsia-500 rounded-full" style={{ width: `${xpPct}%` }} /></div>
          </div>
        </aside>
      </div>

      <footer className="max-w-[1440px] mx-auto px-4 pb-8">
        <div className="glass rounded-3xl px-5 py-4 flex items-center gap-3 flex-wrap text-[12px] text-slate-400">
          <span className="flex items-center gap-1.5"><Castle className="w-4 h-4 text-amber-300" /> مدينة الأمير الرقمية — FAKSAB CITY © 2026</span>
          <span>•</span><span className="flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> بديل متكامل لمنظومة PHP الأصلية بقاعدة بيانات حية</span>
          <span className="flex-1" />
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> صكوك موثقة • دفع آمن • وكلاء معتمدون</span>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      {bidAuction && (
        <Modal title={`مزايدة: ${bidAuction.title}`} onClose={() => setBidAuction(null)}>
          <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex justify-between text-sm"><span className="text-slate-400">أعلى مزايدة حالية</span><b className="text-amber-300">{fmtMoney(bidAuction.currentBid)}</b></div>
          <div className="rounded-2xl bg-black/30 border border-white/10 p-3 flex justify-between text-sm"><span className="text-slate-400">الحد الأدنى المقبول</span><b className="text-emerald-300">{fmtMoney(bidAuction.currentBid + bidAuction.minIncrement)}</b></div>
          <label className="text-[12px] font-bold text-slate-300">اسم المزايد</label>
          <input value={bidName} onChange={(e) => setBidName(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-amber-300/60" />
          <label className="text-[12px] font-bold text-slate-300">مبلغ المزايدة (ر.س)</label>
          <input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} type="number" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-amber-300/60 font-black text-amber-300" dir="ltr" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => {
              const v = bidAuction.currentBid + bidAuction.minIncrement * (i + 1);
              return <button key={i} onClick={() => setBidAmount(String(v))} className="flex-1 rounded-lg bg-white/5 border border-white/10 text-[11px] py-1.5 hover:border-amber-300/50">+{(v / 1000).toFixed(0)}K</button>;
            })}
          </div>
          <button onClick={submitBid} className="w-full rounded-xl bg-gradient-to-l from-amber-300 to-orange-500 text-black font-black py-3 hover:brightness-110 flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> تأكيد المزايدة</button>
        </Modal>
      )}

      {walletOpen && (
        <Modal title={walletKind === "deposit" ? "شحن المحفظة" : "سحب من المحفظة"} onClose={() => setWalletOpen(false)}>
          <div className="grid grid-cols-2 gap-2">
            {(["deposit", "withdraw"] as const).map((k) => (
              <button key={k} onClick={() => setWalletKind(k)} className={cx("rounded-xl py-2.5 text-sm font-black border", walletKind === k ? "bg-amber-400 text-black border-amber-300" : "bg-white/5 border-white/10")}>{k === "deposit" ? "شحن" : "سحب"}</button>
            ))}
          </div>
          <label className="text-[12px] font-bold text-slate-300">المبلغ (ر.س)</label>
          <input value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} type="number" placeholder="مثال: 500000" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 outline-none focus:border-amber-300/60 font-black" dir="ltr" />
          <div className="grid grid-cols-4 gap-1.5">
            {[100000, 500000, 1000000, 2000000].map((v) => (
              <button key={v} onClick={() => setWalletAmount(String(v))} className="rounded-lg bg-white/5 border border-white/10 text-[11px] py-1.5 hover:border-amber-300/50">{(v / 1000).toFixed(0)}K</button>
            ))}
          </div>
          <button onClick={submitWallet} className="w-full rounded-xl bg-gradient-to-l from-amber-300 to-amber-600 text-black font-black py-3">تأكيد العملية</button>
        </Modal>
      )}

      {apptOpen && (
        <Modal title="حجز موعد جديد" onClose={() => setApptOpen(false)}>
          <Inp label="عنوان الموعد" v={fAppt.title} set={(v) => setFAppt({ ...fAppt, title: v })} ph="مثال: معاينة فيلا الياسمين" />
          <div className="grid grid-cols-2 gap-2">
            <Inp label="اسم العميل" v={fAppt.clientName} set={(v) => setFAppt({ ...fAppt, clientName: v })} ph="اسم العميل" />
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">الوكيل</label><select value={fAppt.agentName} onChange={(e) => setFAppt({ ...fAppt, agentName: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option value="">— اختر —</option>{agents.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">كود العقار</label><select value={fAppt.propertyCode} onChange={(e) => setFAppt({ ...fAppt, propertyCode: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option value="">—</option>{properties.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}</select></div>
            <Inp label="التاريخ" v={fAppt.dateText} set={(v) => setFAppt({ ...fAppt, dateText: v })} ph="2026-10-14" />
            <Inp label="الوقت" v={fAppt.timeText} set={(v) => setFAppt({ ...fAppt, timeText: v })} ph="17:30" />
          </div>
          <div><label className="text-[12px] font-bold text-slate-300 block mb-1">نوع الموعد</label><select value={fAppt.type} onChange={(e) => setFAppt({ ...fAppt, type: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option value="viewing">معاينة</option><option value="signing">توقيع عقد</option><option value="consultation">استشارة</option><option value="inspection">فحص فني</option></select></div>
          <button onClick={async () => {
            if (!fAppt.title || !fAppt.clientName) { toast("أكمل عنوان الموعد واسم العميل", false); return; }
            const r = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fAppt) });
            const j = await r.json();
            if (j.ok) { toast("تم حجز الموعد بنجاح"); addXp(30); setApptOpen(false); setFAppt({ title: "", clientName: "", agentName: "", propertyCode: "", dateText: "2026-10-13", timeText: "17:30", type: "viewing", notes: "" }); fetchAll(); }
          }} className="w-full rounded-xl bg-gradient-to-l from-pink-400 to-rose-500 text-black font-black py-3">تأكيد الحجز</button>
        </Modal>
      )}

      {clientOpen && (
        <Modal title="تسجيل عميل جديد" onClose={() => setClientOpen(false)}>
          <Inp label="اسم العميل" v={fClient.name} set={(v) => setFClient({ ...fClient, name: v })} ph="مثال: عبدالله الغامدي" />
          <div className="grid grid-cols-2 gap-2">
            <Inp label="الجوال" v={fClient.phone} set={(v) => setFClient({ ...fClient, phone: v })} ph="05xxxxxxxx" />
            <Inp label="الميزانية" v={fClient.budget} set={(v) => setFClient({ ...fClient, budget: v })} ph="2000000" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">الاهتمام</label><select value={fClient.interest} onChange={(e) => setFClient({ ...fClient, interest: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option>فيلا</option><option>شقة</option><option>أرض</option><option>تجاري</option><option>قصر</option><option>مستودعات</option></select></div>
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">الوكيل المسؤول</label><select value={fClient.agentName} onChange={(e) => setFClient({ ...fClient, agentName: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option value="">—</option>{agents.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</select></div>
          </div>
          <button onClick={async () => {
            if (!fClient.name) { toast("أدخل اسم العميل", false); return; }
            const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fClient, budget: Number(fClient.budget) }) });
            const j = await r.json();
            if (j.ok) { toast("تم تسجيل العميل"); addXp(20); setClientOpen(false); fetchAll(); }
          }} className="w-full rounded-xl bg-gradient-to-l from-violet-400 to-indigo-500 text-black font-black py-3">حفظ العميل</button>
        </Modal>
      )}

      {propOpen && (
        <Modal title="إضافة عقار للمدينة" onClose={() => setPropOpen(false)}>
          <Inp label="اسم العقار" v={fProp.title} set={(v) => setFProp({ ...fProp, title: v })} ph="مثال: فيلا النرجس الحديثة" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">الحي</label><select value={fProp.district} onChange={(e) => setFProp({ ...fProp, district: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none">{Object.keys(DISTRICT_COLORS).map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label className="text-[12px] font-bold text-slate-300 block mb-1">النوع</label><select value={fProp.type} onChange={(e) => setFProp({ ...fProp, type: e.target.value })} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none"><option value="villa">فيلا</option><option value="apartment">شقة</option><option value="land">أرض</option><option value="commercial">تجاري</option><option value="tower">برج</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Inp label="المساحة م²" v={fProp.area} set={(v) => setFProp({ ...fProp, area: v })} ph="400" />
            <Inp label="السعر ر.س" v={fProp.price} set={(v) => setFProp({ ...fProp, price: v })} ph="1500000" />
          </div>
          <button onClick={async () => {
            if (!fProp.title) { toast("أدخل اسم العقار", false); return; }
            const r = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fProp, area: Number(fProp.area), price: Number(fProp.price), bedrooms: Number(fProp.bedrooms), bathrooms: Number(fProp.bathrooms), posX: 20 + Math.floor(Math.random() * 60), posY: 20 + Math.floor(Math.random() * 60) }) });
            const j = await r.json();
            if (j.ok) { toast("تمت إضافة العقار للخريطة"); addXp(50); setPropOpen(false); fetchAll(); }
          }} className="w-full rounded-xl bg-gradient-to-l from-amber-300 to-amber-600 text-black font-black py-3">إضافة للخريطة</button>
        </Modal>
      )}

      {agentOpen && (
        <Modal title="اعتماد وكيل جديد" onClose={() => setAgentOpen(false)}>
          <Inp label="اسم الوكيل" v={fAgent.name} set={(v) => setFAgent({ ...fAgent, name: v })} ph="مثال: أ. محمد الحربي" />
          <div className="grid grid-cols-2 gap-2">
            <Inp label="الجوال" v={fAgent.phone} set={(v) => setFAgent({ ...fAgent, phone: v })} ph="05xxxxxxxx" />
            <Inp label="سنوات الخبرة" v={fAgent.experience} set={(v) => setFAgent({ ...fAgent, experience: v })} ph="3" />
          </div>
          <Inp label="التخصص" v={fAgent.specialty} set={(v) => setFAgent({ ...fAgent, specialty: v })} ph="فلل فاخرة" />
          <button onClick={async () => {
            if (!fAgent.name) { toast("أدخل اسم الوكيل", false); return; }
            const r = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fAgent, experience: Number(fAgent.experience) }) });
            const j = await r.json();
            if (j.ok) { toast("تم اعتماد الوكيل"); setAgentOpen(false); fetchAll(); }
          }} className="w-full rounded-xl bg-sky-400 text-black font-black py-3">اعتماد</button>
        </Modal>
      )}

      {offerOpen && (
        <Modal title="إطلاق عرض جديد" onClose={() => setOfferOpen(false)}>
          <Inp label="عنوان العرض" v={fOffer.title} set={(v) => setFOffer({ ...fOffer, title: v })} ph="مثال: خصم الشتاء الذهبي" />
          <div className="grid grid-cols-2 gap-2">
            <Inp label="السعر قبل" v={fOffer.oldPrice} set={(v) => setFOffer({ ...fOffer, oldPrice: v })} ph="1000000" />
            <Inp label="السعر بعد" v={fOffer.newPrice} set={(v) => setFOffer({ ...fOffer, newPrice: v })} ph="900000" />
          </div>
          <Inp label="الوصف" v={fOffer.description} set={(v) => setFOffer({ ...fOffer, description: v })} ph="تفاصيل العرض…" />
          <button onClick={async () => {
            const r = await fetch("/api/offers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fOffer, oldPrice: Number(fOffer.oldPrice), newPrice: Number(fOffer.newPrice) }) });
            const j = await r.json();
            if (j.ok) { toast("تم نشر العرض"); setOfferOpen(false); fetchAll(); }
          }} className="w-full rounded-xl bg-emerald-400 text-black font-black py-3">نشر العرض</button>
        </Modal>
      )}

      {auctionOpen && (
        <Modal title="إطلاق مزاد جديد" onClose={() => setAuctionOpen(false)}>
          <Inp label="عنوان المزاد" v={fAuction.title} set={(v) => setFAuction({ ...fAuction, title: v })} ph="مثال: مزاد أرض الواحة" />
          <div className="grid grid-cols-2 gap-2">
            <Inp label="السعر الافتتاحي" v={fAuction.startPrice} set={(v) => setFAuction({ ...fAuction, startPrice: v })} ph="1000000" />
            <Inp label="الخطوة الدنيا" v={fAuction.minIncrement} set={(v) => setFAuction({ ...fAuction, minIncrement: v })} ph="20000" />
          </div>
          <button onClick={async () => {
            const r = await fetch("/api/auctions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fAuction, startPrice: Number(fAuction.startPrice), minIncrement: Number(fAuction.minIncrement), status: "live", endsAt: new Date(Date.now() + 86400000).toISOString() }) });
            const j = await r.json();
            if (j.ok) { toast("انطلق المزاد الجديد"); setAuctionOpen(false); fetchAll(); }
          }} className="w-full rounded-xl bg-gradient-to-l from-orange-400 to-red-500 text-black font-black py-3">بدء المزاد الحي</button>
        </Modal>
      )}

      {/* toasts */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-[min(420px,90vw)]">
        {toasts.map((t) => (
          <div key={t.id} className={cx("rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl border flex items-center gap-2 animate-rise", t.ok ? "bg-emerald-500 text-black border-emerald-200" : "bg-rose-500 text-white border-rose-200")}>
            {t.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass rounded-3xl p-5 space-y-3 animate-rise max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <p className="font-black flex-1">{title}</p>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Inp({ label, v, set, ph }: { label: string; v: string; set: (v: string) => void; ph?: string }) {
  return (
    <div>
      <label className="text-[12px] font-bold text-slate-300 block mb-1">{label}</label>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-amber-300/60 placeholder:text-slate-600" />
    </div>
  );
}
