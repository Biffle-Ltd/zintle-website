import React from "react";
import { Link } from "react-router-dom";

export const Safety = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap znw-narrow" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">🛡️ Safety Center</div>
        <h1 className="znw-h1">
          Built to be a <span className="grad-text">safe place to open up</span>
        </h1>
        <p className="znw-lede">
          At Zintle, your safety is our top priority. We use advanced AI and
          human moderation so conversations stay personal, private, and
          respectful.
        </p>
        <nav className="znw-toc">
          {[
            ["#filtering", "AI filtering"],
            ["#creators", "Verified experts"],
            ["#report", "Report & help"],
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
        <section className="znw-sec" id="filtering">
          <h2>
            <span className="em">🤖</span> AI content filtering
          </h2>
          <p className="intro">
            Our real-time AI scans text for harmful content, hate speech, and
            inappropriate behavior, blocking it before it reaches you.
          </p>
        </section>

        <section className="znw-sec" id="creators">
          <h2>
            <span className="em">🤝</span> Verified creators
          </h2>
          <p>
            We strictly verify creators to ensure you&apos;re interacting with
            authentic personalities and safe AI models. Human experts and AI
            personas are always labelled so you know who you&apos;re talking to.
          </p>
        </section>

        <section className="znw-sec" id="report">
          <h2>
            <span className="em">🚩</span> Report and get help
          </h2>
          <p>
            You can report any chat in one tap. Flagged content is reviewed by
            people. If you&apos;re in distress, we point you to professional
            support and trusted helplines.
          </p>
          <div className="znw-dgrid">
            <div className="znw-dcard">
              <div className="dt">
                <div className="di">📧</div>
                <h4>Support</h4>
              </div>
              <div className="row">
                <span className="lbl">Safety reports &amp; account help</span>
                <span className="val">
                  <a href="mailto:support@zintle.ai">support@zintle.ai</a>
                </span>
              </div>
            </div>
            <div className="znw-dcard">
              <div className="dt">
                <div className="di">🧒</div>
                <h4>Child safety</h4>
              </div>
              <div className="row">
                Zero tolerance for CSAE. Read the full standards and how to
                report.
              </div>
            </div>
          </div>
        </section>

        <div className="znw-callout warn">
          <p>
            <span className="t">18+ only</span>
            Zintle is intended for users 18 and older. Guidance is for support
            and reflection — not a substitute for professional medical, legal or
            financial advice.
          </p>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <Link
            to="/child-safety-standards"
            className="pill pill-grad"
            style={{
              height: 50,
              padding: "0 30px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            Child Safety Standards
          </Link>
          <Link
            to="/guidelines"
            className="pill pill-ghost"
            style={{
              height: 50,
              padding: "0 30px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Community Guidelines
          </Link>
        </div>
      </div>
    </main>
  </div>
);
