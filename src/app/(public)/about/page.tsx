"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    Target,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Cpu,
    CheckCircle2,
    ChevronRight,
    Layers,
    Lock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const STATS = [
    { value: "150+", label: "Enterprise & LGU Deployments", sub: "Nationwide Implementation" },
    { value: "99.9%", label: "Platform Availability", sub: "Mission-Critical Uptime" },
    { value: "45K+", label: "Active Daily Transactions", sub: "Processed Securely" },
    { value: "24/7", label: "Operations & Incident Support", sub: "Rapid SLA Response" },
]

const LEADERSHIP = [
    {
        name: "Engr. Raymond Tabelin, PCpE",
        role: "Chief Technology Officer",
        badge: "Architecture",
        bio: "Directs foundational infrastructure, engineering culture, and technological innovation across all enterprise deployments."
    },
    {
        name: "Andrei Jam Siapno",
        role: "IT Operations Manager",
        badge: "Infrastructure",
        bio: "Guarantees hardened multi-tenant reliability, cyber resilience, and cloud infrastructure continuity."
    },
    {
        name: "Erman Ace M. Cerujano",
        role: "Lead Product Manager",
        badge: "Product & Strategy",
        bio: "Translates complex administrative and local governance requirements into intuitive, citizen-centric product suites."
    },
    {
        name: "Bradley P. Mosuela",
        role: "Project Manager",
        badge: "Delivery",
        bio: "Orchestrates agile milestones, stakeholder alignment, and on-time rollout for mission-critical software systems."
    },
    {
        name: "Joy Roseth Gutierrez",
        role: "Account Manager",
        badge: "Client Success",
        bio: "Fosters long-term enterprise partnerships, high-touch onboarding, and continuous customer satisfaction."
    },
    {
        name: "Jonas S. Penullar",
        role: "Technical Support Lead",
        badge: "Support",
        bio: "Maintains rapid resolution triage and operational diagnostics to keep daily enterprise operations seamless."
    }
]

const PILLARS = [
    {
        icon: Target,
        title: "Purpose-Built Agility",
        desc: "Tailored to the exact operational dynamics of local government units, enterprises, and workforce systems.",
        color: "text-cyan-500",
        bg: "bg-cyan-500/10 border-cyan-500/20"
    },
    {
        icon: ShieldCheck,
        title: "Enterprise Governance",
        desc: "Role-based access controls, complete audit telemetry, and strict regulatory adherence built into core layers.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
        icon: Cpu,
        title: "High-Throughput Engines",
        desc: "Engineered on modern Next.js 15, React 19, and optimized query layers for sub-second UI responsiveness.",
        color: "text-violet-500",
        bg: "bg-violet-500/10 border-violet-500/20"
    },
    {
        icon: Lock,
        title: "Data Sovereignty",
        desc: "Ensuring organizational records, employee data, and financial audits remain secure, isolated, and immutable.",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20"
    }
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden selection:bg-cyan-500/30">
            {/* Ambient Background Auras */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-8%] left-[-8%] w-[45%] h-[45%] bg-cyan-500/10 dark:bg-cyan-500/15 blur-[140px] rounded-full" />
                <div className="absolute top-[35%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 dark:bg-violet-500/15 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[25%] w-[45%] h-[40%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10">
                {/* HERO SECTION */}
                <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6">
                    <div className="max-w-6xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex justify-center"
                        >
                            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                    OUR IDENTITY // VERTEX TECHNOLOGIES
                                </span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight italic leading-[0.95] text-slate-900 dark:text-white"
                        >
                            Empowering <br />
                            <span className="bg-gradient-to-r from-cyan-600 via-teal-500 to-indigo-600 dark:from-cyan-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">
                                Communities & Enterprise
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl font-normal text-slate-600 dark:text-slate-300 leading-relaxed"
                        >
                            We architect secure, scalable operating systems that modernize administrative workflows, elevate citizen engagement, and unlock operational clarity.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button asChild size="lg" className="rounded-xl h-13 px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30">
                                <Link href="/services">
                                    Explore Solutions
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-xl h-13 px-8 border-slate-300 dark:border-white/15 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-white/10 font-bold uppercase tracking-wider text-xs text-slate-800 dark:text-white transition-all">
                                <Link href="/contact">
                                    Connect With Us
                                </Link>
                            </Button>
                        </motion.div>

                        {/* Feature Badges Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium"
                        >
                            {["Next-Gen HR & ERP", "Local Government Modernization", "Real-Time Telemetry", "High-Security Standards"].map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-200/60 dark:bg-white/5 border border-slate-300/60 dark:border-white/10">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                    {tag}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* MISSION & VISION BENTO */}
                <section className="py-20 px-6 border-y border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center space-y-3">
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                                FOUNDATIONAL PURPOSE
                            </Badge>
                            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                Driven By Purpose & Precision
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Mission Card (7 Cols) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="lg:col-span-7 rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-white via-white/90 to-cyan-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/20 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-mono font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">Core Mission</span>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            Transforming administrative friction into streamlined digital velocity.
                                        </h3>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
                                        To empower local governments, modern enterprises, and educational institutions by replacing cumbersome manual workflows with secure, reliable, and intelligent software. We equip leaders to focus on what matters most: serving constituents and scaling sustainable operations.
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                                    <Sparkles className="w-4 h-4 text-cyan-500" />
                                    Measurable outcomes • Human-centric engineering
                                </div>
                            </motion.div>

                            {/* Vision Card (5 Cols) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="lg:col-span-5 rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-white via-white/90 to-violet-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-violet-950/20 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase">Long-Term Vision</span>
                                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            The benchmark standard for integrated systems.
                                        </h3>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                        A future where public and enterprise management systems run on intuitive, secure, and interoperable architectures—delivering transparent governance and high-efficiency productivity nationwide.
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                                    <Layers className="w-4 h-4 text-violet-500" />
                                    Unified Ecosystems • Scalable Resilience
                                </div>
                            </motion.div>
                        </div>

                        {/* Four Core Pillars */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                            {PILLARS.map((pillar, i) => {
                                const Icon = pillar.icon
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                        className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 transition-all duration-300 space-y-3 group hover:shadow-md"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${pillar.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                                            <Icon className={`w-5 h-5 ${pillar.color}`} />
                                        </div>
                                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{pillar.title}</h4>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{pillar.desc}</p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* IMPACT STATS */}
                <section className="py-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                                {STATS.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className={`space-y-2 ${i !== 0 ? 'sm:pl-8' : ''} ${i !== 0 ? 'pt-6 sm:pt-0' : ''}`}
                                    >
                                        <span className="text-4xl sm:text-5xl lg:text-6xl font-black italic tracking-tight bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                                            {stat.value}
                                        </span>
                                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">{stat.label}</p>
                                        <p className="text-xs text-slate-400 font-mono">{stat.sub}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* LEADERSHIP & ARCHITECTS TEAM */}
                <section className="py-20 px-6 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200/80 dark:border-white/10">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                            <div className="space-y-3">
                                <Badge variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                                    THE MINDS BEHIND VOS
                                </Badge>
                                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    Leadership & Engineering
                                </h2>
                            </div>
                            <p className="max-w-md text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                A multidisciplinary unit of systems engineers, product strategists, and operations specialists dedicated to robust digitalization.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {LEADERSHIP.map((leader, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 text-sm font-mono">
                                                {leader.name.split(' ').map(n => n[0]).filter((_, idx) => idx < 2).join('')}
                                            </div>
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase font-semibold">
                                                {leader.badge}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                {leader.name}
                                            </h4>
                                            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400/90 uppercase tracking-wider font-mono">
                                                {leader.role}
                                            </p>
                                        </div>

                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {leader.bio}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA SECTION */}
                <section className="py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-8 p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
                                Ready to Elevate Your Organization?
                            </h2>
                            <p className="max-w-2xl mx-auto text-cyan-50 text-base sm:text-lg leading-relaxed">
                                Experience unified enterprise workflows, precise payroll automation, and next-level citizen service delivery.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                <Button asChild size="lg" className="rounded-xl h-12 px-8 bg-white text-slate-950 hover:bg-slate-100 font-bold uppercase tracking-wider text-xs shadow-md">
                                    <Link href="/contact">
                                        Contact Our Team
                                        <ChevronRight className="ml-1.5 w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-8 border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs backdrop-blur-sm">
                                    <Link href="/services">
                                        View Capabilities
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
