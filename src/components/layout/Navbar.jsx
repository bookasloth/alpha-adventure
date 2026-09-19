"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { navLinks, site } from "@/data/site";

function hasChildren(item) {
  return Array.isArray(item.children) && item.children.length > 0;
}

function DesktopDropdown({ item }) {
  if (!hasChildren(item)) {
    return (
      <li>
        <Link href={item.href} className="drop-down">
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="menu-item-has-children">
      <Link href={item.href} className="drop-down">
        {item.label} <i className="bi bi-caret-down-fill" />
      </Link>
      <i className="bi bi-plus dropdown-icon" />
      <ul className="sub-menu">
        {item.children.map((child) => (
          <li key={child.href} className={hasChildren(child) ? "menu-item-has-children" : ""}>
            <Link href={child.href} className={hasChildren(child) ? "drop-down" : ""}>
              {child.label}{hasChildren(child) ? <i className="bi bi-caret-down-fill" /> : null}
            </Link>
            {hasChildren(child) && (
              <>
                <i className="bi bi-plus dropdown-icon" />
                <ul className="sub-menu">
                  {child.children.map((gc) => (
                    <li key={gc.href}>
                      <Link href={gc.href}>{gc.label}</Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

function MobileLink({ item, depth = 0 }) {
  return (
    <div>
      <Link
        href={item.href}
        className={`block px-3 py-2 rounded-md text-sm ${depth === 0 ? "font-semibold text-ink" : "text-gray-600"}`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        {item.label}
      </Link>
      {hasChildren(item) &&
        item.children.map((c) => <MobileLink key={c.href} item={c} depth={depth + 1} />)}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="topbar-area three d-lg-block d-none">
        <div className="container">
          <div className="topbar-wrap">
            <div className="logo-and-search-area">
              <Link href="/" className="header-logo">
                <img src={site.logo} alt={site.name} />
              </Link>
              <div className="search-bar">
                <button type="button" className="search-btn" onClick={() => setSearchOpen((v) => !v)} aria-label="Toggle search">
                  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.8044 14.8855L13.0544 12.198L12.99 12.1002C12.8688 11.9807 12.7055 11.9137 12.5353 11.9137C12.3651 11.9137 12.2018 11.9807 12.0806 12.1002C9.74343 14.2443 6.14312 14.3605 3.66561 12.3724C1.18811 10.3843 0.604677 6.90645 2.30061 4.24832C3.99655 1.5902 7.44655 0.573637 10.3631 1.87332C13.2797 3.17301 14.755 6.38739 13.8125 9.38239C13.7793 9.48905 13.7753 9.60268 13.8011 9.71137C13.8269 9.82007 13.8815 9.91983 13.9591 10.0002C14.0375 10.082 14.1358 10.1421 14.2443 10.1746C14.3528 10.2071 14.4679 10.211 14.5784 10.1858C14.6883 10.1616 14.79 10.109 14.8732 10.0332C14.9564 9.95744 15.0182 9.86113 15.0525 9.75395C16.1775 6.19989 14.4781 2.37489 11.0525 0.75395C7.62686 -0.866988 3.50468 0.200824 1.35124 3.26864C-0.802198 6.33645 -0.34001 10.4818 2.43905 13.0239C5.21811 15.5661 9.47968 15.7408 12.4687 13.4377L14.9037 15.8183C15.026 15.9358 15.1889 16.0014 15.3584 16.0014C15.5279 16.0014 15.6909 15.9358 15.8131 15.8183C15.8728 15.7599 15.9201 15.6902 15.9525 15.6133C15.9848 15.5363 16.0015 15.4537 16.0015 15.3702C16.0015 15.2867 15.9848 15.2041 15.9525 15.1271C15.9201 15.0502 15.8728 14.9805 15.8131 14.9221L15.8044 14.8855Z" />
                  </svg>
                </button>
                <div className={`search-input ${searchOpen ? "active" : ""}`}>
                  <input type="text" placeholder="Find Your Perfect Trek Package" />
                </div>
              </div>
            </div>
            <div className="topbar-right">
              <div className="support-and-language-area">
                <Link href="/shop">Shop</Link>
                <Link href="/travel-calendar">Travel Calendar</Link>
                <Link href="/gallery">Gallery</Link>
                <Link href="/about-us">Why Us</Link>
                <Link href="/contact">Need Help?</Link>
              </div>
              <Link href="/user-dashboard" className="primary-btn1 four transparent">
                <span>Dashboard</span>
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <header className={`style-1 three ${scrolled ? "sticky" : ""}`}>
        <div className="container d-flex flex-nowrap align-items-center justify-content-lg-center justify-content-between">
          <Link href="/" className="header-logo d-lg-none d-block">
            <img src={site.logo} alt={site.name} />
          </Link>

          <div className={`main-menu ${open ? "show-menu" : ""}`}>
            <div className="mobile-logo-area d-lg-none d-flex align-items-center justify-content-between">
              <Link href="/" className="mobile-logo-wrap">
                <img src={site.logo} alt={site.name} />
              </Link>
              <div className="menu-close-btn" onClick={() => setOpen(false)}>
                <i className="bi bi-x" />
              </div>
            </div>
            <ul className="menu-list">
              {navLinks.map((item) => (
                <DesktopDropdown key={item.href} item={item} />
              ))}
            </ul>
          </div>

          <div className="language-and-login-area d-lg-flex d-none align-items-center gap-3">
            <Link href="/user-dashboard" className="primary-btn1 four transparent">
              <span>Dashboard</span>
              <span>Dashboard</span>
            </Link>
          </div>

          <button
            className={`menu-toggle d-lg-none ${scrolled ? "text-ink" : "text-white"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list" />
          </button>
        </div>
      </header>

      {open && <div className="mobile-menu-backdrop d-lg-none" onClick={() => setOpen(false)} />}
    </>
  );
}
