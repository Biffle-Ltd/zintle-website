import React from "react";
import { Link } from "react-router-dom";

export const Refund = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">💳 Refund Policy</div>
        <h1 className="znw-h1">Clear terms on <span className="grad-text">refunds</span></h1>
        <p className="znw-lede">This Refund Policy ("Policy") governs how <strong>Zintle.ai</strong> ("Company", "we", "us", "our") processes refunds for subscription fees, in-app purchases and other paid services ("Services"). By purchasing any Service, you ("User", "you") agree to comply with this Policy.</p>
        <p className="znw-updated">Last updated: April 8, 2025</p>
        <nav className="znw-toc">
          {[["#general","General principles"],["#eligibility","Eligibility"],["#process","Request process"],["#chargebacks","Chargebacks"],["#law","Governing law"],["#contact","Contact"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="general">
          <h2><span className="em">📋</span> 1. General refund principles</h2>
          <h3>1.1 Subscription services</h3>
          <p>All subscription fees (monthly/annual) are <strong>non-refundable</strong>, except where required by applicable law. Cancellation stops future charges but does not entitle you to a refund for the current billing cycle.</p>
          <h3>1.2 One-time purchases</h3>
          <p>Purchases such as tips, pay-per-view content and call credits are <strong>final and non-refundable</strong> — unless the transaction was fraudulent or unauthorized, or the Service was not delivered due to a technical error on our part.</p>
          <h3>1.3 Free trials &amp; promotional offers</h3>
          <p>If you cancel before a free trial ends, no charges apply. Failure to cancel results in <strong>automatic conversion to a paid subscription</strong>, subject to this Policy.</p>
        </section>

        <section className="znw-sec" id="eligibility">
          <h2><span className="em">✅</span> 2. Eligibility for refund requests</h2>
          <p className="intro">Refunds are considered only in specific situations. The cards below show what qualifies and what does not.</p>
          <div className="znw-dgrid">
            <div className="znw-dcard">
              <div className="dt"><div className="di">✅</div><h4>Refunds may be considered</h4></div>
              <ul className="clean">
                <li className="yes"><span className="mk">✓</span> <strong>Duplicate charges.</strong></li>
                <li className="yes"><span className="mk">✓</span> <strong>Service failure</strong> — a verified error on our part.</li>
                <li className="yes"><span className="mk">✓</span> <strong>Unauthorized transactions.</strong></li>
              </ul>
            </div>
            <div className="znw-dcard">
              <div className="dt"><div className="di">⛔</div><h4>Non-refundable circumstances</h4></div>
              <ul className="clean">
                <li className="no"><span className="mk">✕</span> Change of mind.</li>
                <li className="no"><span className="mk">✕</span> Dissatisfaction with content quality.</li>
                <li className="no"><span className="mk">✕</span> Partial usage of a Service.</li>
                <li className="no"><span className="mk">✕</span> Terms violations leading to a ban.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="znw-sec" id="process">
          <h2><span className="em">🧾</span> 3. Refund request process</h2>
          <h3>3.1 How to request</h3>
          <p>Submit a refund request <strong>within 1 day of the charge</strong> via <a href="mailto:support@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700 }}>support@zintle.ai</a>, including:</p>
          <div className="znw-steps">
            <div className="znw-step"><div className="znw-step-num">1</div><div className="znw-step-txt"><b>Transaction ID</b> — the reference for the charge you're disputing.</div></div>
            <div className="znw-step"><div className="znw-step-num">2</div><div className="znw-step-txt"><b>Reason</b> — why you believe a refund applies under this Policy.</div></div>
            <div className="znw-step"><div className="znw-step-num">3</div><div className="znw-step-txt"><b>Supporting evidence</b> — screenshots, receipts or any relevant documentation.</div></div>
          </div>
          <h3>3.2 Processing time</h3>
          <div className="znw-callout safe">
            <p><span className="t">Within 14 business days</span>Approved refunds are processed within <strong>14 business days</strong> to your original payment method.</p>
          </div>
        </section>

        <section className="znw-sec" id="chargebacks">
          <h2><span className="em">⚖️</span> 4. Chargebacks &amp; disputes</h2>
          <h3>4.1 Chargeback policy</h3>
          <p>Disputing charges with your bank <strong>without contacting us first</strong> may result in immediate account suspension and a future ban.</p>
          <h3>4.2 Resolution</h3>
          <p>We will investigate any dispute and may provide evidence of delivery.</p>
          <div className="znw-callout stop">
            <p><span className="t">Talk to us first</span>Please reach out to <a href="mailto:support@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700 }}>support@zintle.ai</a> before raising a chargeback — most issues are resolved faster directly with our team.</p>
          </div>
        </section>

        <section className="znw-sec" id="law">
          <h2><span className="em">🏛️</span> 5. Governing law &amp; disputes</h2>
          <p>This Policy is governed by the laws of <strong>India</strong>, with the courts of <strong>Delhi</strong> having exclusive jurisdiction. Disputes are resolved through negotiation or binding arbitration.</p>
        </section>

        <section className="znw-sec" id="contact">
          <h2><span className="em">✉️</span> Contact</h2>
          <p>You may contact the Grievance Officer at:</p>
          <div className="znw-ccard">
            <h4>Grievance Officer</h4>
            <a href="mailto:support@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700, fontSize: 15, display: "block", marginTop: 6 }}>support@zintle.ai</a>
            <address style={{ fontStyle: "normal", marginTop: 10, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
              Zintle (Sofnics Tech Labs Pvt. Ltd.)<br />
              3rd Floor, B-12, Kh No. 82/9, Mahavir Enclave<br />
              New Delhi, South West Delhi<br />
              Delhi – 110045, India
            </address>
          </div>
        </section>

        <div className="znw-callout safe" style={{ marginTop: 2 }}>
          <p><span className="t">Please read alongside</span>This Refund Policy should be read together with our <Link to="/terms" style={{ color: "var(--teal)" }}>Terms of Use</Link> and <Link to="/privacy" style={{ color: "var(--teal)" }}>Privacy Policy</Link>. Where this Policy and applicable law differ, the law prevails.</p>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link to="/" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Back to home</Link>
        </div>

      </div>
    </main>
  </div>
);
