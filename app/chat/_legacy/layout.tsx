import React from "react"
import PMSidebar from "@/app/pm/components/PMSidebar"

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-screen flex bg-[#050505] text-white overflow-hidden font-sans">
            <PMSidebar />
            {children}
        </div>
    )
}
