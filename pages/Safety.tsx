import React from 'react';

export const Safety = () => (
    <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">Safety Center</h1>
        <div className="prose prose-invert max-w-none text-brand-muted space-y-6">
            <p className="text-lg">At Zintle, your safety is our top priority. We use advanced AI and human moderation to ensure a positive experience.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xl mb-4">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">AI Content Filtering</h3>
                    <p>Our real-time AI scans text for harmful content, hate speech, and inappropriate behavior, blocking it before it reaches you.</p>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xl mb-4">
                        <i className="fa-solid fa-user-shield"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verified Creators</h3>
                    <p>We strictly verify creators to ensure you're interacting with authentic personalities and safe AI models.</p>
                </div>
            </div>
        </div>
    </div>
);
