import Link from "next/link";
import {
  site,
  footerColumns,
  footerLegal,
  copyright,
} from "@/data/site";
import { img } from "@/lib/assets";

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-contact-wrap">
          <ul className="contact-area justify-content-around m-auto">
            <li className="single-contact">
              <div className="icon"><img src={img("home1/icon/whatsapp-icon2.svg")} alt="" /></div>
              <div className="content"><span>WhatsApp</span><a href={site.whatsapp}>{site.phone}</a></div>
            </li>
            <li className="single-contact">
              <div className="icon"><img src={img("home1/icon/mail-icon2.svg")} alt="" /></div>
              <div className="content"><span>Mail Us</span><a href={`mailto:${site.email}`}>{site.email}</a></div>
            </li>
            <li className="single-contact">
              <div className="icon"><img src={img("home1/icon/call-icon.svg")} alt="" /></div>
              <div className="content"><span>Call Us</span><a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></div>
            </li>
          </ul>
        </div>

        <svg className="divider" width="1320" height="6" viewBox="0 0 1320 6" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 2.5L0 0.113249V5.88675L5 3.5V2.5ZM1315 3.5L1320 5.88675V0.113249L1315 2.5V3.5ZM4.5 3.5H1315.5V2.5H4.5V3.5Z" />
        </svg>

        <div className="footer-menu-wrap">
          <div className="row gy-md-4 gy-5">
            <div className="col-lg-3 col-md-4 col-sm-6">
              <div className="footer-logo-and-addition-info">
                <Link href="/" className="footer-logo">
                  <img src={site.logo} alt={site.name} />
                </Link>
                <div className="address-area">
                  <span>Alpha Adventure Travel Agency</span>
                  <a href="#">{site.location}</a>
                </div>
                <ul className="social-list">
                  <li><a href={site.social.facebook}><i className="bx bxl-facebook" /></a></li>
                  <li><a href={site.social.youtube}><i className="bx bxl-youtube" /></a></li>
                  <li><a href={site.social.instagram}><i className="bx bxl-instagram-alt" /></a></li>
                </ul>
                <p style={{ marginTop: 10, fontSize: 14 }}>
                  ⭐ {site.rating} {site.ratingNote}<br />
                  {site.experience}
                </p>
              </div>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title} className="col-lg-3 col-md-4 col-sm-6 d-flex justify-content-md-end">
                <div className="footer-widget">
                  <div className="widget-title"><h5>{col.title}</h5></div>
                  <ul className="widget-list">
                    {col.links.map((l) => (
                      <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="copyright-and-payment-method-area">
            <p>
              {copyright} | {footerLegal.map((l, i) => (
                <span key={l.href}>{i > 0 && " | "}<Link href={l.href}>{l.label}</Link></span>
              ))}
            </p>
            <div className="payment-method-area">
              <span>Accepted Payment Methods :</span>
              <ul>
                {site.paymentMethods.map((p) => (
                  <li key={p}><img src={p} alt="" /></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
