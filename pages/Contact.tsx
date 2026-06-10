import React from "react";
import { Link } from "react-router-dom";

export const Contact = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">✉️ Contact Us</div>
        <h1 className="znw-h1">We'd love to <span className="grad-text">hear from you</span></h1>
        <p className="znw-lede">Whether you have questions, feedback, or partnership inquiries, our team is here to help. Reach out through any of the channels below — we usually reply within <strong>24–48 hours</strong>.</p>
        <div className="znw-qbtns">
          <a href="mailto:support@zintle.ai" className="znw-qbtn">📧 support@zintle.ai</a>
          <a href="tel:+919988998987" className="znw-qbtn">📞 +91 99889 98987</a>
          <Link to="/guidelines" className="znw-qbtn">💡 Help Center</Link>
        </div>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="touch">
          <h2><span className="em">📨</span> Get in touch</h2>
          <p className="intro">For everyday questions, account help, or feedback about your Zintle experience, our support team is the fastest way to reach us.</p>
          <div className="znw-dgrid">
            <div className="znw-dcard">
              <div className="dt"><div className="di">📧</div><h4>Email support</h4></div>
              <div className="row">
                <span className="lbl">General &amp; account help</span>
                <span className="val"><a href="mailto:support@zintle.ai">support@zintle.ai</a></span>
              </div>
            </div>
            <div className="znw-dcard">
              <div className="dt"><div className="di">📞</div><h4>Phone</h4></div>
              <div className="row">
                <span className="lbl">Mon–Sat, business hours (IST)</span>
                <span className="val"><a href="tel:+919988998987">+91 99889 98987</a></span>
              </div>
            </div>
          </div>
        </section>

        <section className="znw-sec" id="address">
          <h2><span className="em">📍</span> Operating address</h2>
          <address className="znw-addr">
            <span style={{ display: "block", fontWeight: 700, color: "#fff", marginBottom: 6 }}>Zintle.ai (Sofnics Tech Labs Pvt. Ltd.)</span>
            3rd Floor, B-12, Kh No. 82/9, Mahavir Enclave<br />
            New Delhi, South West Delhi<br />
            Delhi – 110045, India
          </address>
        </section>

        <section className="znw-sec" id="partnerships">
          <h2><span className="em">🤝</span> Business &amp; partnerships</h2>
          <p className="intro">For collaborations, creator onboarding, or payment gateway integrations, our partnerships team would be glad to connect.</p>
          <div className="znw-dcard" style={{ maxWidth: 420 }}>
            <div className="dt"><div className="di">📧</div><h4>Partnerships</h4></div>
            <div className="row">
              <span className="lbl">Collaborations &amp; integrations</span>
              <span className="val"><a href="mailto:partnerships@zintle.ai">partnerships@zintle.ai</a></span>
            </div>
          </div>
        </section>

        <section className="znw-sec" id="grievance">
          <h2><span className="em">🛡️</span> Grievance Officer</h2>
          <p>As required under the Information Technology Act and applicable rules, you can contact our Grievance Officer for content-related concerns and complaints.</p>
          <div className="znw-callout warn">
            <p>
              <span className="t">Grievance Officer</span>
              📧 <a href="mailto:grievance@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700 }}>grievance@zintle.ai</a><br />
              Sofnics Tech Labs Pvt. Ltd., New Delhi, India. We acknowledge grievances within statutory timelines.
            </p>
          </div>
        </section>

        <section className="znw-sec" id="follow">
          <h2><span className="em">🌐</span> Follow us</h2>
          <p className="intro">Stay in the loop with updates, creator spotlights and new topics across our channels.</p>
          <div className="znw-socials">
            <a href="https://x.com/Zintle_ai" target="_blank" rel="noopener noreferrer" className="znw-scard">
              <span className="znw-sic"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>
              <span className="znw-sx"><span className="znw-net">X (Twitter)</span><span className="znw-handle">@Zintle_ai</span></span>
            </a>
            <a href="https://instagram.com/Zintle.ai" target="_blank" rel="noopener noreferrer" className="znw-scard">
              <span className="znw-sic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="#fff" stroke="none"/></svg></span>
              <span className="znw-sx"><span className="znw-net">Instagram</span><span className="znw-handle">@Zintle.ai</span></span>
            </a>
            <a href="https://facebook.com/Zintle.ai" target="_blank" rel="noopener noreferrer" className="znw-scard">
              <span className="znw-sic"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/></svg></span>
              <span className="znw-sx"><span className="znw-net">Facebook</span><span className="znw-handle">Zintle.ai</span></span>
            </a>
          </div>
        </section>

        <section className="znw-sec" id="faq">
          <h2><span className="em">💡</span> Visit our FAQ section</h2>
          <p>Looking for a quick answer? Our Help Center covers the most common questions about accounts, coins, PRO, experts and safety.</p>
          <div style={{ marginTop: 14 }}>
            <Link to="/guidelines" className="pill pill-grad" style={{ height: 46, padding: "0 24px", fontSize: 14, display: "inline-flex", alignItems: "center" }}>Go to Help Center</Link>
          </div>
        </section>

        <div className="znw-callout safe" style={{ marginTop: 2 }}>
          <p><span className="t">We'll get back to you</span>However you reach out, we aim to respond within <strong>24–48 hours</strong>. Thanks for being part of the Zintle community.</p>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link to="/" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Back to home</Link>
        </div>

      </div>
    </main>
  </div>
);
