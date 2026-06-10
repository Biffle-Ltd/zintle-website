import React from "react";
import { Link } from "react-router-dom";

export const Guidelines = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">🌟 Community &amp; Content Guidelines</div>
        <h1 className="znw-h1">Welcome to <span className="grad-text">Zintle</span></h1>
        <p className="znw-lede">We believe in the power of storytelling and conversation to connect, inspire and entertain. These guidelines keep Zintle a <strong>safe, inclusive and creative</strong> space for everyone. By using Zintle, you agree to follow them alongside our Privacy Policy and Terms of Use.</p>
        <p className="znw-updated">Last updated: May 2026 · Applies to all users, creators and content on Zintle</p>
        <nav className="znw-toc">
          {[["#laws","Compliance with Laws"],["#safety","Safety & Moderation"],["#prohibited","Prohibited Content"],["#minors","Child Safety"],["#ai","AI & Authenticity"],["#creators","Creator Guidelines"],["#data","Privacy & Data"],["#money","Payments"],["#reporting","Reporting & Appeals"],["#grievance","Grievance Officer"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="laws">
          <h2><span className="em">📜</span> 1. Compliance with Indian Law</h2>
          <p className="intro">All activity and content on Zintle must comply with applicable Indian law. As an intermediary, Zintle observes due-diligence obligations and cooperates with lawful requests from courts and authorised government agencies.</p>
          <div className="znw-pillrow">
            {["Information Technology Act, 2000","IT (Intermediary Guidelines & Digital Media Ethics Code) Rules, 2021","Bharatiya Nyaya Sanhita, 2023","Digital Personal Data Protection Act, 2023","Consumer Protection Act, 2019","POCSO Act, 2012","Indecent Representation of Women (Prohibition) Act, 1986"].map(l => <span key={l} className="znw-lawpill">{l}</span>)}
          </div>
          <h3>Content that is strictly prohibited by law</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Anything threatening the <strong>sovereignty, integrity, defence, security or unity of India</strong>, or friendly relations with foreign states, or public order.</li>
            <li><span className="mk">✕</span> Content that <strong>incites violence, hatred or any cognizable offence</strong>, or promotes enmity between groups on grounds of religion, race, caste, sex, place of birth, language or community.</li>
            <li><span className="mk">✕</span> Material that is <strong>defamatory, obscene, paedophilic, or invasive of another's privacy</strong>, including bodily privacy.</li>
            <li><span className="mk">✕</span> Content that <strong>infringes any patent, trademark, copyright or other proprietary right.</strong></li>
            <li><span className="mk">✕</span> Information that is <strong>knowingly false or misleading</strong>, impersonates another person, or is intended to deceive or harass.</li>
            <li><span className="mk">✕</span> Anything that is otherwise <strong>unlawful in any manner whatsoever</strong>, or that violates any law in force.</li>
          </ul>
          <div className="znw-callout">
            <p><span className="t">Lawful takedowns &amp; cooperation</span>Where Zintle receives a valid court order, or a written direction from an authorised government agency, we will remove or disable access to the relevant content within the timelines required by law, and preserve information as required for investigation.</p>
          </div>
        </section>

        <section className="znw-sec" id="safety">
          <h2><span className="em">🛡️</span> 2. Platform Safety &amp; Moderation</h2>
          <p className="intro">Safety is built into Zintle. We combine technology and people to detect, review and act on content that breaks these guidelines.</p>
          <div className="znw-grid2">
            {[
              ["🤖 AI-powered filters","Automated, real-time detection of prohibited content across conversations, characters and uploads — including text, images and synthetic media."],
              ["👥 Human moderation","A trained safety team reviews reports and escalations around the clock, with sensitivity to language and cultural context across India."],
              ["🚩 User reporting","One-tap in-app reporting on every conversation, character and profile, plus an email channel for serious or off-app concerns."],
              ["🔁 Continuous improvement","Our tools, classifiers and policies evolve as new risks emerge. We learn from reports, appeals and community feedback."],
            ].map(([h, p]) => (
              <div key={String(h)} className="znw-mini"><h4>{h}</h4><p>{p}</p></div>
            ))}
          </div>
          <h3>How we enforce</h3>
          <p>Action is proportionate to the severity, intent and history of the violation. We may remove content, restrict features, or act on accounts as follows:</p>
          <div className="znw-ladder">
            {[["r1","Minor","Warning","Notice, content removal and guidance on the rule that was broken."],["r2","Repeated","Suspension","Temporary loss of access or features while the behaviour is reviewed."],["r3","Serious","Ban","Permanent account termination for critical or repeated serious offences."],["r4","Unlawful","Report","Referral to law enforcement and preservation of data where the law requires."]].map(([cls, lvl, h, p]) => (
              <div key={cls} className={`znw-rung ${cls}`}><div className="znw-lvl">{lvl}</div><h4>{h}</h4><p>{p}</p></div>
            ))}
          </div>
        </section>

        <section className="znw-sec" id="prohibited">
          <h2><span className="em">🚫</span> 3. Prohibited Content &amp; Behaviour</h2>
          <p className="intro">Zintle celebrates bold, imaginative storytelling across genres. But some content and conduct is never acceptable — in chats, characters, profiles, images or anywhere on the platform.</p>
          <h3>3.1 Violence &amp; harm</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Glorifying, promoting or instructing real-world violence, terrorism, or harm to others.</li>
            <li><span className="mk">✕</span> Content that encourages, normalises or instructs <strong>self-harm, suicide or eating disorders</strong>.</li>
            <li><span className="mk">✕</span> Dangerous challenges, hoaxes or activities likely to cause physical harm.</li>
          </ul>
          <h3>3.2 Sexual content &amp; exploitation</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Pornographic or sexually explicit material, and obscene content as defined under Indian law.</li>
            <li><span className="mk">✕</span> <strong>Any</strong> sexualisation of minors, in any form, real or fictional — a zero-tolerance, immediately-reported offence (see Section 4).</li>
            <li><span className="mk">✕</span> Non-consensual intimate imagery, sexual harassment, or content that degrades a person sexually.</li>
          </ul>
          <h3>3.3 Harassment &amp; hate</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Bullying, threats, stalking, or targeted harassment of any individual or group.</li>
            <li><span className="mk">✕</span> Hate speech or content promoting discrimination or enmity on grounds of religion, caste, race, sex, gender, disability, place of birth, language or community.</li>
            <li><span className="mk">✕</span> Doxxing — publishing private or identifying information about a person without consent.</li>
          </ul>
          <h3>3.4 Misinformation &amp; deception</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Knowingly false information that can cause public harm, fraud, or threatens public order or health.</li>
            <li><span className="mk">✕</span> Impersonation of real people, brands or institutions intended to deceive.</li>
            <li><span className="mk">✕</span> Manipulated or synthetic media presented as genuine without the required disclosure (see Section 5).</li>
          </ul>
          <h3>3.5 Platform integrity</h3>
          <ul className="clean no">
            <li><span className="mk">✕</span> Hacking, scraping, reverse-engineering, or attempting to bypass safety systems or rate limits.</li>
            <li><span className="mk">✕</span> Spam, fake engagement, bots, or coordinated inauthentic behaviour.</li>
            <li><span className="mk">✕</span> Prompts or jailbreaks designed to make a character produce prohibited content.</li>
            <li><span className="mk">✕</span> Selling, transferring or sharing accounts, or evading bans.</li>
          </ul>
        </section>

        <section className="znw-sec" id="minors">
          <h2><span className="em">🧒</span> 4. Child Safety — Zero Tolerance</h2>
          <p className="intro">Protecting children is our highest priority and is non-negotiable. Zintle has zero tolerance for any content or behaviour that sexualises, endangers or exploits a minor (a person under 18).</p>
          <ul className="clean no">
            <li><span className="mk">✕</span> Any child sexual abuse material (CSAM) or sexualised depiction of a minor — real, fictional, drawn or AI-generated — is strictly prohibited and will be removed, the account terminated, and the matter reported to the authorities as required under the <strong>POCSO Act, 2012</strong> and the IT Act.</li>
            <li><span className="mk">✕</span> Grooming, or any attempt to befriend, isolate or sexualise a minor, is prohibited and reported.</li>
            <li><span className="mk">✕</span> Content that endangers a child's safety, including dangerous challenges directed at minors.</li>
          </ul>
          <div className="znw-callout warn">
            <p><span className="t">Age requirement &amp; mature content</span>Zintle is intended for users 18 and older. Any mature themes permitted by these guidelines are strictly age-gated and kept separate from general experiences. We deploy measures to keep minors away from inappropriate characters and content, and we honour verifiable parental-consent requirements for children's data under the DPDP framework.</p>
          </div>
        </section>

        <section className="znw-sec" id="ai">
          <h2><span className="em">✨</span> 5. AI, Authenticity &amp; Synthetic Media</h2>
          <p className="intro">Zintle's characters and conversations are powered by AI. We are transparent about this and we follow India's evolving rules on synthetically-generated information (SGI).</p>
          <ul className="clean dot">
            <li><span className="mk">◆</span> <strong>Honest about AI.</strong> Zintle characters are artificial intelligence — not real people. Conversations are AI-generated and are for entertainment, reflection and companionship.</li>
            <li><span className="mk">◆</span> <strong>No deceptive deepfakes.</strong> You may not use Zintle to create synthetic media that impersonates a real person or depicts a real individual or event in a misleading way, presented as authentic.</li>
            <li><span className="mk">◆</span> <strong>Labelling of synthetic content.</strong> AI-generated or AI-modified media may be labelled or carry metadata identifying it as synthetically generated. You must not remove, suppress or alter such labels.</li>
            <li><span className="mk">◆</span> <strong>Not professional advice.</strong> Guidance on Zintle is for personal reflection and entertainment. It is not a substitute for professional medical, psychological, legal or financial advice.</li>
          </ul>
          <div className="znw-callout safe">
            <p><span className="t">If you are struggling</span>Zintle is not a crisis service. If you or someone else may be in danger, please contact a qualified professional or a local helpline immediately. Where we detect signs of crisis, we will point you toward appropriate support resources.</p>
          </div>
        </section>

        <section className="znw-sec" id="creators">
          <h2><span className="em">🎨</span> 6. Creator &amp; Character Guidelines</h2>
          <p className="intro">If you create characters, stories or worlds on Zintle, you are responsible for the content you publish. Build experiences you'd be proud to share with the whole community.</p>
          <ul className="clean yes">
            <li><span className="mk">✓</span> Create original characters, or content you have the rights to use. Respect copyright, trademarks and others' intellectual property.</li>
            <li><span className="mk">✓</span> Label mature themes accurately and keep them within the boundaries set by these guidelines.</li>
            <li><span className="mk">✓</span> Make it clear your characters are fictional AI personas, not real individuals.</li>
          </ul>
          <ul className="clean no">
            <li><span className="mk">✕</span> Don't create characters that impersonate real people without authorisation, or that exist primarily to harass, defame or deceive.</li>
            <li><span className="mk">✕</span> Don't design characters or prompts engineered to produce prohibited content or evade safety systems.</li>
            <li><span className="mk">✕</span> Don't use the platform to advertise, sell or solicit outside official channels.</li>
          </ul>
          <p>Zintle may review, restrict or remove any character or content that violates these guidelines, and may limit a creator's access for repeated or serious violations.</p>
        </section>

        <section className="znw-sec" id="data">
          <h2><span className="em">🔐</span> 7. Privacy &amp; Your Data</h2>
          <p className="intro">We handle your personal data in line with the <strong>Digital Personal Data Protection Act, 2023</strong> and the DPDP Rules, 2025. Full details are in our <Link to="/privacy" style={{ color: "var(--pink)", fontWeight: 600 }}>Privacy Policy</Link>; the essentials:</p>
          <ul className="clean dot">
            <li><span className="mk">◆</span> <strong>Consent &amp; notice.</strong> We process your data for clearly stated purposes, with your consent, and only what we need.</li>
            <li><span className="mk">◆</span> <strong>Your rights.</strong> You can access, correct, update and request deletion of your data, and withdraw consent, through in-app controls or by contacting us.</li>
            <li><span className="mk">◆</span> <strong>Children's data.</strong> We require verifiable parental/guardian consent before processing the data of anyone under 18, and we do not run targeted advertising or behavioural tracking on children.</li>
            <li><span className="mk">◆</span> <strong>Security &amp; breach response.</strong> We apply reasonable security safeguards and will notify the Data Protection Board and affected users of a personal-data breach as required.</li>
            <li><span className="mk">◆</span> <strong>Don't share what isn't yours.</strong> Never post other people's private or sensitive personal information without their consent.</li>
          </ul>
        </section>

        <section className="znw-sec" id="money">
          <h2><span className="em">💰</span> 8. Monetisation &amp; Payments</h2>
          <p className="intro">Zintle offers coins, gifts and subscriptions to unlock features. We keep payments safe, transparent and fair, consistent with the Consumer Protection Act, 2019.</p>
          <ul className="clean dot">
            <li><span className="mk">◆</span> <strong>Official channels only.</strong> Always pay through Zintle's in-app, authorised payment options. Never pay anyone claiming to sell coins, features or access off-platform.</li>
            <li><span className="mk">◆</span> <strong>Virtual items.</strong> Coins and gifts are a limited licence to access digital features; they have no real-world monetary value and cannot be exchanged for cash.</li>
            <li><span className="mk">◆</span> <strong>Refunds.</strong> Purchases of coins and subscriptions are generally non-refundable except where required by law or platform/app-store policy. Subscription renewals can be cancelled anytime before the next billing cycle.</li>
            <li><span className="mk">◆</span> <strong>Transparency.</strong> Prices, what each plan includes, and renewal terms are shown clearly before you pay.</li>
            <li><span className="mk">◆</span> <strong>Fraud.</strong> Fraudulent transactions, chargebacks abuse, or payment manipulation will result in loss of access and may be reported to authorities.</li>
          </ul>
        </section>

        <section className="znw-sec" id="reporting">
          <h2><span className="em">📢</span> 9. Reporting &amp; Appeals</h2>
          <p className="intro">If you see something that breaks these guidelines, tell us. Reports are confidential and reviewed by our safety team.</p>
          <div className="znw-contact-cards">
            <div className="znw-ccard"><h4>🚩 In-app reporting</h4><p>Use the report option on any conversation, character or profile to flag content quickly. This is the fastest route for most issues.</p></div>
            <div className="znw-ccard"><h4>✉️ Email us</h4><p>For serious concerns, write to <a href="mailto:support@zintle.ai" style={{ color: "var(--pink)" }}>support@zintle.ai</a>. For data-protection requests, see the Grievance Officer below.</p></div>
          </div>
          <h3>Appeals</h3>
          <p>If we act on your content or account and you believe it was a mistake, you can appeal by replying to the action notice or writing to <a href="mailto:support@zintle.ai" style={{ color: "var(--pink)", fontWeight: 600 }}>support@zintle.ai</a>. If you are not satisfied with our Grievance Officer's decision on a content complaint, you may appeal to the <strong>Grievance Appellate Committee</strong> constituted under the IT Rules, 2021, within 30 days.</p>
        </section>

        <section className="znw-sec" id="grievance">
          <h2><span className="em">⚖️</span> 10. Grievance Redressal &amp; Timelines</h2>
          <p className="intro">In compliance with the IT Rules, 2021 (as amended), Zintle has a Grievance Officer based in India and follows statutory timelines for handling complaints.</p>
          <div className="znw-ttable-wrap">
            <table className="znw-ttable">
              <thead><tr><th>Action</th><th>Timeline</th></tr></thead>
              <tbody>
                <tr><td>Acknowledge a complaint</td><td>Within 24 hours of receipt</td></tr>
                <tr><td>Resolve a grievance</td><td>Within 7 days (faster for urgent categories)</td></tr>
                <tr><td>Remove unlawful content on valid order / notice</td><td>Within 36 hours, as required by law</td></tr>
                <tr><td>Act on non-consensual intimate imagery / impersonation</td><td>On a priority, expedited basis</td></tr>
                <tr><td>Appeal to Grievance Appellate Committee</td><td>Within 30 days of the Grievance Officer's decision</td></tr>
              </tbody>
            </table>
          </div>
          <div className="znw-callout">
            <p><span className="t">Grievance Officer</span>Email: <a href="mailto:grievance@zintle.ai" style={{ color: "var(--pink)", fontWeight: 600 }}>grievance@zintle.ai</a> · Please include your name, the nature of the complaint, and links/details of the content. We may verify the identity of a complainant where appropriate.</p>
          </div>
        </section>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <a href="https://play.google.com/store/apps/details?id=ai.zintle" target="_blank" rel="noopener noreferrer" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Start exploring Zintle</a>
        </div>

      </div>
    </main>
  </div>
);
