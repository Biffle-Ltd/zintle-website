import React from 'react';

export const Guidelines = () => (
    <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">Community & Content Guidelines</h1>
        <div className="prose prose-invert max-w-none text-brand-muted space-y-6">
            <p className="text-lg font-medium text-white">🌟 Welcome to Zintle!</p>
            <p>At Zintle, we believe in the power of storytelling to connect, inspire, and entertain. To ensure a safe, inclusive, and creative environment, we’ve established these Community Guidelines. By using Zintle, you agree to follow these rules alongside our Privacy Policy and Terms of Use.</p>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">📜 Compliance with Laws</h3>
                <p className="mb-2">All content on Zintle must comply with applicable laws, including IT Act 2000, BNS 2023, Consumer Protection Act 2019.</p>
                <p className="font-bold text-red-400">Prohibited content includes:</p>
                <ul className="list-none space-y-1">
                    <li>❌ Threats to national security, public order, or sovereignty</li>
                    <li>❌ Incitement of violence, hatred, or illegal activities</li>
                    <li>❌ Defamatory or harmful content targeting individuals/groups</li>
                </ul>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">🛡️ Platform Safety & Moderation</h3>
                <p>We prioritize user safety through:</p>
                <ul className="list-none space-y-1 mb-2">
                    <li>✅ AI-Powered Filters – Real-time detection</li>
                    <li>✅ 24/7 Human Moderation – Reviewing reports</li>
                    <li>✅ User Reporting – In-app tools</li>
                </ul>
                <p className="text-sm">Enforcement: Critical Offenses → Ban | Repeated → Suspension | Minor → Warning</p>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">🚫 Prohibited Content & Behavior</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                        <strong className="text-white block mb-1">1. Violence & Harm</strong>
                        <ul className="list-none text-sm">
                            <li>❌ Glorifying violence/self-harm</li>
                            <li>❌ Dangerous challenges</li>
                        </ul>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <strong className="text-white block mb-1">2. Sexual Content</strong>
                        <ul className="list-none text-sm">
                            <li>❌ Pornography, explicit material</li>
                            <li>❌ Exploitation of minors</li>
                        </ul>
                    </div>
                </div>
                <div className="mt-4 bg-white/5 p-4 rounded-lg">
                    <strong className="text-white block mb-1">3. Harassment, 4. Misinformation, 5. Platform Integrity</strong>
                    <p className="text-sm">Hate speech, doxxing, fake news, bots, and hacks are strictly prohibited.</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">💰 Monetization & Payments</h3>
                <p>Subscriptions & coins are non-refundable. Only use official payment channels. Fraudulent transactions result in termination.</p>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">📢 Reporting & Appeals</h3>
                <p>Report violations via <span className="text-brand-primary">support@zintle.ai</span> or in-app tools.</p>
            </div>

            <div className="pt-6 border-t border-white/10 text-center">
                <p className="text-white font-medium">🤝 Together, We Build a Better Zintle!</p>
                <p className="text-sm mt-2">Need help? Contact us at support@zintle.ai</p>
                <p className="text-brand-primary font-bold mt-2">#StayCreative #RespectTheStory 🚀</p>
            </div>
        </div>
    </div>
);
