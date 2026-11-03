import React, { useEffect, useRef, useState } from "react";
import "./LocationOfferHome.css";
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Tag, 
  Utensils, 
  BedDouble, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";

/**
 * @typedef {Object} DeliveryLocation
 * @property {string} id
 * @property {string} label
 * @property {string} city
 * @property {string} [address]
 */

/**
 * @typedef {Object} ActiveOffer
 * @property {string} id
 * @property {string} [eyebrow]
 * @property {string} title
 * @property {string} detail
 * @property {string} terms
 * @property {string} [endsAt]
 */

export function LocationOfferHome({
  selectedLocation,
  activeOffer,
  suggestions = [],
  isSearching = false,
  onSearchLocations,
  onResolveCoordinates,
  onSelectLocation,
  onNavigate,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  // Debounced locality search (250ms)
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const q = query.trim();
      if (q.length >= 2 && typeof onSearchLocations === "function") {
        onSearchLocations(q);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, onSearchLocations]);

  // Focus input and handle Escape key
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function choose(location) {
    setBusy(true);
    setMessage("");
    try {
      if (typeof onSelectLocation === "function") {
        await onSelectLocation(location);
      }
      setOpen(false);
      setQuery("");
    } catch {
      setMessage("We couldn't save that location. Please try again or choose another.");
    } finally {
      setBusy(false);
    }
  }

  function useCurrentLocation() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Location isn't available in this browser. Search or enter your address instead.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          if (typeof onResolveCoordinates === "function") {
            const location = await onResolveCoordinates(coords.latitude, coords.longitude);
            if (location) {
              await choose(location);
            } else {
              setMessage("We couldn't match that location. Please enter your address manually.");
            }
          }
        } catch {
          setMessage("We couldn't check that location. Please enter your address manually.");
        } finally {
          setBusy(false);
        }
      },
      (error) => {
        setBusy(false);
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. You can still search or enter your address."
            : "Couldn't get your location. Please search your nearest Barpeta landmark manually."
        );
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  }

  return (
    <section className="location-offer-home" aria-label="Location, Offers and Core Actions">
      <div className="location-offer-container">
        
        {/* Top Location Bar */}
        <div className="location-bar-wrapper">
          <button
            type="button"
            className="location-pill-btn"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={selectedLocation ? `Delivery location: ${selectedLocation.label}. Click to change.` : "Choose delivery location"}
          >
            <div className="location-pin-icon">
              <MapPin size={17} />
            </div>
            <div className="location-label-group">
              <span className="location-subtext">Delivery To:</span>
              <strong className="location-main-label">
                {selectedLocation ? selectedLocation.label : "Choose delivery location"}
              </strong>
            </div>
            <span className="location-change-tag">
              {selectedLocation ? "Change" : "Select"}
            </span>
          </button>
        </div>

        {/* Location Selector Modal */}
        {open && (
          <div className="location-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="loc-dialog-title">
            <div className="location-modal-card">
              <div className="location-modal-header">
                <h3 id="loc-dialog-title">Choose Delivery Location</h3>
                <button
                  type="button"
                  className="location-close-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Close location selector"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Explicit GPS Location Action */}
              <button
                type="button"
                className="location-gps-btn"
                onClick={useCurrentLocation}
                disabled={busy}
              >
                <Navigation size={16} />
                <span>{busy ? "Detecting GPS location..." : "Use current device location"}</span>
              </button>

              <div className="location-gps-explanation">
                <ShieldCheck size={14} />
                <span>GPS is checked only once to calculate distance from BH Road, Barpeta. Never tracked in background.</span>
              </div>

              {/* Manual Search Input */}
              <div className="location-search-box">
                <Search size={16} className="search-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Barpeta locality or landmark..."
                  aria-label="Search Barpeta locality"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="clear-query-btn" aria-label="Clear search">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Feedback Alert */}
              {message && (
                <div className="location-message-alert" role="alert" aria-live="polite">
                  {message}
                </div>
              )}

              {/* Suggestions List */}
              <div className="location-suggestions-list" role="listbox">
                {isSearching ? (
                  <div className="location-searching-state">Searching verified Barpeta zones...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      className="location-suggestion-item"
                      onClick={() => choose(loc)}
                      role="option"
                      aria-selected={selectedLocation?.id === loc.id}
                    >
                      <MapPin size={15} className="item-pin" />
                      <div className="item-details">
                        <strong>{loc.label}</strong>
                        {loc.address && <small>{loc.address}</small>}
                      </div>
                      {selectedLocation?.id === loc.id && (
                        <Check size={16} className="item-selected-check" />
                      )}
                    </button>
                  ))
                ) : query.length >= 2 ? (
                  <div className="location-empty-state">
                    No matching landmark found in Barpeta. You can enter your full street address manually at checkout.
                  </div>
                ) : (
                  <div className="location-prompt-state">
                    Popular areas: Donakuchi, Garemara Pathar, Barpeta Satra, Metuakuchi, Bilortari Hati.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Today's Authoritative Active Offer Card */}
        {activeOffer && (
          <div className="active-offer-card" role="region" aria-label="Today's Active Promotional Offer">
            <div className="offer-badge-ribbon">
              <Sparkles size={14} />
              <span>{activeOffer.eyebrow || "Today's Verified Special"}</span>
            </div>

            <div className="offer-content">
              <div className="offer-text-block">
                <h2 className="offer-headline">{activeOffer.title}</h2>
                <p className="offer-detail">{activeOffer.detail}</p>
                <div className="offer-terms-line">
                  <Tag size={13} />
                  <span>{activeOffer.terms}</span>
                </div>
              </div>

              <div className="offer-action-block">
                <button
                  type="button"
                  className="offer-cta-btn"
                  onClick={() => onNavigate("menu")}
                >
                  <span>Order with Offer</span>
                  <ArrowRight size={16} />
                </button>
                {activeOffer.endsAt && (
                  <small className="offer-ends-at">Valid until {activeOffer.endsAt}</small>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3 Core Action Gateways */}
        <div className="core-actions-grid" role="navigation" aria-label="Primary hotel and dining choices">
          <button
            type="button"
            className="action-card action-food"
            onClick={() => onNavigate("menu")}
          >
            <div className="action-card-header">
              <div className="action-icon-circle">
                <Utensils size={24} />
              </div>
              <span className="action-tag">5 KM Free Delivery</span>
            </div>
            <h3 className="action-title">Order Food</h3>
            <p className="action-desc">
              Authentic Handi Dum Biryani, local chicken, sizzlers, rolls and Chinese. Delivery or Pickup.
            </p>
            <div className="action-link">
              <span>Browse Menu</span>
              <ArrowRight size={16} />
            </div>
          </button>

          <button
            type="button"
            className="action-card action-stay"
            onClick={() => onNavigate("rooms")}
          >
            <div className="action-card-header">
              <div className="action-icon-circle">
                <BedDouble size={24} />
              </div>
              <span className="action-tag">Executive AC</span>
            </div>
            <h3 className="action-title">Book a Room</h3>
            <p className="action-desc">
              9 AC & Non-AC guest rooms (101 to 304) with power backup, 24/7 reception, and in-room dining.
            </p>
            <div className="action-link">
              <span>View Rooms & Tariff</span>
              <ArrowRight size={16} />
            </div>
          </button>

          <button
            type="button"
            className="action-card action-event"
            onClick={() => onNavigate("events")}
          >
            <div className="action-card-header">
              <div className="action-icon-circle">
                <Calendar size={24} />
              </div>
              <span className="action-tag">Open Lawn</span>
            </div>
            <h3 className="action-title">Celebrate Events</h3>
            <p className="action-desc">
              Open-air stage and banquet lawn for weddings, receptions, birthdays, and cultural gatherings.
            </p>
            <div className="action-link">
              <span>Enquire Dates</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
}

