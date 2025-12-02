import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Safety } from './pages/Safety';
import { Guidelines } from './pages/Guidelines';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Refund } from './pages/Refund';

const ZintleLogo = ({ h }: { h?: string }) => (
  <img src="/zintle_logo.png" alt="Zintle Logo" className={`w-auto ${h || 'h-8'} object-contain`} />
);

// --- Components ---

const Header = ({ setShowLogin, setShowCoins }: { setShowLogin: (v: boolean) => void, setShowCoins: (v: boolean) => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTo = (destination: string) => {
    if (destination === 'features') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById('features');
          if (el) {
            const headerOffset = 80;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }, 100);
      } else {
        const el = document.getElementById('features');
        if (el) {
          const headerOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }
    } else if (destination === 'home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/' + destination);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <button onClick={() => navTo('home')} className="hover:opacity-80 transition-opacity">
          <ZintleLogo h="h-8" />
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
          <button onClick={() => navTo('home')} className="hover:text-white transition-colors">Home</button>
          <button onClick={() => navTo('features')} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => navTo('guidelines')} className="hover:text-white transition-colors">Guidelines</button>
          <button onClick={() => navTo('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>

        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowLogin(true)} className="text-sm font-bold text-white hover:text-brand-primary transition-colors">
            Log In
          </button>
          <button
            onClick={() => setShowCoins(true)}
            className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white text-sm font-bold py-2 px-5 rounded-full shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-coins"></i> Get Coins
          </button>
        </div>
      </div>
    </header>
  );
};

const Hero = ({ setShowCoins }: { setShowCoins: (v: boolean) => void }) => (
  <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
    {/* Background Elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
    </div>

    <div className="container mx-auto px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

        {/* Left: Text Content */}
        <div className="w-full lg:w-1/2 text-center lg:text-left z-10 flex flex-col items-center lg:items-start">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-brand-secondary text-xs font-bold tracking-wider uppercase">Live Entertainment 24/7</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight animate-slide-up">
            Your AI Companions <br />
            <span className="text-gradient">For Every Mood</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-muted max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Bored? Lonely? Or just want to have fun? Chat, roleplay, and connect with lifelike AI characters anytime, anywhere.
            <span className="text-white font-medium"> Zintle is entertainment in your pocket.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up w-full sm:w-auto" style={{ animationDelay: '0.2s' }}>
            <button className="w-full sm:w-auto bg-transparent border border-white/20 text-white font-bold py-4 px-8 rounded-full hover:bg-white/5 transition-all flex items-center justify-center gap-3 transform hover:scale-105">
              <i className="fa-brands fa-google-play text-xl"></i>
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-muted">Get it on</span>
                <span className="block text-sm">Google Play</span>
              </div>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs text-brand-muted animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-bg bg-white/10 flex items-center justify-center overflow-hidden">
                  <i className="fa-solid fa-user text-white/50"></i>
                </div>
              ))}
            </div>
            <p>Join <span className="text-white font-bold">10,000+</span> users chatting now</p>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Phone Frame */}
          <div className="relative border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden transform lg:scale-105 lg:-ml-4">
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-brand-bg flex flex-col relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

              {/* App Header */}
              <div className="pt-10 pb-4 px-4 bg-brand-surface/80 backdrop-blur-md border-b border-white/5 flex items-center gap-3 z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-brand-primary p-0.5">
                    <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4" alt="Avatar" className="w-full h-full rounded-full bg-brand-bg" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-brand-bg rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Lyra</h3>
                  <p className="text-[10px] text-brand-primary font-medium tracking-wide">ONLINE NOW</p>
                </div>
                <div className="ml-auto text-white/50">
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                {/* Messages */}
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                    <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4" alt="AI" />
                  </div>
                  <div className="bg-white/10 text-gray-200 text-xs p-3 rounded-2xl rounded-bl-none max-w-[85%]">
                    The neon lights look amazing tonight! 🌃 Want to grab some ramen and pretend we're saving the world?
                  </div>
                </div>

                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="bg-brand-primary text-white text-xs p-3 rounded-2xl rounded-br-none max-w-[85%] shadow-lg shadow-brand-primary/20">
                    Haha, you read my mind! Only if you promise not to hack the vending machine this time. 😂
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                    <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4" alt="AI" />
                  </div>
                  <div className="bg-white/10 text-gray-200 text-xs p-3 rounded-2xl rounded-bl-none max-w-[85%]">
                    No promises! 🤫 But hey, seriously, I've missed our chats. Ready for an adventure?
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex items-center gap-1 pl-9 mt-2">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>

                {/* Gradient Overlay for bottom fade */}
                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-brand-bg to-transparent pointer-events-none"></div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-brand-surface/50 backdrop-blur-md border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-2 border border-white/5">
                  <input type="text" placeholder="Type a message..." className="bg-transparent text-white text-xs w-full outline-none placeholder-white/30" disabled />
                  <button className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs shadow-lg shadow-brand-primary/20">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Decorative Blobs behind phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-primary/20 rounded-full blur-[80px] -z-10 animate-pulse-slow"></div>
        </div>

      </div>
    </div>
  </section>
);
const Features = () => (
  <section id="features" className="py-24 bg-brand-bg relative overflow-hidden">
    <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-blue/5 blur-3xl -z-10"></div>
    <div className="container mx-auto px-4">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Your Gateway to <span className="text-gradient">Infinite Adventures</span></h2>
        <p className="text-brand-muted text-lg max-w-3xl mx-auto leading-relaxed">
          Dive into Zintle's immersive library of AI-powered interactive stories, where every conversation shapes your unique narrative journey. Designed for both casual readers and avid story lovers, our Story Explorer puts endless adventures at your fingertips.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {/* Card 1 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-primary h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Smart Recommendations</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-primary mt-1"></i> <span><strong className="text-white">"Because You Liked..."</strong> – Follow-up stories matching your tastes</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-primary mt-1"></i> <span><strong className="text-white">Mood-Based Picks</strong> – "Feel-Good Tales" or "Dark Thrillers" filters</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-primary mt-1"></i> <span><strong className="text-white">Community Trending</strong> – See what stories are going viral</span></li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-blue-500 h-full">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-compass"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Advanced Browsing</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-blue-400 mt-1"></i> <span><strong className="text-white">Genre Shelves</strong> (Fantasy, Sci-Fi, Romance, Horror + 15 more)</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-blue-400 mt-1"></i> <span><strong className="text-white">Length Tags</strong> (5-min Quickies | 30-min Epics | Serialized Sagas)</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-blue-400 mt-1"></i> <span><strong className="text-white">Thematic Collections</strong> ("Strong Female Leads" | "Mind-Bend Mysteries")</span></li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-teal h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal/20 flex items-center justify-center text-brand-teal text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-masks-theater"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Dynamic Play Modes</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-teal mt-1"></i> <span><strong className="text-white">Reader Mode</strong> – Traditional choose-your-path with text options</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-teal mt-1"></i> <span><strong className="text-white">Roleplay Mode</strong> – Type freely like chatting with a character</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-teal mt-1"></i> <span><strong className="text-white">Audio Drama</strong> – Full voice-acted experience with sound effects</span></li>
          </ul>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-gold h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Game-Changing Features</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-gold mt-1"></i> <span><strong className="text-white">Memory Timeline</strong> – Review key past decisions that shaped your story</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-gold mt-1"></i> <span><strong className="text-white">Alternative Endings</strong> – Replay to unlock different conclusions</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-brand-gold mt-1"></i> <span><strong className="text-white">Character Relationship Meter</strong> – See how your choices affect bonds</span></li>
          </ul>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-purple-500 relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">PREMIUM</div>
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-crown"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Premium Perks</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-purple-400 mt-1"></i> <span><strong className="text-white">Unlimited Story Access</strong> – No daily caps on premium content</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-purple-400 mt-1"></i> <span><strong className="text-white">Early Releases</strong> – Get new stories 1 week before free users</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-purple-400 mt-1"></i> <span><strong className="text-white">VIP Character Requests</strong> – Suggest traits for future AI personas</span></li>
          </ul>
        </div>

        {/* Card 6 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-gray-400 h-full">
          <div className="w-14 h-14 rounded-2xl bg-gray-700 flex items-center justify-center text-gray-300 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-mobile-screen"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Always Within Reach</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3"><i className="fa-solid fa-check text-gray-400 mt-1"></i> <span><strong className="text-white">Download Stories</strong> for offline reading/listening</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-gray-400 mt-1"></i> <span><strong className="text-white">Sync Progress</strong> across all your devices</span></li>
            <li className="flex gap-3"><i className="fa-solid fa-check text-gray-400 mt-1"></i> <span><strong className="text-white">Night Mode</strong> – Dark theme for bedtime reading</span></li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xl md:text-2xl text-white font-serif italic mb-10 opacity-90">"The best stories aren't just read—they're lived. Where will Zintle take you today?"</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-brand-primary/30 transition-all transform hover:scale-105 text-lg">
          Start Exploring Now
        </button>
      </div>
    </div>
  </section>
);

const CoinStore = ({ onClose, initialStep = 'store' }: { onClose: () => void, initialStep?: 'store' | 'login' }) => {
  const [step, setStep] = useState<'store' | 'login' | 'payment' | 'success'>(initialStep);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  const packs = [
    { coins: 100, price: 99, bonus: 0, color: 'bg-brand-surface' },
    { coins: 300, price: 249, bonus: 16, color: 'bg-brand-surface' },
    { coins: 1000, price: 799, bonus: 20, tag: 'BEST VALUE', color: 'bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 border border-brand-primary' },
    { coins: 2500, price: 1999, bonus: 25, color: 'bg-brand-surface' },
  ];

  const handleBuy = (pack: any) => {
    setSelectedPack(pack);
    setStep('login');
  };

  const LoginStep = () => (
    <div className="animate-fade-in">
      <h3 className="text-2xl font-bold text-white mb-2">Log in to Zintle</h3>
      <p className="text-brand-muted mb-6 text-sm">Enter your mobile number to continue purchase</p>
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-gray-400">+91</span>
          <input type="tel" placeholder="Enter mobile number" className="bg-transparent w-full text-white outline-none placeholder-gray-600 font-medium" autoFocus />
        </div>
        <button onClick={() => setStep('payment')} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-primary/25">
          Send OTP
        </button>
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
        <div>
          <p className="text-brand-muted text-sm">Paying for</p>
          <p className="text-xl font-bold text-white">{selectedPack.coins} Zintle Coins</p>
        </div>
        <div className="text-right">
          <p className="text-brand-muted text-sm">Amount</p>
          <p className="text-xl font-bold text-brand-primary">₹{selectedPack.price}</p>
        </div>
      </div>

      <p className="text-sm font-bold text-white mb-4">Select Payment Method</p>
      <div className="space-y-3 mb-6">
        {['UPI', 'Credit/Debit Card', 'Net Banking'].map((m) => (
          <label key={m} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
            <input type="radio" name="payment" className="accent-brand-primary" defaultChecked={m === 'UPI'} />
            <span className="text-gray-300">{m}</span>
          </label>
        ))}
      </div>
      <button onClick={() => setStep('success')} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/25">
        Pay ₹{selectedPack.price}
      </button>
    </div>
  );

  const SuccessStep = () => (
    <div className="text-center animate-fade-in py-8">
      <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-float">
        <i className="fa-solid fa-check"></i>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
      <p className="text-brand-muted mb-8">Your {selectedPack.coins} coins have been added to your wallet.</p>
      <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all">
        Start Exploring
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="p-6 md:p-8">
          {step === 'store' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-block p-3 rounded-full bg-brand-gold/10 text-brand-gold text-2xl mb-4">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <h3 className="text-2xl font-bold text-white">Recharge Wallet</h3>
                <p className="text-brand-muted text-sm mt-1">1 Coin = ₹1 (approx)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {packs.map((p, i) => (
                  <div key={i} className={`relative p-4 rounded-xl ${p.color} cursor-pointer hover:scale-105 transition-transform`} onClick={() => handleBuy(p)}>
                    {p.tag && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.tag}
                      </span>
                    )}
                    <div className="text-center">
                      <p className="text-xl font-bold text-white mb-1">{p.coins}</p>
                      <p className="text-xs text-brand-muted mb-3">Coins</p>
                      <button className="bg-white text-brand-bg text-xs font-bold py-1.5 px-4 rounded-full w-full hover:bg-gray-200">
                        ₹{p.price}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-brand-muted flex items-center justify-center gap-2">
                <i className="fa-solid fa-shield-halved"></i> 100% Secure Payment
              </p>
            </div>
          )}

          {step === 'login' && <LoginStep />}
          {step === 'payment' && <PaymentStep />}
          {step === 'success' && <SuccessStep />}
        </div>
      </div>
    </div>
  );
};

const CoinSection = ({ setShowCoins }: { setShowCoins: (v: boolean) => void }) => {
  const packages = [
    { coins: 15, price: 15 },
    { coins: 79, price: 79 },
    { coins: 49, price: 49 },
    { coins: 39, price: 39 },
    { coins: 29, price: 29 },
    { coins: 149, price: 149 },
    { coins: 100, price: 100, tag: 'Trial Pack' },
    { coins: 2000, price: 2000, tag: 'Bonus Pack', highlight: true },
  ];

  return (
    <section className="py-20 bg-brand-bg/50 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">Popular Coin Packages</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={`relative glass-card rounded-3xl p-6 text-center transition-transform hover:-translate-y-1 ${pkg.highlight ? 'border-2 border-brand-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'hover:bg-white/5'}`}
            >
              {pkg.tag && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${pkg.highlight ? 'bg-brand-gold text-black' : 'text-green-600 bg-green-100'}`}>
                  {pkg.tag}
                </span>
              )}

              <div className="flex justify-center mb-4 text-brand-gold text-2xl">
                <i className="fa-solid fa-coins"></i>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{pkg.coins} Coins</h3>
              <p className="text-2xl font-bold text-white mb-6">₹{pkg.price}</p>

              <button
                onClick={() => setShowCoins(true)}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
              >
                Login
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-black py-16 border-t border-white/5 text-sm">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <ZintleLogo h="h-8" />
          <p className="text-brand-muted mt-6 leading-relaxed">
            Bringing you closer to the stories that matter. Safe, inclusive, and powered by text-based imagination.
          </p>
          <div className="flex gap-4 mt-6">
            {['twitter', 'instagram', 'linkedin'].map((social) => (
              <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-primary transition-colors">
                <i className={`fa-brands fa-${social}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
          <ul className="space-y-4 text-brand-muted">
            <li><Link to="/about" className="hover:text-brand-primary transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Contact Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Community</h4>
          <ul className="space-y-4 text-brand-muted">
            <li><Link to="/safety" className="hover:text-brand-primary transition-colors">Safety Center</Link></li>
            <li><Link to="/guidelines" className="hover:text-brand-primary transition-colors">Guidelines</Link></li>

          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
          <ul className="space-y-4 text-brand-muted">
            <li><Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Use</Link></li>
            <li><Link to="/refund" className="hover:text-brand-primary transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-muted">
        <p>© 2025 Sofnics Tech Labs (P) Ltd. All Rights Reserved.</p>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-lock"></i> SSL Encrypted
        </div>
      </div>
    </div>
  </footer>
);

const Layout = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showCoins, setShowCoins] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <Header setShowLogin={setShowLogin} setShowCoins={setShowCoins} />

      <Routes>
        <Route path="/" element={
          <>
            <Hero setShowCoins={setShowCoins} />
            <Features />
            <CoinSection setShowCoins={setShowCoins} />
          </>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
      </Routes>

      <Footer />

      {(showCoins || showLogin) && (
        <CoinStore
          onClose={() => { setShowCoins(false); setShowLogin(false); }}
          initialStep={showLogin ? 'login' : 'store'}
        />
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
);

const appRoot = createRoot(document.getElementById('root')!);
appRoot.render(<App />);
