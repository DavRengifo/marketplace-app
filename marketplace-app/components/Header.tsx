"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
    const { data: session, status } = useSession();

    return (
        <header style={{
            borderBottom: "1px solid var(--line)",
            background: "var(--surface)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                height: "64px",
                maxWidth: "1200px",
                margin: "0 auto",
            }}>
                <Link href="/" style={{ fontWeight: 700, fontSize: "18px", color: "var(--foreground)" }}>
                    Harbor
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {status === "loading" ? null : session? (
                        <>
                            {session.user?.image && (
                            <Image
                                src={session.user.image}
                                alt={session.user?.name ?? "avatar"}
                                width={32}
                                height={32}
                                style={{ borderRadius: "50%", border: "2px solid var(--line)" }}
                            />
                            )}
                            <span
                                className="hidden sm:block"
                                style={{ fontSize: "14px", color: "var(--muted)" }}
                            >
                                {session.user?.name}
                            </span>
                            <Link
                                href="/bookings"
                                style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 600 }}
                            >
                                My Bookings
                            </Link>

                            <button
                                className="btn-secondary"
                                style={{ minHeight: "36px", padding: "0 16px", fontSize: "14px" }}
                                onClick={() => signOut()}
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn-primary"
                            style={{ minHeight: "36px", padding: "0 16px", fontSize: "14px" }}
                            onClick={() => signIn("github")}
                        >
                            Sign in with GitHub
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
