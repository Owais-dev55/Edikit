"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import ToogleTheme from "../Theme/theme-toogle";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";
import { logoutUser } from "@/lib/auth";
import { cancelSubscription } from "@/lib/payment";
import type { AppDispatch } from "@/redux/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast/showToast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user.user);
  const isLoading = useSelector((state: RootState) => state.user.isLoading);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await logoutUser(dispatch);
    setIsUserMenuOpen(false);
    showSuccessToast("Logged out successfully");
    router.push("/");
  };

  const handleCancelPlan = async () => {
    if (!user?.id && !user?.userId) return;
    setIsCanceling(true);
    try {
      await cancelSubscription(user.userId || user.id, dispatch);
      showSuccessToast("Plan cancelled and downgraded to Free");
      setIsUserMenuOpen(false);
    } catch {
      showErrorToast("Could not cancel plan. Please try again.");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Logo png.png"
              alt="Logo"
              width={160}
              height={40}
              className="w-40"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/templates">Templates</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <ToogleTheme />

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2 pr-2">
              {isLoading || minLoadingTime ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="w-29 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                </div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {user.avatar?.startsWith("http") ? (
                      <Image
                        src={user.avatar}
                        alt={user.fullName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs">
                        {user.avatar || getInitialsAvatar(user.fullName)}
                      </div>
                    )}
                    <span>{user.fullName}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          <span
                            className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              user.planType === "PRO"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                : user.planType === "BASIC"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {user.planType} Plan
                          </span>
                        </div>

                        {/* Upgrade/Manage Plan Button */}
                        {user.planType === "FREE" ? (
                          <Link
                            href="/pricing"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mx-2 my-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            style={{ width: "calc(100% - 1rem)" }}
                          >
                            Upgrade Plan
                          </Link>
                        ) : (
                          <div className="flex flex-col gap-2 px-2">
                            <Link
                              href="/pricing"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
                            >
                              Manage Plan
                            </Link>
                            <button
                              onClick={handleCancelPlan}
                              disabled={isCanceling}
                              className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isCanceling ? "Cancelling..." : "Cancel Plan"}
                            </button>
                          </div>
                        )}

                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors border-t border-border"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-md font-medium rounded-lg hover:bg-accent transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Try for free
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <NavLink href="/templates" onClick={() => setIsOpen(false)}>
              Templates
            </NavLink>
            <NavLink href="/pricing" onClick={() => setIsOpen(false)}>
              Pricing
            </NavLink>

            <div className="flex flex-col gap-2 pt-2">
              {isLoading || minLoadingTime ? (
                // Loading skeleton for mobile
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-4 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                    <div className="w-16 h-3 rounded bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  </div>
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2">
                    {user.avatar?.startsWith("http") ? (
                      <Image
                        src={user.avatar}
                        alt={user.fullName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs">
                        {user.avatar || getInitialsAvatar(user.fullName)}
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">
                        {user.fullName}
                      </span>
                      {/* Plan Badge */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                          user.planType === "PRO"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : user.planType === "BASIC"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {user.planType}
                      </span>
                    </div>
                  </div>

                  {/* Upgrade button for FREE users */}
                  {user.planType === "FREE" && (
                    <Link
                      href="/pricing"
                      onClick={() => setIsOpen(false)}
                      className="mx-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-center"
                    >
                      Upgrade Plan
                    </Link>
                  )}

                  {/* Manage Subscription for paid users */}
                  {(user.planType === "BASIC" || user.planType === "PRO") && (
                    <>
                      <Link
                        href="/pricing"
                        onClick={() => setIsOpen(false)}
                        className="mx-4 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent text-center"
                      >
                        Manage Plan
                      </Link>
                      <button
                        onClick={() => {
                          handleCancelPlan();
                          setIsOpen(false);
                        }}
                        disabled={isCanceling}
                        className="mx-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isCanceling ? "Cancelling..." : "Cancel Plan"}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Try for free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const NavLink = ({ href, children, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-lg transition-colors ${
        isActive
          ? "font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
};
