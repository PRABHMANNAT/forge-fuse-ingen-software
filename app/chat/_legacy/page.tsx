"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OmniLogo } from "@/components/omni-logo"
import { CandidateProfile } from "@/components/candidate-profile"
import { OutreachPanel } from "@/components/outreach-panel"
import {
    Search,
    Bookmark,
    Zap,
    Headphones,
    Settings,
    LogOut,
    ArrowUp,
    Loader2,
    CheckCircle2,
    MoreHorizontal,
    Github,
    Globe,
    Filter,
    ArrowUpRight,
    Sparkles,
    TerminalSquare,
    X,
    ChevronDown,
    Brain,
    ClipboardList,
    Hammer,
    Microscope,
    BarChart3,
    Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { DEMO_CANDIDATES } from "@/lib/demo-data"

// Types
type ViewState = "input" | "processing" | "results"

const SUGGESTIONS = [
    "SIMD optimization experts",
    "Binary instrumentation experts",
    "JIT compiler engineers",
    "Ray tracing specialists",
    "Hardware emulator developers"
]

const PROCESSING_STEPS = [
    "Scanning GitHub Graph...",
    "Analyzing contribution topology...",
    "Verifying cross-reference signals...",
    "Calculating expertise vectors...",
    "Ranking by proof depth..."
]

export default function ChatPage() {
    const router = useRouter()
    const [view, setView] = useState<ViewState>("input")
    const [query, setQuery] = useState("")
    const [processingStep, setProcessingStep] = useState(0)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
    const [streamingCandidates, setStreamingCandidates] = useState<any[]>([])

    // Filter states
    const [skillFilters, setSkillFilters] = useState<string[]>([
        "builds compilers/frontend and language",
        "implements parsing algorithms with st",
        "works on programming languages, Rust!",
        "Contributes to parser generators like"
    ])
    const [locationFilter, setLocationFilter] = useState("")
    const [securityFilter, setSecurityFilter] = useState<"all" | "safety">("all")
    const [repositoriesExpanded, setRepositoriesExpanded] = useState(false)
    const [showFilters, setShowFilters] = useState(true)
    const [showOutreach, setShowOutreach] = useState(false)

    // Helper to get stable score from candidate ID
    const getStableScore = (candidateId: string) => {
        // Simple hash function to get consistent "random" number from ID
        let hash = 0
        for (let i = 0; i < candidateId.length; i++) {
            hash = ((hash << 5) - hash) + candidateId.charCodeAt(i)
            hash = hash & hash // Convert to 32bit integer
        }
        const normalized = Math.abs(hash) % 100

        if (candidateId.startsWith('vip')) {
            return 95 + (normalized % 5) // VIP: 95-99
        }
        return 60 + (normalized % 31) // Others: 60-90
    }

    // Handlers
    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim()) return
        setView("processing")
        setProcessingStep(0)
        setStreamingCandidates([])

        try {
            // 1. Start streaming "found" candidates
            // Slower, more deliberate pace to simulate "deep analysis"
            const interval = setInterval(() => {
                setStreamingCandidates(prev => {
                    // Keep scanning until we hit the demo limit or api finishes
                    if (prev.length >= DEMO_CANDIDATES.length) {
                        clearInterval(interval)
                        return prev
                    }
                    return [...prev, DEMO_CANDIDATES[prev.length]]
                })
            }, 120) // Balanced: 120ms (approx 8 updates/sec)

            // Step 1
            await new Promise(r => setTimeout(r, 1200))
            setProcessingStep(1)

            // Step 2: Extract Skills (Real API)
            const diffRes = await fetch("/api/job/extract-skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: query }),
            })
            const diffData = await diffRes.json()
            await new Promise(r => setTimeout(r, 1000))
            setProcessingStep(2)

            // Step 3
            await new Promise(r => setTimeout(r, 1000))
            setProcessingStep(3)

            // Step 4: Analyze (Real API call structure, but using our expanded demo data)
            const analysisRes = await fetch("/api/candidates/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skills: diffData.skills || [],
                    candidates: DEMO_CANDIDATES.map(c => ({
                        id: c.id,
                        name: c.name,
                        roleType: c.roleType,
                        github: c.github,
                        signals: { githubUsername: c.github },
                        stats: c.stats, // Pass mock stats to backend
                        topRepos: c.topRepos // Pass mock repos
                    })),
                    job: { title: "Search Role", description: query },
                    tau: 0.4,
                }),
            })
            const analysisData = await analysisRes.json()
            setAnalysisResults(analysisData)

            if (analysisData.success) {
                localStorage.setItem("forge_job_config", JSON.stringify({
                    title: "Search Role",
                    description: query,
                    skills: diffData.skills,
                    updatedAt: new Date().toISOString()
                }))
                localStorage.setItem("forge_analysis", JSON.stringify(analysisData))
            }

            // Final Step
            await new Promise(r => setTimeout(r, 800))
            setProcessingStep(4)
            await new Promise(r => setTimeout(r, 500))

            // Show Results
            setView("results")

        } catch (error) {
            console.error("Search failed", error)
            setView("input")
        }
    }

    return (
        <>
            <AnimatePresence>
                {selectedCandidate && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[90]"
                        />
                        {/* Side Panel */}
                        <CandidateProfile
                            candidate={selectedCandidate}
                            onClose={() => setSelectedCandidate(null)}
                            analysis={analysisResults?.candidates?.find((c: any) => c.id === selectedCandidate.id)}
                            onAutoContact={() => { setSelectedCandidate(null); setShowOutreach(true) }}
                        />
                    </>
                )}
                {showOutreach && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOutreach(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[90]"
                        />
                        <OutreachPanel onClose={() => setShowOutreach(false)} candidates={DEMO_CANDIDATES} />
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar removed - handled by layout */}

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col overflow-hidden bg-[#050505] font-mono selection:bg-emerald-500/30">

                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <AnimatePresence mode="wait">
                    {view === "input" && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8 px-4 z-10"
                        >
                            <div className="flex flex-col items-center gap-6 mb-4">
                                <OmniLogo size={56} />
                                <h1 className="text-2xl font-light tracking-tight text-center text-white/80">
                                    Who are you looking for?
                                </h1>
                            </div>

                            {/* Ultra-Clean Search Input - ChatGPT Style */}
                            <form onSubmit={handleSearch} className="w-full relative group">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ex: Senior Rust Engineer with Kernel experience..."
                                    className="w-full bg-[#0A0A0A] rounded-2xl text-xl font-light text-white placeholder:text-white/20 px-6 py-4 pr-16 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all shadow-xl"
                                    autoFocus
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!query.trim()}
                                        className={cn(
                                            "rounded-lg w-10 h-10 transition-all duration-200",
                                            query.trim()
                                                ? "bg-white text-black hover:bg-white/90"
                                                : "bg-white/10 text-white/20 hover:bg-white/10"
                                        )}
                                    >
                                        <ArrowUp className="w-5 h-5" />
                                    </Button>
                                </div>
                            </form>

                            {/* Minimal Suggestions */}
                            <div className="flex flex-wrap justify-center gap-3 pt-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
                                {SUGGESTIONS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {view === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 z-10 relative overflow-hidden"
                        >
                            {/* Central Scanner Interface */}
                            <div className="flex flex-col items-center gap-8 relative z-20 w-full max-w-4xl">

                                <div className="text-center space-y-2 mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        LIVE_SCAN_ACTIVE
                                    </motion.div>
                                    <h2 className="text-3xl font-light tracking-tight text-white">
                                        Scanning <span className="font-mono text-emerald-500">{streamingCandidates.length}</span> / {DEMO_CANDIDATES.length} profiles
                                    </h2>
                                    <p className="text-white/40 text-sm">Identifying partial matches across 12 dimensions...</p>
                                </div>

                                {/* Active Scan Region */}
                                <div className="relative w-full h-96 rounded-xl bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center">

                                    {/* Scanning Line */}
                                    <motion.div
                                        animate={{ top: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                                        className="absolute left-0 right-0 h-px bg-emerald-500/50 z-30 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                    />

                                    {/* Rapid Fire Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8 w-full h-full opacity-50">
                                        <AnimatePresence mode="popLayout">
                                            {streamingCandidates.slice(-6).map((c, i) => ( // Show last 6
                                                <motion.div
                                                    key={c.id || i}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex items-center gap-4 p-4 rounded bg-white/5"
                                                >
                                                    <img src={`https://github.com/${c.github}.png`} className="w-10 h-10 rounded bg-white/10 grayscale" alt="" />
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-mono text-white/50 truncate w-full">{c.id}</div>
                                                        <div className="text-sm font-medium text-white truncate w-full">{c.name}</div>
                                                        <div className="flex gap-2 text-[9px] text-white/30 uppercase mt-1">
                                                            <span>{c.roleType}</span>
                                                            <span className="text-emerald-500/50">MATCH: {85 + (i * 2)}%</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* Tech Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-4 right-4 text-[10px] font-mono text-emerald-500/50 flex flex-col items-end gap-1">
                                            <span>MEM_USAGE: 402MB</span>
                                            <span>THREADS: 12</span>
                                            <span>LATENCY: 12ms</span>
                                        </div>
                                    </div>

                                </div>

                                <div className="h-4 overflow-hidden relative w-full max-w-md mx-auto mt-4">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={processingStep}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className="absolute inset-0 text-xs text-white/40 font-mono text-center uppercase tracking-widest"
                                        >
                                            {PROCESSING_STEPS[processingStep]}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {view === "results" && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex w-full z-10"
                        >
                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col">
                                {/* Sleek Header */}
                                <header className="flex items-center justify-between px-8 py-6 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
                                    <div className="flex items-center gap-6">
                                        <Button variant="ghost" size="icon" onClick={() => setView("input")} className="text-white/40 hover:text-white -ml-2 rounded-full">
                                            <ArrowUp className="w-5 h-5 -rotate-90" />
                                        </Button>
                                        <div>
                                            <h2 className="text-lg font-medium text-white tracking-tight">{query}</h2>
                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                {DEMO_CANDIDATES.length} verified matches
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="h-8 bg-white/5 hover:bg-white/10 text-xs font-medium rounded-full px-4"
                                        >
                                            <Filter className="w-3.5 h-3.5 mr-2" /> {showFilters ? 'Hide' : 'Show'} Filters
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 bg-white/5 hover:bg-white/10 text-xs font-medium rounded-full px-4">
                                            Export CSV
                                        </Button>
                                        <Button size="sm" className="h-8 bg-white text-black hover:bg-white/90 text-xs font-medium rounded-full px-4" onClick={() => setShowOutreach(true)}>
                                            <Sparkles className="w-3.5 h-3.5 mr-2" /> Auto-Contact
                                        </Button>
                                    </div>
                                </header>

                                {/* Results List - No "Cards", sleek rows */}
                                <div className="flex-1 overflow-y-auto w-full">
                                    <div className="divide-y divide-white/[0.03]">
                                        {DEMO_CANDIDATES.map((candidate, i) => {
                                            const analysis = analysisResults?.candidates?.find((c: any) => c.id === candidate.id);
                                            const score = analysis?.score ? Math.round(analysis.score * 100) : getStableScore(candidate.id);

                                            return (
                                                <motion.div
                                                    key={candidate.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.02 }}
                                                    onClick={() => setSelectedCandidate(candidate)}
                                                    className="group flex items-center gap-6 px-8 py-4 hover:bg-white/[0.02] transition-all cursor-pointer"
                                                >
                                                    {/* Rank/Score */}
                                                    <div className="w-12 text-center shrink-0">
                                                        <div className={cn(
                                                            "text-lg font-light",
                                                            score >= 90 ? "text-emerald-400" :
                                                                score >= 80 ? "text-white/90" :
                                                                    "text-white/50"
                                                        )}>{score}</div>
                                                        <div className="text-[9px] text-white/20 uppercase tracking-wider">Fit</div>
                                                    </div>

                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white/60 shrink-0 overflow-hidden relative">
                                                        {candidate.username ? (
                                                            <img src={`https://github.com/${candidate.username}.png`} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" />
                                                        ) : (
                                                            candidate.name.charAt(0)
                                                        )}
                                                    </div>

                                                    {/* Main Info */}
                                                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                                        <div className="col-span-5">
                                                            <div className="flex items-center gap-3 mb-0.5">
                                                                <h3 className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                                                                    {candidate.name}
                                                                </h3>
                                                                {candidate.id.startsWith('vip') && (
                                                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-medium tracking-wide uppercase">
                                                                        VIP
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-white/40 truncate font-light flex items-center gap-2">
                                                                <Github className="w-3 h-3" />
                                                                {candidate.username}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-7 flex items-center justify-between text-xs text-white/40">
                                                            <span className="truncate max-w-[200px]">{candidate.roleType}</span>

                                                            {/* Mini Stats */}
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col items-end w-16">
                                                                    <span className="text-white/70">{candidate.stats?.commits?.toLocaleString() || "-"}</span>
                                                                    <span className="text-[9px] uppercase tracking-wider text-white/20">Commits</span>
                                                                </div>
                                                                <div className="flex flex-col items-end w-16">
                                                                    <span className="text-white/70">{candidate.stats?.stars?.toLocaleString() || "-"}</span>
                                                                    <span className="text-[9px] uppercase tracking-wider text-white/20">Stars</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white rounded-full" onClick={(e) => e.stopPropagation()}>
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Filter Panel - Right Side */}
                            {showFilters && (
                                <motion.aside
                                    initial={{ x: 300, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 300, opacity: 0 }}
                                    className="w-[340px] bg-[#0A0A0A] flex flex-col overflow-hidden"
                                >
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* Skills Section */}
                                        <div className="space-y-3">
                                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Skills</div>
                                            <div className="space-y-2">
                                                {skillFilters.map((skill, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                                                        <span className="text-xs text-white/70 flex-1 truncate">{skill}</span>
                                                        <button
                                                            onClick={() => setSkillFilters(skillFilters.filter((_, index) => index !== i))}
                                                            className="text-white/40 hover:text-white transition-colors"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-white/40 hover:text-white hover:bg-white/5">
                                                + Add Skill Filter
                                            </Button>
                                        </div>

                                        {/* Location Section */}
                                        <div className="space-y-3">
                                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Location</div>
                                            <input
                                                type="text"
                                                placeholder="e.g. San Francisco, Ontario"
                                                value={locationFilter}
                                                onChange={(e) => setLocationFilter(e.target.value)}
                                                className="w-full px-3 py-2 bg-white/5 rounded text-xs text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10"
                                            />
                                        </div>

                                        {/* Security Section */}
                                        <div className="space-y-3">
                                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Security</div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSecurityFilter("all")}
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded text-xs font-medium transition-colors",
                                                        securityFilter === "all"
                                                            ? "bg-white/10 text-white"
                                                            : "bg-white/5 text-white/50 hover:bg-white/10"
                                                    )}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    onClick={() => setSecurityFilter("safety")}
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded text-xs font-medium transition-colors",
                                                        securityFilter === "safety"
                                                            ? "bg-white/10 text-white"
                                                            : "bg-white/5 text-white/50 hover:bg-white/10"
                                                    )}
                                                >
                                                    Safety
                                                </button>
                                            </div>
                                        </div>

                                        {/* Repositories Section */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setRepositoriesExpanded(!repositoriesExpanded)}
                                                className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-white/30 font-medium hover:text-white/50 transition-colors"
                                            >
                                                <span>Repositories (10)</span>
                                                <ChevronDown className={cn("w-4 h-4 transition-transform", repositoriesExpanded && "rotate-180")} />
                                            </button>
                                            {repositoriesExpanded && (
                                                <div className="space-y-1 text-xs text-white/60">
                                                    <div className="px-2 py-1 hover:bg-white/5 rounded cursor-pointer">rust-lang/rust</div>
                                                    <div className="px-2 py-1 hover:bg-white/5 rounded cursor-pointer">torvalds/linux</div>
                                                    <div className="px-2 py-1 hover:bg-white/5 rounded cursor-pointer">microsoft/TypeScript</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Funnel Section */}
                                        <div className="space-y-3 pt-6">
                                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Funnel</div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-white/50">Candidates</span>
                                                    <span className="text-sm font-light text-white">7.5M+</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-white/50">Filtered</span>
                                                    <span className="text-sm font-light text-white">1.9M+</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-white/50">Analyzed</span>
                                                    <span className="text-sm font-light text-white">1.9M+</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-xs text-emerald-500 font-medium">Matches</span>
                                                    <span className="text-sm font-light text-emerald-500">1.9M+</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="p-4 space-y-2">
                                        <Button className="w-full h-9 bg-white text-black hover:bg-white/90 text-xs font-medium">
                                            Update
                                        </Button>
                                        <Button variant="ghost" className="w-full h-9 bg-white/5 hover:bg-white/10 text-xs font-medium">
                                            Expand Search
                                        </Button>
                                    </div>
                                </motion.aside>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(1000%); }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                .mask-image-b {
                    mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                }
            `}</style>
        </>
    )
}
