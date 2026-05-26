import { footerColumns } from '../../data/homeContent.js';
import Icon from '../common/Icon.jsx';

function Footer({ compact = false }) {
  return (
    <footer className="border-t border-brand-line bg-white">
      <div
        className={`mx-auto ${compact ? 'flex flex-col items-start justify-between gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:px-10' : 'grid gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-10'} max-w-7xl`}
      >
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-0.08em] text-brand-navy">LUXE</h2>
          <p className="mt-5 max-w-xs text-sm leading-7 text-brand-muted">
            {compact
              ? 'Curating excellence for the modern minimalist. Sustainably sourced, meticulously crafted.'
              : 'Redefining the standard of luxury digital commerce through curation, quality, and exceptional service since 2024.'}
          </p>
          {!compact ? (
            <div className="mt-6 flex gap-3">
              {['globe', 'share', 'link'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-card text-brand-navy transition hover:bg-brand-navy hover:text-white"
                >
                  <Icon name={icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {compact ? (
          <div className="flex flex-wrap gap-8 text-sm text-brand-ink">
            {['Privacy Policy', 'Terms of Service', 'Sustainability', 'Contact Us'].map((link) => (
              <a key={link} href="#" className="transition hover:text-brand-accent">
                {link}
              </a>
            ))}
          </div>
        ) : (
          footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy">{column.title}</h3>
              <ul className="mt-6 space-y-4">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-brand-muted transition hover:text-brand-navy">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {!compact ? (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy">Contact</h3>
            <ul className="mt-6 space-y-4 text-sm text-brand-muted">
              <li className="flex items-center gap-3">
                <Icon name="mail" className="h-4 w-4 text-brand-navy" />
                concierge@luxe.com
              </li>
              <li className="flex items-center gap-3">
                <Icon name="phone" className="h-4 w-4 text-brand-navy" />
                +1 (888) 123-LUXE
              </li>
              <li className="flex items-center gap-3">
                <Icon name="location" className="h-4 w-4 text-brand-navy" />
                500 Luxury Ave, New York
              </li>
            </ul>
          </div>
        ) : (
          <p className="text-sm text-brand-ink">© 2024 LUXE Moderne. All rights reserved.</p>
        )}
      </div>

      {!compact ? (
        <div className="border-t border-brand-line">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center sm:px-6 md:flex-row lg:px-10">
            <p className="text-[11px] text-brand-muted">© 2024 LUXE Premium E-Commerce. All rights reserved.</p>
            <div className="flex items-center gap-3 text-brand-muted">
              <Icon name="card" className="h-4 w-4" />
              <Icon name="wallet" className="h-4 w-4" />
              <Icon name="tap" className="h-4 w-4" />
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}

export default Footer;
