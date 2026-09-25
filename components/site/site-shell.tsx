"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { BusFront, Menu, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function SiteShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [passenger, setPassenger] = useState<{ name: string } | null>(null)
  const [admin, setAdmin] = useState<{ email: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setPassenger(data?.passenger ?? null)
        setAdmin(data?.admin ?? null)
      })
      .catch(() => {
        setPassenger(null)
        setAdmin(null)
      })
  }, [])
  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (response.ok) {
      setPassenger(null)
      setAdmin(null)
      router.push("/")
      router.refresh()
    }
  }
  const links = [
    { href: "/", label: "Home" },
    { href: "/trips", label: "Trip search" },
    ...(admin ? [{ href: "/admin", label: "Admin workspace" }] : []),
    ...(passenger
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/bookings", label: "My bookings" },
          { href: "/feedback", label: "Feedback" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
  ]
  return (
    <div className="smartmove-home min-h-svh w-full bg-[#f7faff] text-[#1d1d1f]">
      <header className="smartmove-header sticky top-0 z-40 border-b border-[#e8eef6]">
        <div className="mx-auto flex h-[72px] max-w-[1640px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#256acb]"
          >
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#2471d2] text-white">
              <Route className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-semibold tracking-[-0.045em]">
              SmartMove<span className="text-[#2f7ce3]">.</span>
            </span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 xl:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md text-sm font-medium text-[#626b77] hover:text-[#1d1d1f] focus-visible:outline-2 focus-visible:outline-[#256acb]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 xl:flex">
            {passenger || admin ? (
              <>
                <span className="max-w-32 truncate text-sm text-[#60718a]">
                  {passenger?.name ?? admin?.email}
                </span>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={logout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-full bg-[#1d1d1f] px-5 text-sm font-medium text-white hover:bg-[#38383b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#256acb]"
              >
                Sign in
              </Link>
            )}
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-full border border-[#e5e9ef] bg-white xl:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-white text-[#1d1d1f]">
              <SheetHeader>
                <SheetTitle>SmartMove</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 p-4"
              >
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 hover:bg-[#f2f6fb]"
                  >
                    {link.label}
                  </Link>
                ))}
                {passenger || admin ? (
                  <button
                    onClick={logout}
                    className="rounded-xl px-3 py-3 text-left hover:bg-[#f2f6fb]"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 hover:bg-[#f2f6fb]"
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1640px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16">
        {children}
      </main>
      <footer className="mt-16 border-t border-[#e7edf5] bg-white px-5 py-7 text-sm text-[#8493a7] sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto flex max-w-[1512px] items-center gap-2">
          <BusFront className="size-4" /> SmartMove · Transport booking
          coursework
        </div>
      </footer>
    </div>
  )
}
