'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ToogleTheme } from '../Theme/theme-toogle'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/Logo png.png"
              alt="Logo"
              width={160}
              height={40}
              className="w-40 "
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/Templates">Templates</NavLink>
            <NavLink href="/Pricing">Pricing</NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <ToogleTheme />

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
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
            <NavLink href="/Templates" onClick={() => setIsOpen(false)}>
              Templates
            </NavLink>
            <NavLink href="/Pricing" onClick={() => setIsOpen(false)}>
              Pricing
            </NavLink>
           

            <div className="flex flex-col gap-2 pt-2">
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
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

const NavLink = ({ href, children, onClick }: any) => (
  <Link
    href={href}
    onClick={onClick}
    className="text-lg text-muted-foreground hover:text-foreground transition-colors"
  >
    {children}
  </Link>
)

export default Navbar
