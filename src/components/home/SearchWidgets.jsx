"use client";

import { useState } from "react";
import Link from "next/link";
import { cabins, filterOptions, searchTreks } from "@/data/treks";

const panels = ["trek", "cabin", "permit"];

export default function SearchWidgets() {
  const [active, setActive] = useState("trek");
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState(1);
  const [children, setChildren] = useState(0);

  const filteredTreks = searchTreks.filter((trek) =>
    trek.title.toLowerCase().includes(query.toLowerCase()) || trek.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="filter-wrapper -mt-8 relative z-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="filter-item-list">
          {panels.map((panel) => (
            <li key={panel} className={`single-item ${active === panel ? "active" : ""}`} onClick={() => setActive(panel)}>
              <span>
                {panel === "trek" ? "Search Your Adventure" : panel === "cabin" ? "Search Your Cabin" : "Search Permits"}
              </span>
            </li>
          ))}
        </ul>

        {active === "trek" && (
          <div className="filter-input-wrap">
            <form className="filter-input show" onSubmit={(e) => e.preventDefault()}>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value={query || "Where are you trekking?"} />
                  <div className="input-field-value">
                    <div className="destination">
                      <h6>{filteredTreks[0]?.title || "Rajgad Fort Trek"}</h6>
                      <span>{filteredTreks[0]?.location || "Pune Maharashtra"}</span>
                    </div>
                  </div>
                </div>
                <div className="custom-select-wrap">
                  <div className="custom-select-search-area">
                    <i className="bx bx-search" />
                    <input
                      type="text"
                      placeholder="Type Your Trek or Fort"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <ul className="option-list-destination">
                    {filteredTreks.slice(0, 10).map((trek) => (
                      <li key={trek.slug}>
                        <div className="destination">
                          <h6>{trek.title}</h6>
                          <span>{trek.location}</span>
                        </div>
                        <div className="tour">
                          <span>{trek.count} <br /> Treks</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="All Treks" />
                  <span>Category</span>
                </div>
                <div className="custom-select-wrap two">
                  <ul className="option-list">
                    {filterOptions.categories.map((item) => (
                      <li key={item} className="single-item"><h6>{item}</h6></li>
                    ))}
                  </ul>
                </div>
              </div>

              <button type="submit" className="primary-btn1">
                <span>SEARCH</span>
                <span>SEARCH</span>
              </button>
            </form>

            <form className="filter-input two" onSubmit={(e) => e.preventDefault()}>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="Rajgad Fort Cabin" />
                  <span>Cabin</span>
                </div>
                <div className="custom-select-wrap three">
                  <ul className="option-list-destination">
                    {cabins.slice(0, 9).map((c) => (
                      <li key={`${c.code}-${c.title}`}>
                        <div className="tour"><span>{c.code}</span></div>
                        <div className="destination">
                          <h6>{c.title}</h6>
                          <span>{c.location}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="single-search-box">
                <div className="custom-select-dropdown">
                  <h6>
                    {guests} Guests, {children} Children
                  </h6>
                  <span>{guests} Cabin</span>
                </div>
                <div className="custom-select-wrap">
                  <div className="title-area">
                    <h6>Guests and cabins</h6>
                    <span>Plan your Maharashtra fort escape.</span>
                  </div>
                  <ul className="room-list">
                    <li className="single-room">
                      <div className="room-title"><h6>Cabin 1</h6></div>
                      <ul className="guest-count">
                        <li className="single-item">
                          <div className="title"><h6>Adults</h6><span>16 years and above</span></div>
                          <div className="quantity-counter">
                            <button type="button" className="guest-quantity__minus" onClick={() => setGuests((v) => Math.max(1, v - 1))}>−</button>
                            <input readOnly value={guests} className="quantity__input" />
                            <button type="button" className="guest-quantity__plus" onClick={() => setGuests((v) => v + 1)}>+</button>
                          </div>
                        </li>
                        <li className="single-item">
                          <div className="title"><h6>Children</h6><span>0 to 16 years</span></div>
                          <div className="quantity-counter">
                            <button type="button" className="guest-quantity__minus" onClick={() => setChildren((v) => Math.max(0, v - 1))}>−</button>
                            <input readOnly value={children} className="quantity__input" />
                            <button type="button" className="guest-quantity__plus" onClick={() => setChildren((v) => v + 1)}>+</button>
                          </div>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>

              <button type="submit" className="primary-btn1">
                <span>SEARCH</span>
                <span>SEARCH</span>
              </button>
            </form>

            <form className="filter-input two" onSubmit={(e) => e.preventDefault()}>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="Maharashtra" />
                  <span>Region</span>
                </div>
                <div className="custom-select-wrap four">
                  <ul className="option-list visa-list">
                    {filterOptions.regions.map((r) => (
                      <li key={r} className="single-item"><h6>{r}</h6></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="Trekking Permit" />
                  <span>Permit Type</span>
                </div>
                <div className="custom-select-wrap two">
                  <ul className="option-list">
                    {filterOptions.permits.map((p) => (
                      <li key={p} className="single-item"><h6>{p}</h6></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="Small Trek Group" />
                  <span>Visitor Type</span>
                </div>
                <div className="custom-select-wrap four">
                  <ul className="option-list">
                    {filterOptions.visitors.map((v) => (
                      <li key={v} className="single-item"><h6>{v}</h6></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="single-search-box">
                <div className="custom-select-dropdown destination-dropdown">
                  <input type="text" readOnly value="Sahyadri Tiger Reserve" />
                  <span>Forest / Park</span>
                </div>
                <div className="custom-select-wrap four">
                  <ul className="option-list">
                    {filterOptions.forests.map((f) => (
                      <li key={f} className="single-item"><h6>{f}</h6></li>
                    ))}
                  </ul>
                </div>
              </div>
              <button type="submit" className="primary-btn1">
                <span>SEARCH</span>
                <span>SEARCH</span>
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-white/70">
          Can’t find what you’re looking for? <Link href="/contact" className="font-semibold text-white underline-offset-4 hover:underline">create your Custom Itinerary</Link>
        </div>
      </div>
    </section>
  );
}
