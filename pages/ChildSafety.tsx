import React from "react";
import { Link } from "react-router-dom";

export const ChildSafety = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap znw-narrow" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">🧒 Child Safety Standards</div>
        <h1 className="znw-h1">
          Zero tolerance for{" "}
          <span className="grad-text">harm to minors</span>
        </h1>
        <p className="znw-lede">
          Zintle is committed to providing a safe digital environment and has
          zero tolerance for any form of Child Sexual Abuse and Exploitation
          (CSAE).
        </p>
        <p className="znw-updated">Effective date: 23 January 2026</p>
        <nav className="znw-toc">
          {[
            ["#commitment", "Commitment"],
            ["#prohibited", "Prohibited content"],
            ["#ai", "AI safety"],
            ["#enforcement", "Enforcement"],
            ["#reporting", "Reporting"],
            ["#law", "Law enforcement"],
            ["#compliance", "Indian law"],
            ["#updates", "Updates"],
          ].map(([h, l]) => (
            <a key={h} href={h}>
              {l}
            </a>
          ))}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">
        <section className="znw-sec" id="commitment">
          <h2>
            <span className="em">1</span> Our commitment to child safety
          </h2>
          <p>
            We strictly prohibit the creation, distribution, promotion, or
            storage of any content that exploits or harms minors. This applies
            to user-generated content, AI-generated content, text, images,
            audio, video, or any other media created or shared through the
            Zintle platform.
          </p>
        </section>

        <section className="znw-sec" id="prohibited">
          <h2>
            <span className="em">2</span> Prohibited content
          </h2>
          <p className="intro">The following content is strictly prohibited on Zintle:</p>
          <ul className="znw-clean">
            <li>
              <span className="mk">✕</span> Sexual content involving minors,
              including explicit, implicit, or suggestive material
            </li>
            <li>
              <span className="mk">✕</span> Any depiction of a minor in sexual
              acts, poses, or contexts
            </li>
            <li>
              <span className="mk">✕</span> Grooming behavior, sexual
              conversations involving minors, or role-play involving minors
            </li>
            <li>
              <span className="mk">✕</span> Requests for, promotion of, or
              distribution of child sexual abuse material (CSAM)
            </li>
            <li>
              <span className="mk">✕</span> AI-generated content that depicts
              minors in sexualized or exploitative ways
            </li>
          </ul>
          <p>
            This prohibition applies regardless of intent, including fictional,
            animated, AI-generated, or storytelling formats.
          </p>
          <p>
            For the purposes of this policy, a minor refers to any individual
            under the age of 18.
          </p>
        </section>

        <section className="znw-sec" id="ai">
          <h2>
            <span className="em">3</span> AI content safety
          </h2>
          <p className="intro">
            Zintle uses AI to generate storytelling content. We take additional
            precautions to ensure that:
          </p>
          <ul className="znw-clean">
            <li>
              <span className="mk">◆</span> AI systems are designed to reject
              prompts involving sexual content related to minors
            </li>
            <li>
              <span className="mk">◆</span> Outputs are monitored and filtered
              to prevent CSAE
            </li>
            <li>
              <span className="mk">◆</span> Repeated or suspicious attempts to
              generate prohibited content result in account restrictions or bans
            </li>
          </ul>
        </section>

        <section className="znw-sec" id="enforcement">
          <h2>
            <span className="em">4</span> Detection, moderation &amp; enforcement
          </h2>
          <p>To prevent and address CSAE, we use a combination of:</p>
          <ul className="znw-clean">
            <li>
              <span className="mk">◆</span> Automated content filtering and
              moderation
            </li>
            <li>
              <span className="mk">◆</span> Prompt validation and abuse detection
            </li>
            <li>
              <span className="mk">◆</span> User reporting mechanisms
            </li>
            <li>
              <span className="mk">◆</span> Manual review where required
            </li>
          </ul>
          <p>Accounts found violating child safety standards may be:</p>
          <ul className="znw-clean">
            <li>
              <span className="mk">◆</span> Permanently suspended
            </li>
            <li>
              <span className="mk">◆</span> Reported to law enforcement
              authorities
            </li>
            <li>
              <span className="mk">◆</span> Blocked from accessing the platform
            </li>
          </ul>
        </section>

        <section className="znw-sec" id="reporting">
          <h2>
            <span className="em">5</span> Reporting child safety concerns
          </h2>
          <p>
            Users can report suspected child safety violations or CSAE content
            by contacting us at:
          </p>
          <div className="znw-callout warn">
            <p>
              <span className="t">Report immediately</span>
              📧{" "}
              <a
                href="mailto:support@zintle.ai"
                style={{ color: "var(--pink)", fontWeight: 700 }}
              >
                support@zintle.ai
              </a>
              <br />
              Reports are reviewed promptly, and appropriate action is taken.
            </p>
          </div>
        </section>

        <section className="znw-sec" id="law">
          <h2>
            <span className="em">6</span> Cooperation with law enforcement
          </h2>
          <p>
            Zintle cooperates fully with law enforcement authorities and
            complies with applicable laws in India, including child protection
            and cyber safety regulations.
          </p>
          <p>Where required, we will:</p>
          <ul className="znw-clean">
            <li>
              <span className="mk">◆</span> Preserve relevant data
            </li>
            <li>
              <span className="mk">◆</span> Report CSAM to appropriate
              authorities
            </li>
            <li>
              <span className="mk">◆</span> Assist investigations in accordance
              with applicable laws
            </li>
          </ul>
        </section>

        <section className="znw-sec" id="compliance">
          <h2>
            <span className="em">7</span> Compliance with Indian laws
          </h2>
          <p>
            Zintle operates in compliance with applicable Indian laws, including
            laws related to:
          </p>
          <ul className="znw-clean">
            <li>
              <span className="mk">◆</span> Child protection
            </li>
            <li>
              <span className="mk">◆</span> Online safety
            </li>
            <li>
              <span className="mk">◆</span> Prevention of sexual exploitation of
              minors
            </li>
          </ul>
        </section>

        <section className="znw-sec" id="updates">
          <h2>
            <span className="em">8</span> Updates to this policy
          </h2>
          <p>
            This Child Safety Standards policy may be updated periodically.
            Continued use of Zintle constitutes acceptance of the updated
            policy.
          </p>
        </section>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link
            to="/safety"
            className="pill pill-grad"
            style={{
              height: 50,
              padding: "0 30px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Back to Safety Center
          </Link>
        </div>
      </div>
    </main>
  </div>
);
