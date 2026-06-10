import React from "react";

export const About = () => (
  <div>
    <header className="znw-page-header">
      <div className="znw-wrap znw-narrow" style={{ textAlign: "center" }}>
        <div className="znw-eyebrow">✨ About Zintle</div>
        <h1 className="znw-h1">A trusted voice <span className="grad-text">for every Indian</span></h1>
        <p className="znw-lede">Zintle is India's conversational guidance &amp; companionship platform — built for the next half-billion Indians coming online. We connect you, in your own language, with <strong>verified human experts</strong> and <strong>always-available AI personas</strong> for the questions that matter most in everyday life.</p>
        <p style={{ fontSize: 15, fontStyle: "italic", marginTop: 14 }} className="grad-text">Apni baat. Apni bhasha. Apna expert.</p>
        <nav className="znw-toc">
          {[["#mission","Our mission"],["#why","Why Zintle"],["#topics","What you can talk about"],["#experience","The experience"],["#access","Coins & PRO"],["#community","Our community"],["#trust","Trust & safety"]].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </nav>
      </div>
    </header>

    <main style={{ padding: "38px 0 30px" }}>
      <div className="znw-wrap znw-narrow">

        <section className="znw-sec" id="mission">
          <h2><span className="em">🎯</span> The heart of our mission</h2>
          <p className="intro">We founded Zintle to close a simple gap: most Indians have no warm, trusted place to turn to for the questions they can't ask anyone else — about love and marriage, career and money, family and faith, loneliness and stress.</p>
          <p>Traditional resources — articles, static videos, generic chatbots — hand back fixed answers that don't speak your language or understand your situation. We've built something different: conversations that listen, remember and respond. Whether you want to make sense of your kundli, talk through a relationship, get advice on a career decision, or simply have someone to talk to late at night, every exchange is personal, private and on your terms.</p>
          <div className="znw-callout">
            <p><span className="t">Our vision</span>To give every Indian a trusted voice to turn to — for the questions they can't ask anyone else. We do it by blending the trust of verified human experts with the warmth and round-the-clock availability of AI, all in your own language and at a price you can afford.</p>
          </div>
        </section>

        <section className="znw-sec" id="why">
          <h2><span className="em">💡</span> What makes Zintle different</h2>
          <p className="intro">Zintle goes beyond both single-topic apps and generic chatbots. We bring faith, feelings, relationships, career and companionship together in one trusted app — built Bharat-first, not metro-first.</p>
          <div className="znw-dgrid">
            {[
              ["🤝","Human + AI together","Verified human experts provide trust and high-value depth; specialised AI personas answer instantly, 24×7."],
              ["🗣️","Vernacular by default","Hinglish and regional languages aren't an afterthought — they're the starting point. Every persona is designed for a Tier-2/3 user first."],
              ["🧠","It remembers your story","Your conversations build over time. Zintle keeps your context and history — so every return is more useful than the last."],
              ["💸","Priced for everyone","No ₹999 upfront commitment. Built for ₹10–₹100 decisions that mirror the UPI habits Indians already use."],
            ].map(([ic, h, p]) => (
              <div key={String(h)} className="znw-dcard">
                <div className="dt"><div className="di">{ic}</div><h4>{h}</h4></div>
                <div className="row">{p}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="znw-sec" id="topics">
          <h2><span className="em">🌐</span> What you can talk about</h2>
          <p className="intro">One trusted identity, one wallet, one memory of you — across more of life's recurring needs than any single-topic app.</p>
          <ul className="znw-clean">
            <li><span className="mk">◆</span> <strong>Faith &amp; the stars.</strong> Astrology, tarot, numerology, kundli, vastu and palmistry — guidance rooted in the traditions Indians trust.</li>
            <li><span className="mk">◆</span> <strong>Love, marriage &amp; relationships.</strong> Talk through the moments that weigh on you, with empathy and without judgement.</li>
            <li><span className="mk">◆</span> <strong>Career &amp; money.</strong> Think out loud about decisions, direction and the choices that shape your future.</li>
            <li><span className="mk">◆</span> <strong>Companionship &amp; wellbeing.</strong> Someone to check in with, share your day with, or lean on when life feels heavy — anytime.</li>
          </ul>
        </section>

        <section className="znw-sec" id="experience">
          <h2><span className="em">💬</span> The Zintle experience</h2>
          <p>Picture starting your morning with your horoscope and a quick check-in, talking through a marriage question with a verified counsellor in the evening, and asking your AI companion for encouragement before a big exam — all in your own language, all in one app.</p>
          <p>Conversations happen through text, voice messages and calls. Some guides are AI; some are verified human experts. We always tell you which is which, so you know exactly who you're talking to.</p>
        </section>

        <section className="znw-sec" id="access">
          <h2><span className="em">🪙</span> How access works</h2>
          <p className="intro">Zintle is designed for the way India already pays — small, simple, when-you-need-it.</p>
          <div className="znw-dgrid">
            <div className="znw-dcard">
              <div className="dt"><div className="di">🪙</div><h4>Conversation Coins</h4></div>
              <div className="row">A simple wallet for pay-per-use moments. Top up small amounts to start per-minute sessions with experts, unlock deeper responses, or send a gift to a guide you value. Pay only for the depth you want.</div>
            </div>
            <div className="znw-dcard">
              <div className="dt"><div className="di">⭐</div><h4>Zintle PRO</h4></div>
              <div className="row">An affordable subscription for regulars — a smoother, priority experience and more value across your favourite guides and topics, without rethinking your budget.</div>
            </div>
          </div>
        </section>

        <section className="znw-sec" id="community">
          <h2><span className="em">🌏</span> Our growing community</h2>
          <p>From students and homemakers to working professionals across India's towns and cities, Zintle is becoming a place people return to — not for soundbites, but for conversations that actually help.</p>
          <div className="znw-stats3">
            <div className="znw-stat3"><div className="n grad-text">22+</div><div className="l">Languages on our roadmap, Bharat-first</div></div>
            <div className="znw-stat3"><div className="n grad-text">24×7</div><div className="l">AI companions, always available</div></div>
            <div className="znw-stat3"><div className="n grad-text">1</div><div className="l">Wallet &amp; memory across every topic</div></div>
          </div>
        </section>

        <section className="znw-sec" id="trust">
          <h2><span className="em">🛡️</span> Trust &amp; responsible companionship</h2>
          <p>In faith and emotional topics, trust matters more than anything. We earn it with verified experts, clear disclosure that AI personas are AI, and safety rails that protect the people who use us.</p>
          <div className="znw-callout warn">
            <p><span className="t">Care comes first</span>Zintle is intended for users 18 and older. We guard against unhealthy dependency, avoid manipulative spend loops, and escalate to human support and helplines when it matters. Our guidance is for support and reflection — not a substitute for professional medical, legal or financial advice.</p>
          </div>
        </section>

        <div className="znw-callout safe" style={{ marginTop: 2 }}>
          <p><span className="t">Join our dialogue</span>Zintle is more than an app — it's a promise that no Indian has to face life's hardest questions alone. Whether you're seeking guidance, comfort or connection, your deeper conversation begins now.</p>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0 6px" }}>
          <a href="https://play.google.com/store/apps/details?id=ai.zintle" target="_blank" rel="noopener noreferrer" className="pill pill-grad" style={{ height: 50, padding: "0 30px", fontSize: 15, display: "inline-flex", alignItems: "center" }}>Start your first chat</a>
        </div>

      </div>
    </main>
  </div>
);
