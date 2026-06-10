import React from "react";
import { Link } from "react-router-dom";

export const Privacy = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">🔐 Privacy Policy</div>
        <h1 className="znw-h1">Your privacy, <span className="grad-text">respected</span></h1>
        <p className="znw-lede">Zintle is a platform designed to connect people through meaningful, personalised conversations. This policy explains what <strong>Sofnics Tech Labs Pvt. Ltd.</strong> ("Zintle", "we", "us") collects, how we use it, and the choices you have. By using Zintle, you consent to the practices described here.</p>
        <p className="znw-updated">Last updated: May 2026 · Aligned to India's Digital Personal Data Protection Act, 2023</p>
        <nav className="znw-toc">
          {[["#collect","What we collect"],["#share","How we share"],["#coins","Coins & refunds"],["#security","Security & storage"],["#children","Children"],["#rights","Your rights"],["#contact","Contact"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="collect">
          <h2><span className="em">📋</span> Information we collect &amp; how we use it</h2>
          <p className="intro">We collect only what we need to run Zintle, keep it safe, and personalise your experience. Each card below shows <strong>what</strong> we collect and <strong>why</strong>.</p>
          <div className="znw-dgrid">
            {[
              ["🔑","1. Log-in data","User ID, mobile number, password, gender, voice recording, IP address, indicative age range.","Create & secure your account, sign-in, support, improvements, and demographic analysis. Age range verifies eligibility."],
              ["🪪","2. Profile information","Username, birth year, biography.","Build your profile and personalise interactions."],
              ["💬","3. Content you share","Posts, images, videos, voice recordings, location data, and content others share about you.","Enable sharing and improve functionality."],
              ["🤝","4. From third parties","Information from business partners, analytics providers and advertisers.","Enhance and measure our services."],
              ["📈","5. Log data","Device & IP technical info, usage details, communication metadata.","Monitor usage, security and fraud prevention."],
              ["🍪","6. Cookies","Cookies and similar technologies that distinguish users and analyse behaviour.","A seamless, personalised experience."],
              ["📝","7. Surveys","Personal information you provide in surveys.","Gather feedback to improve Zintle."],
              ["🔍","8. Search data","Your search queries.","Quick access, recommendations and relevant ads."],
              ["🛡️","9. Account security","Phone number and OTP.","Identity verification and account security."],
              ["📇","10. Contacts list","Access to your contacts, only with your consent.","Power the Invite Users feature."],
              ["📍","11. Location","GPS data and IP address.","Location-based services and security."],
              ["🎧","12. Customer support","Information you provide in support requests.","Investigate and resolve your issues."],
              ["📱","13. Device data","Device attributes, operations and identifiers.","Optimise performance and reliability."],
              ["🎁","14. Contest information","Details you provide when participating.","Run contests and promotions."],
              ["💳","15. Purchase information","Payment details for premium services.","Process transactions securely."],
            ].map(([ic, h, data, use]) => (
              <div key={String(h)} className="znw-dcard">
                <div className="dt"><div className="di">{ic}</div><h4>{h}</h4></div>
                <div className="row"><span className="lbl">Data</span> {data}</div>
                <div className="row"><span className="lbl use">Use</span> {use}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="znw-sec" id="share">
          <h2><span className="em">🔄</span> Disclosure of your information</h2>
          <ul className="clean">
            <li><span className="mk">◆</span> <strong>Content visible to others.</strong> Anything you post publicly is accessible to other users of the Platform.</li>
            <li><span className="mk">◆</span> <strong>Group companies.</strong> We share data within our group for operations, support and improvements.</li>
            <li><span className="mk">◆</span> <strong>Third parties.</strong> Partners and advertisers may receive data to deliver and measure targeted ads. We may also share data with government or law-enforcement agencies where required for legal compliance.</li>
            <li><span className="mk">◆</span> <strong>Third-party stores.</strong> Purchases are processed by app stores (e.g., Google Play). Completed transactions are subject to their policies.</li>
          </ul>
          <div className="znw-callout">
            <p><span className="t">We don't sell who you are</span>We do not sell your identity. Sharing for advertising is limited to what's needed to deliver and measure ads, consistent with this policy and applicable law.</p>
          </div>
        </section>

        <section className="znw-sec" id="coins">
          <h2><span className="em">🪙</span> Coins purchase &amp; refund policy</h2>
          <p>Coins are a <strong>virtual currency</strong> used to access features within Zintle. Coins and gifts are <strong>non-refundable and non-transferable</strong>, and have no real-world monetary value. Completed transactions are not eligible for refunds except where required by law or the relevant app-store policy.</p>
        </section>

        <section className="znw-sec" id="security">
          <h2><span className="em">🔒</span> Security &amp; storage</h2>
          <p>We implement reasonable technical and organisational measures to protect your information. You are responsible for keeping your login credentials confidential. Data is stored with leading cloud providers, including <strong>Amazon Web Services (AWS)</strong> and <strong>Google Cloud Platform (GCP)</strong>.</p>
          <div className="znw-callout warn">
            <p><span className="t">No method is 100% secure</span>While we work hard to protect your data, no system can be guaranteed fully secure. If we become aware of a personal-data breach, we will notify the Data Protection Board of India and affected users as required under the DPDP framework.</p>
          </div>
        </section>

        <section className="znw-sec" id="children">
          <h2><span className="em">🧒</span> Children's privacy</h2>
          <p>Zintle is intended for users <strong>18 and older</strong>. We do not knowingly collect personal data from minors. Where processing a child's data is necessary, we require <strong>verifiable parental or guardian consent</strong> and do not undertake targeted advertising or behavioural tracking of children, in line with the DPDP Act, 2023 and DPDP Rules, 2025.</p>
        </section>

        <section className="znw-sec" id="rights">
          <h2><span className="em">✅</span> Your rights &amp; choices</h2>
          <p className="intro">You stay in control of your personal data. You can exercise these rights in-app or by contacting our Grievance Officer.</p>
          <div className="znw-rights">
            <div className="znw-rcard"><h4><span className="znw-ic">◆</span> Access</h4><p>Ask what personal data we hold about you.</p></div>
            <div className="znw-rcard"><h4><span className="znw-ic">◆</span> Correct &amp; update</h4><p>Fix or update inaccurate information.</p></div>
            <div className="znw-rcard"><h4><span className="znw-ic">◆</span> Delete</h4><p>Request deletion of your personal data.</p></div>
            <div className="znw-rcard"><h4><span className="znw-ic">◆</span> Withdraw consent</h4><p>Revoke consent anytime — this may limit some functionality.</p></div>
          </div>
        </section>

        <section className="znw-sec" id="contact">
          <h2><span className="em">✉️</span> Contact us</h2>
          <p>Questions, requests or grievances about your privacy? Reach our Grievance Officer:</p>
          <div className="znw-ccard">
            <h4>Grievance Officer</h4>
            <a href="mailto:care@zintle.ai" style={{ color: "var(--pink)", fontWeight: 700, fontSize: 15, display: "block", marginTop: 6 }}>care@zintle.ai</a>
            <p style={{ marginTop: 8 }}>Sofnics Tech Labs Pvt. Ltd., New Delhi, India.</p>
          </div>
        </section>

        <div className="znw-callout safe" style={{ marginTop: 2 }}>
          <p><span className="t">Updates to this policy</span>We may update this Privacy Policy from time to time as Zintle and the law evolve. Continued use after an update means you accept the revised policy. Please read it alongside our <Link to="/terms" style={{ color: "var(--teal)" }}>Terms of Use</Link> and <Link to="/guidelines" style={{ color: "var(--teal)" }}>Community &amp; Content Guidelines</Link>.</p>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link to="/" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Back to home</Link>
        </div>

      </div>
    </main>
  </div>
);
