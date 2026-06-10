import React from "react";
import { Link } from "react-router-dom";

export const Terms = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">📄 Terms of Use</div>
        <h1 className="znw-h1">Our agreement <span className="grad-text">with you</span></h1>
        <p className="znw-lede">These Terms of Use ("Terms") govern your access to and use of the Zintle application and website operated by <strong>Sofnics Tech Labs Pvt. Ltd.</strong> ("Zintle", "we", "us"). By using Zintle, you accept these Terms.</p>
        <p className="znw-updated">Last updated: May 2026 · Governed by the laws of India</p>
        <nav className="znw-toc">
          {[["#eligibility","Eligibility"],["#account","Your account"],["#use","Acceptable use"],["#content","Content & IP"],["#ai","AI & guidance"],["#payments","Payments"],["#termination","Termination"],["#liability","Liability"],["#law","Governing law"],["#contact","Contact"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="eligibility">
          <h2><span className="em">🪪</span> 1. Eligibility</h2>
          <ul className="clean dot">
            <li><span className="mk">◆</span> You must be <strong>18 years or older</strong> and capable of forming a binding contract under Indian law to use Zintle.</li>
            <li><span className="mk">◆</span> By using the Platform, you confirm that the information you provide is accurate and that you are not barred from using it under any applicable law.</li>
            <li><span className="mk">◆</span> If you use Zintle on behalf of an organisation, you confirm you are authorised to bind it to these Terms.</li>
          </ul>
        </section>

        <section className="znw-sec" id="account">
          <h2><span className="em">🔑</span> 2. Your account</h2>
          <ul className="clean dot">
            <li><span className="mk">◆</span> You register using your <strong>mobile number and OTP</strong>. You are responsible for activity under your account and for keeping your credentials confidential.</li>
            <li><span className="mk">◆</span> Notify us immediately of any unauthorised use. We are not liable for losses arising from your failure to safeguard your account.</li>
            <li><span className="mk">◆</span> One person, one account. You may not sell, transfer or share your account, or create accounts to evade restrictions.</li>
          </ul>
        </section>

        <section className="znw-sec" id="use">
          <h2><span className="em">✅</span> 3. Acceptable use</h2>
          <p className="intro">You agree to use Zintle lawfully and respectfully. In short — be decent, be honest, and don't break the Platform.</p>
          <ul className="clean no">
            <li><span className="mk">✕</span> Don't post or transmit content that is unlawful, obscene, hateful, defamatory, harassing, or that violates our Community &amp; Content Guidelines.</li>
            <li><span className="mk">✕</span> Don't impersonate others, infringe intellectual-property rights, or share someone's private data without consent.</li>
            <li><span className="mk">✕</span> Don't hack, scrape, reverse-engineer, overload, or attempt to bypass our safety systems or rate limits.</li>
            <li><span className="mk">✕</span> Don't use bots, spam, fake engagement, or attempt to manipulate the Platform or its economy.</li>
          </ul>
          <p>For the full list of prohibited content and behaviour, see our <Link to="/guidelines" style={{ color: "var(--pink)", fontWeight: 600 }}>Community &amp; Content Guidelines</Link>, which form part of these Terms.</p>
        </section>

        <section className="znw-sec" id="content">
          <h2><span className="em">🎨</span> 4. Content &amp; intellectual property</h2>
          <h3>Your content</h3>
          <p>You retain ownership of content you create or submit. By posting on Zintle, you grant us a <strong>worldwide, non-exclusive, royalty-free licence</strong> to host, store, reproduce, display and distribute that content for the purpose of operating, improving and promoting the Platform. You are responsible for the content you share and confirm you have the rights to share it.</p>
          <h3>Our content</h3>
          <p>The Zintle name, logo, software, design, AI personas and all related materials are owned by Sofnics Tech Labs Pvt. Ltd. or its licensors and are protected by law. You may not copy, modify or exploit them without our written permission.</p>
        </section>

        <section className="znw-sec" id="ai">
          <h2><span className="em">✨</span> 5. AI personas &amp; nature of guidance</h2>
          <ul className="clean dot">
            <li><span className="mk">◆</span> <strong>AI, not real people.</strong> Conversations on Zintle may be powered by artificial intelligence. AI personas are not real individuals, and interactions are for entertainment, reflection and companionship.</li>
            <li><span className="mk">◆</span> <strong>Not professional advice.</strong> Guidance on Zintle (including astrology, tarot, numerology, coaching and wellbeing) is for personal and entertainment purposes and is <strong>not a substitute</strong> for professional medical, psychological, legal or financial advice.</li>
            <li><span className="mk">◆</span> <strong>Your decisions are your own.</strong> You are solely responsible for actions you take based on conversations or guidance on the Platform.</li>
          </ul>
          <div className="znw-callout safe">
            <p><span className="t">If you need help</span>Zintle is not a crisis service. If you or someone else may be in danger, please contact a qualified professional or a local helpline immediately.</p>
          </div>
        </section>

        <section className="znw-sec" id="payments">
          <h2><span className="em">🪙</span> 6. Payments, coins &amp; subscriptions</h2>
          <ul className="clean dot">
            <li><span className="mk">◆</span> <strong>Coins &amp; gifts.</strong> Coins are a virtual currency used to access features. Coins and gifts have no real-world monetary value and are <strong>non-refundable and non-transferable</strong>.</li>
            <li><span className="mk">◆</span> <strong>Subscriptions (PRO).</strong> Subscriptions renew automatically until cancelled. You can cancel anytime before the next billing cycle through your account or app-store settings.</li>
            <li><span className="mk">◆</span> <strong>Official channels only.</strong> Pay only through Zintle's in-app, authorised payment options (including app stores such as Google Play). Never pay anyone offering coins or features off-platform.</li>
            <li><span className="mk">◆</span> <strong>Refunds.</strong> Completed purchases are generally non-refundable except where required by law or the relevant app-store policy. Prices and inclusions are shown before you pay.</li>
            <li><span className="mk">◆</span> <strong>Fraud.</strong> Fraudulent transactions, chargeback abuse or payment manipulation may result in loss of access and may be reported to authorities.</li>
          </ul>
          <p>Pricing is consistent with the Consumer Protection Act, 2019. Taxes apply as per law.</p>
        </section>

        <section className="znw-sec" id="termination">
          <h2><span className="em">🚫</span> 7. Suspension &amp; termination</h2>
          <p>We may warn, restrict, suspend or terminate your access if you breach these Terms or our Guidelines, or where required by law. Action is proportionate to the severity and history of the violation. Serious or repeated violations may lead to a permanent ban, and unlawful conduct may be reported to law enforcement.</p>
          <p>You may stop using Zintle and request deletion of your account at any time. Some provisions — including those on content licence, intellectual property, liability and governing law — survive termination.</p>
        </section>

        <section className="znw-sec" id="liability">
          <h2><span className="em">⚠️</span> 8. Disclaimers &amp; limitation of liability</h2>
          <p>The Platform is provided on an <strong>"as is" and "as available"</strong> basis, without warranties of any kind, to the maximum extent permitted by law. We do not guarantee that the Platform will be uninterrupted, error-free or secure, or that any guidance will be accurate or fit for a particular purpose.</p>
          <p>To the maximum extent permitted by law, Zintle and its affiliates will not be liable for any indirect, incidental, special or consequential damages, or for loss of data, goodwill or profits, arising from your use of the Platform. Nothing in these Terms excludes liability that cannot be excluded under applicable law.</p>
        </section>

        <section className="znw-sec" id="law">
          <h2><span className="em">⚖️</span> 9. Governing law &amp; disputes</h2>
          <p>These Terms are governed by the laws of <strong>India</strong>. Subject to applicable law, the courts at the location of our registered office shall have jurisdiction over any disputes. We comply with the Information Technology Act, 2000 and the IT Rules, 2021 (as amended), the Bharatiya Nyaya Sanhita, 2023, the Digital Personal Data Protection Act, 2023, and the Consumer Protection Act, 2019.</p>
          <h3>Changes to these Terms</h3>
          <p>We may update these Terms as Zintle and the law evolve. We will reflect the latest date above; continued use after an update means you accept the revised Terms.</p>
        </section>

        <section className="znw-sec" id="contact">
          <h2><span className="em">✉️</span> 10. Contact &amp; grievances</h2>
          <p>For questions about these Terms, or to raise a grievance, contact our Grievance Officer. We follow the grievance timelines set out in our <Link to="/guidelines" style={{ color: "var(--pink)", fontWeight: 600 }}>Community &amp; Content Guidelines</Link>.</p>
          <div className="znw-ccard">
            <h4>Grievance Officer</h4>
            <a href="mailto:care@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700, fontSize: 15, display: "block", marginTop: 6 }}>care@zintle.ai</a>
            <p style={{ marginTop: 8 }}>Sofnics Tech Labs Pvt. Ltd., New Delhi, India.</p>
          </div>
        </section>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link to="/" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Back to home</Link>
        </div>

      </div>
    </main>
  </div>
);
