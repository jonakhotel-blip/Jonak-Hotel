import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export const FAQSection = () => {
  const { faqs } = useHotel();
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{
      padding: '5rem 0',
      background: 'rgba(11, 17, 32, 0.75)',
      position: 'relative'
    }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: 'var(--gold-warm)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.8rem'
          }}>
            <HelpCircle size={14} />
            <span>EVERYTHING YOU NEED TO KNOW</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginBottom: '0.8rem',
            color: 'var(--text-primary)'
          }}>
            Frequently Asked <span className="text-gold-gradient">Questions</span>
          </h2>

          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Quick answers about our 5 KM free food delivery, room amenities, FAAMCH medical proximity, and event bookings.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div 
                key={idx}
                className="glass-card"
                style={{
                  overflow: 'hidden',
                  border: isOpen ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '1.2rem 1.4rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: isOpen ? 'var(--gold-light)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1.02rem',
                    fontWeight: 700
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp size={20} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  )}
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 1.4rem 1.25rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                    lineHeight: 1.65,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '0.9rem',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
