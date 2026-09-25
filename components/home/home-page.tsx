"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowRight,
  ArrowUpRight,
  BusFront,
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  Megaphone,
  Menu,
  Route,
  Search,
  Ticket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const featuredRoutes = [
  { number: "01", origin: "Colombo", destination: "Kandy", fare: 500 },
  { number: "02", origin: "Colombo", destination: "Galle", fare: 800 },
] as const

const navigation = [
  { label: "Home", href: "#home" },
  { label: "Routes", href: "#featured-routes" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Announcements", href: "#announcements" },
] as const

type SearchErrors = { origin?: string; destination?: string; date?: string }

function sriLankaTodayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function goToSearch() {
  document.getElementById("trip-search")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
  })
}

export function HomePage() {
  const router = useRouter()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signedIn, setSignedIn] = useState<"ADMIN" | "PASSENGER" | null>(null)
  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; body: string; sample: boolean }[]
  >([])
  const [announcementsUnavailable, setAnnouncementsUnavailable] =
    useState(false)
  const [errors, setErrors] = useState<SearchErrors>({})
  const originRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)
  const dateTriggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) =>
        setSignedIn(data.admin ? "ADMIN" : data.passenger ? "PASSENGER" : null)
      )
      .catch(() => setSignedIn(null))
    fetch("/api/announcements", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Announcements unavailable")
        const data = await response.json()
        setAnnouncements(data.announcements)
        setAnnouncementsUnavailable(false)
      })
      .catch(() => setAnnouncementsUnavailable(true))
  }, [])
  const links =
    signedIn === "ADMIN"
      ? [...navigation, { label: "Admin workspace", href: "/admin" }]
      : signedIn === "PASSENGER"
        ? [
            ...navigation,
            { label: "Dashboard", href: "/dashboard" },
            { label: "My bookings", href: "/bookings" },
          ]
        : navigation

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanOrigin = origin.trim()
    const cleanDestination = destination.trim()
    const nextErrors: SearchErrors = {}

    if (!cleanOrigin) nextErrors.origin = "Enter an origin city."
    if (!cleanDestination) nextErrors.destination = "Enter a destination city."
    if (
      cleanOrigin &&
      cleanDestination &&
      cleanOrigin.toLowerCase() === cleanDestination.toLowerCase()
    ) {
      nextErrors.destination = "Choose a destination different from the origin."
    }
    if (!departureDate) {
      nextErrors.date = "Choose a departure date."
    } else if (dateKey(departureDate) < sriLankaTodayKey()) {
      nextErrors.date = "Choose today or a future date in Sri Lanka."
    }

    setErrors(nextErrors)
    if (nextErrors.origin) originRef.current?.focus()
    else if (nextErrors.destination) destinationRef.current?.focus()
    else if (nextErrors.date) dateTriggerRef.current?.focus()
    else if (departureDate) {
      router.push(
        `/trips?${new URLSearchParams({ origin: cleanOrigin, destination: cleanDestination, date: dateKey(departureDate) })}`
      )
    }
  }

  function chooseFeaturedRoute(route: (typeof featuredRoutes)[number]) {
    setOrigin(route.origin)
    setDestination(route.destination)
    setErrors({})
    goToSearch()
    dateTriggerRef.current?.focus()
  }

  return (
    <div className="smartmove-home min-h-svh w-full bg-white text-[#1d1d1f]">
      <header className="smartmove-header sticky top-0 z-40 w-full shadow-[0_1px_0_rgba(25,58,105,0.06),0_12px_32px_rgba(25,58,105,0.04)]">
        <div className="mx-auto flex h-[76px] w-full max-w-[1640px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <a
            href="#home"
            className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#256acb]"
            aria-label="SmartMove home"
          >
            <span className="grid size-10 place-items-center rounded-[14px] bg-[#2471d2] text-white shadow-[0_8px_20px_rgba(34,102,201,0.16)]">
              <Route className="size-5" strokeWidth={2.3} aria-hidden="true" />
            </span>
            <span className="text-[20px] font-semibold tracking-[-0.045em] text-[#1d1d1f]">
              SmartMove<span className="text-[#2f7ce3]">.</span>
            </span>
          </a>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md text-sm font-medium text-[#626b77] transition-colors duration-150 hover:text-[#1d1d1f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#256acb]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={
                signedIn === "ADMIN"
                  ? "/admin"
                  : signedIn
                    ? "/dashboard"
                    : "/login"
              }
              className="rounded-full px-3 py-2 text-sm font-medium text-[#4d637f] hover:text-[#236bcf] focus-visible:outline-2 focus-visible:outline-[#236bcf]"
            >
              {signedIn === "ADMIN"
                ? "Admin"
                : signedIn
                  ? "Dashboard"
                  : "Sign in"}
            </Link>
            <Button
              onClick={goToSearch}
              className="h-10 rounded-full bg-[#1d1d1f] px-5 text-white transition-[background-color,transform] duration-150 hover:bg-[#38383b] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Find a trip{" "}
              <ArrowUpRight className="ml-1 size-4" aria-hidden="true" />
            </Button>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-full border border-[#e5e9ef] bg-white text-[#1d1d1f] transition-colors hover:bg-[#f5f7fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#256acb] lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(85vw,320px)] bg-white text-[#1d1d1f] motion-reduce:transition-none"
            >
              <SheetHeader className="border-b border-[#edf1f7] px-6 py-6">
                <SheetTitle className="text-[#1d1d1f]">SmartMove</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-1 px-4"
              >
                {links.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-medium text-[#3d4550] hover:bg-[#f2f6fb] focus-visible:outline-2 focus-visible:outline-[#256acb]"
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  href={
                    signedIn === "ADMIN"
                      ? "/admin"
                      : signedIn
                        ? "/dashboard"
                        : "/login"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-[#3d4550] hover:bg-[#f2f6fb]"
                >
                  {signedIn === "ADMIN"
                    ? "Admin"
                    : signedIn
                      ? "Dashboard"
                      : "Sign in"}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        <section
          id="home"
          aria-labelledby="hero-title"
          className="scroll-mt-[76px] bg-[radial-gradient(circle_at_78%_28%,#e9f3ff_0%,#f7fbff_35%,#fff_75%)] px-5 pt-14 pb-22 sm:px-8 sm:pt-20 lg:px-12 lg:pt-24 lg:pb-28 xl:px-16"
        >
          <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center text-center">
            <div className="flex w-full flex-col items-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf3ff] px-4 py-2 text-xs font-semibold tracking-[0.01em] text-[#2468bf] sm:mb-8">
                <span
                  className="size-1.5 rounded-full bg-[#397fdd]"
                  aria-hidden="true"
                />
                Your journey starts here
              </div>
              <h1
                id="hero-title"
                className="max-w-[1050px] text-[clamp(3rem,7vw,6.25rem)] leading-[1.02] font-semibold tracking-[-0.06em] text-[#1d1d1f]"
              >
                Find your way.{" "}
                <span className="text-[#2d72d2]">Move smarter.</span>
              </h1>
              <p className="mt-6 max-w-[640px] text-[17px] leading-8 text-[#636c79] sm:text-[19px]">
                Search scheduled trips, compare fares and choose your seats in
                one simple place.
              </p>

              <Card
                id="trip-search"
                className="smartmove-search-card mt-10 w-full max-w-[760px] scroll-mt-28 gap-0 rounded-[28px] border border-white/90 bg-white/90 py-0 text-left shadow-[0_24px_72px_rgba(41,83,139,0.13)] backdrop-blur-xl sm:mt-12"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-2 sm:px-7 sm:pt-7">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#2a6dc8]">
                      <Search className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-base font-semibold text-[#1d1d1f]">
                      Search your trip
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-[#f0f5fb] text-[#5a718f]"
                  >
                    Live search
                  </Badge>
                </CardHeader>
                <CardContent className="px-6 pt-5 pb-6 sm:px-7 sm:pb-7">
                  <form
                    onSubmit={submitSearch}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="trip-origin"
                          className="mb-2 text-[13px] font-semibold text-[#4d5664]"
                        >
                          From
                        </Label>
                        <div className="relative">
                          <MapPin
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5e91d1]"
                            aria-hidden="true"
                          />
                          <Input
                            ref={originRef}
                            id="trip-origin"
                            name="origin"
                            value={origin}
                            onChange={(event) => {
                              setOrigin(event.target.value)
                              setErrors((current) => ({
                                ...current,
                                origin: undefined,
                                destination: undefined,
                              }))
                            }}
                            onBlur={() => {
                              if (!origin.trim()) {
                                setErrors((current) => ({
                                  ...current,
                                  origin: "Enter an origin city.",
                                }))
                              }
                            }}
                            placeholder="Origin city"
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid={Boolean(errors.origin)}
                            aria-describedby={
                              errors.origin ? "origin-error" : undefined
                            }
                            className="h-14 rounded-2xl border-transparent bg-[#f4f6f8] pl-10 text-[15px] shadow-none focus-visible:border-[#2d72d2] focus-visible:ring-[#2d72d2]/15 dark:bg-[#f4f6f8]"
                          />
                        </div>
                        {errors.origin && (
                          <p
                            id="origin-error"
                            role="alert"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.origin}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="trip-destination"
                          className="mb-2 text-[13px] font-semibold text-[#4d5664]"
                        >
                          To
                        </Label>
                        <div className="relative">
                          <MapPin
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5e91d1]"
                            aria-hidden="true"
                          />
                          <Input
                            ref={destinationRef}
                            id="trip-destination"
                            name="destination"
                            value={destination}
                            onChange={(event) => {
                              setDestination(event.target.value)
                              setErrors((current) => ({
                                ...current,
                                destination: undefined,
                              }))
                            }}
                            onBlur={() => {
                              const cleanDestination = destination.trim()
                              if (!cleanDestination) {
                                setErrors((current) => ({
                                  ...current,
                                  destination: "Enter a destination city.",
                                }))
                              } else if (
                                cleanDestination.toLowerCase() ===
                                origin.trim().toLowerCase()
                              ) {
                                setErrors((current) => ({
                                  ...current,
                                  destination:
                                    "Choose a destination different from the origin.",
                                }))
                              }
                            }}
                            placeholder="Destination city"
                            autoComplete="off"
                            aria-required="true"
                            aria-invalid={Boolean(errors.destination)}
                            aria-describedby={
                              errors.destination
                                ? "destination-error"
                                : undefined
                            }
                            className="h-14 rounded-2xl border-transparent bg-[#f4f6f8] pl-10 text-[15px] shadow-none focus-visible:border-[#2d72d2] focus-visible:ring-[#2d72d2]/15 dark:bg-[#f4f6f8]"
                          />
                        </div>
                        {errors.destination && (
                          <p
                            id="destination-error"
                            role="alert"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.destination}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="trip-date"
                        className="mb-2 text-[13px] font-semibold text-[#4d5664]"
                      >
                        Departure date
                      </Label>
                      <Popover
                        open={calendarOpen}
                        onOpenChange={setCalendarOpen}
                      >
                        <PopoverTrigger
                          ref={dateTriggerRef}
                          id="trip-date"
                          type="button"
                          aria-required="true"
                          aria-invalid={Boolean(errors.date)}
                          aria-describedby={
                            errors.date ? "date-error" : undefined
                          }
                          className="flex h-14 w-full items-center gap-3 rounded-2xl border border-transparent bg-[#f4f6f8] px-3 text-left text-[15px] text-[#4d5664] transition-shadow outline-none focus-visible:border-[#2d72d2] focus-visible:ring-3 focus-visible:ring-[#2d72d2]/15 aria-invalid:border-red-500"
                        >
                          <CalendarDays
                            className="size-4 text-[#5e91d1]"
                            aria-hidden="true"
                          />
                          <span
                            className={
                              departureDate
                                ? "text-[#203653]"
                                : "text-[#8290a3]"
                            }
                          >
                            {departureDate
                              ? format(departureDate, "EEE, dd MMM yyyy")
                              : "Choose a date"}
                          </span>
                          <ChevronRight
                            className="ml-auto size-4 rotate-90 text-[#91a1b5]"
                            aria-hidden="true"
                          />
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto rounded-[20px] bg-white p-2 text-[#1d1d1f] shadow-[0_18px_60px_rgba(20,50,90,0.18)] [--background:#fff] [--foreground:#1d1d1f] [--muted-foreground:#6b7f9c] [--muted:#eff6ff] [--primary-foreground:#fff] [--primary:#236bcf] motion-reduce:animate-none"
                        >
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={(date) => {
                              setDepartureDate(date)
                              setErrors((current) => ({
                                ...current,
                                date: undefined,
                              }))
                              if (date) setCalendarOpen(false)
                            }}
                            disabled={(day) =>
                              dateKey(day) < sriLankaTodayKey()
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && (
                        <p
                          id="date-error"
                          role="alert"
                          className="mt-1.5 text-xs text-red-600"
                        >
                          {errors.date}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="h-13 w-full rounded-full bg-[#236bcf] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(35,107,207,0.18)] transition-[background-color,transform] duration-150 hover:bg-[#1d5db9] active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      Search trips{" "}
                      <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                    </Button>
                  </form>
                  <p className="mt-2 text-xs leading-5 text-[#8b98a9]">
                    Trip schedules and available seats are read from Oracle.
                    Booking requires a passenger account.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section
          id="featured-routes"
          aria-labelledby="routes-title"
          className="scroll-mt-[76px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16"
        >
          <div className="mx-auto w-full max-w-[1512px]">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.19em] text-[#3376ca] uppercase">
                  Start exploring
                </p>
                <h2
                  id="routes-title"
                  className="text-3xl font-semibold tracking-[-0.045em] text-[#1d1d1f] sm:text-4xl"
                >
                  Featured routes
                </h2>
                <p className="mt-3 max-w-[570px] text-sm leading-6 text-[#708096]">
                  A first look at routes from the SmartMove coursework sample
                  data.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="h-7 bg-[#eef5fd] px-3 text-[#547499]"
              >
                Sample routes &amp; fares
              </Badge>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {featuredRoutes.map((route) => (
                <Card
                  key={route.number}
                  className="overflow-hidden rounded-[28px] border border-[#edf0f4] bg-white py-0 shadow-[0_10px_38px_rgba(35,68,110,0.05)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(35,68,110,0.09)] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <CardContent className="gap-0 p-6 sm:p-8">
                    <div className="mb-10 flex items-start justify-between gap-3">
                      <div className="grid size-11 place-items-center rounded-xl bg-[#e8f2ff] text-[#2872d2]">
                        <Route className="size-5" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold tracking-[0.2em] text-[#8aa2c1]">
                        {route.number} / 02
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[25px] font-semibold tracking-[-0.045em] text-[#1d1d1f] sm:text-3xl">
                      <span>{route.origin}</span>
                      <ArrowRight
                        className="size-5 shrink-0 text-[#3980dc]"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span>{route.destination}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#70849e]">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      Sample route
                    </div>
                    <div className="mt-7 flex items-end justify-between gap-4 border-t border-[#e4edf8] pt-5">
                      <div>
                        <span className="block text-xs text-[#8595a8]">
                          Example fare
                        </span>
                        <span className="mt-0.5 block text-xl font-semibold text-[#1d3150]">
                          LKR {route.fare.toLocaleString("en-LK")}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => chooseFeaturedRoute(route)}
                        className="h-10 rounded-full border-[#c9dffa] bg-white px-4 text-[#286bc4] transition-[background-color,transform] duration-150 hover:bg-[#eef6ff] hover:text-[#1d5bae] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none dark:border-[#c9dffa] dark:bg-white dark:hover:bg-[#eef6ff]"
                      >
                        Use this route{" "}
                        <ArrowUpRight
                          className="ml-1 size-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="steps-title"
          className="scroll-mt-[76px] bg-[#f5f7fa] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16"
        >
          <div className="mx-auto w-full max-w-[1512px]">
            <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.19em] text-[#3376ca] uppercase">
                  A simpler way to travel
                </p>
                <h2
                  id="steps-title"
                  className="text-3xl font-semibold tracking-[-0.045em] text-[#1d1d1f] sm:text-4xl"
                >
                  How booking works
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#708096]">
                  Search, select seats and reserve your trip. Staff issue
                  tickets after payment is recorded.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="h-7 bg-[#e6f1ff] px-3 text-[#547499]"
              >
                Booking flow
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  number: "01",
                  title: "Search",
                  description: "Choose where and when you want to travel.",
                  icon: Search,
                },
                {
                  number: "02",
                  title: "Choose seats",
                  description: "Review the trip and select your seats.",
                  icon: BusFront,
                },
                {
                  number: "03",
                  title: "Book",
                  description:
                    "Confirm your reservation; staff record payment.",
                  icon: Check,
                },
                {
                  number: "04",
                  title: "Get ticket",
                  description: "Tickets are issued once payment is recorded.",
                  icon: Ticket,
                },
              ].map((step) => (
                <Card
                  key={step.number}
                  className="rounded-[24px] border border-[#e9edf3] bg-white py-0 shadow-[0_10px_30px_rgba(35,68,110,0.04)]"
                >
                  <CardContent className="gap-0 p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-[#eaf3ff] text-[#2d70c7]">
                        <step.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-bold tracking-[0.18em] text-[#aac0dc]">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mt-7 text-lg font-semibold tracking-[-0.025em] text-[#1d3150]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#74849a]">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#8192a8]">
              Online payment is not available. Pending seats are held for 30
              minutes.
            </p>
          </div>
        </section>

        <section
          id="announcements"
          aria-labelledby="announcements-title"
          className="scroll-mt-[76px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16"
        >
          <div className="mx-auto w-full max-w-[1512px]">
            <div className="mb-8">
              <p className="mb-2 text-xs font-bold tracking-[0.19em] text-[#3376ca] uppercase">
                Good to know
              </p>
              <h2
                id="announcements-title"
                className="text-3xl font-semibold tracking-[-0.045em] text-[#1d1d1f] sm:text-4xl"
              >
                Announcements
              </h2>
            </div>
            {announcementsUnavailable || announcements.length === 0 ? (
              <p className="rounded-[28px] bg-[#f5f9fe] p-8 text-sm text-[#6e8098]">
                {announcementsUnavailable
                  ? "Announcements are temporarily unavailable."
                  : "No current announcements."}
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {announcements.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden rounded-[28px] border border-[#e2ecf8] bg-[linear-gradient(110deg,#edf5ff_0%,#f8fbff_67%,#ffffff_100%)] py-0 shadow-none"
                  >
                    <CardContent className="flex gap-5 p-7 sm:p-9">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#d8eaff] text-[#286dcc]">
                        <Megaphone className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <Badge
                          variant="secondary"
                          className="mb-3 bg-white/90 text-[#557cab]"
                        >
                          {item.sample
                            ? "Sample announcement"
                            : "Service update"}
                        </Badge>
                        <h3 className="text-xl font-semibold tracking-[-0.035em] text-[#1c3150]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#6e8098]">
                          {item.body}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e9edf3] bg-[#f7f9fb] px-5 py-8 text-xs text-[#8a99ab] sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto flex w-full max-w-[1512px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-[#405e85]">
            SmartMove{" "}
            <span className="font-normal text-[#95a2b3]">
              · Transport booking concept
            </span>
          </span>
          <span>Sample content shown for the coursework project.</span>
        </div>
      </footer>
    </div>
  )
}
