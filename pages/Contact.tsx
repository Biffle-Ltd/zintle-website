import React from 'react';

export const Contact = () => (
    <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>
        <div className="prose prose-invert max-w-none text-brand-muted space-y-8">
            <p>We’d love to hear from you! Whether you have questions, feedback, or partnership inquiries, our team is here to help.</p>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Get in Touch</h3>
                    <p className="mb-2"><span className="text-brand-primary">📧 Email:</span> support@zintle.ai</p>
                    <p><span className="text-brand-primary">📞 Phone:</span> +91 9988998987</p>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Operating Address</h3>
                    <p className="font-medium text-white">Zintle.ai (Sofnics Tech Labs Pvt. Ltd.)</p>
                    <p>3rd Floor, B-12, Kh No.82/9, Mahavir Enclave</p>
                    <p>New Delhi, South West Delhi,</p>
                    <p>Delhi - 110045, India</p>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">Business & Partnerships</h3>
                <p>For collaborations, creator onboarding, or payment gateway integrations:</p>
                <p>📧 Email: <span className="text-white">partnerships@zintle.ai</span></p>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-2">Grievance Officer</h3>
                <p>As per IT Act compliance, contact our Grievance Officer for content-related concerns:</p>
                <p>📧 Email: <span className="text-white">grievance@zintle.ai</span></p>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
                <div className="flex gap-4">
                    <a href="#" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full hover:bg-brand-primary hover:text-white transition-colors"><i className="fa-brands fa-twitter"></i> @Zintle_ai</a>
                    <a href="#" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full hover:bg-brand-primary hover:text-white transition-colors"><i className="fa-brands fa-instagram"></i> @Zintle.ai</a>
                    <a href="#" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full hover:bg-brand-primary hover:text-white transition-colors"><i className="fa-brands fa-linkedin"></i> Zintle.ai</a>
                </div>
            </div>

            <div className="pt-6 border-t border-white/10">
                <p className="font-medium text-white">Visit Our FAQ Section</p>
                <p>For quick answers, check out our Help Center.</p>
                <p className="text-sm mt-2 text-brand-primary">We’ll respond within 24-48 hours!</p>
            </div>
        </div>
    </div>
);
