import React from 'react';

export const Refund = () => (
    <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">Refund Policy</h1>
        <div className="prose prose-invert max-w-none text-brand-muted space-y-6">
            <p className="text-sm">Last Updated: April 8, 2025</p>
            <p>This Refund Policy ("Policy") governs the terms under which Zintle.ai ("Company," "we," "us," or "our") processes refunds for subscription fees, in-app purchases, or other paid services ("Services"). By purchasing any Service, you ("User," "you") agree to comply with this Policy.</p>

            <div className="space-y-6">
                <div>
                    <h3 className="text-white font-bold text-lg mb-2">1. GENERAL REFUND PRINCIPLES</h3>
                    <p className="mb-2"><strong className="text-white">1.1 Subscription Services:</strong> All subscription fees (monthly/annual) are non-refundable, except where required by applicable law. Cancellation stops future charges but does not entitle you to a refund for the current billing cycle.</p>
                    <p className="mb-2"><strong className="text-white">1.2 One-Time Purchases (e.g., tips, pay-per-view content, call credits):</strong> These are final and non-refundable, unless the transaction was fraudulent or unauthorized, or the Service was not delivered due to a technical error on our part.</p>
                    <p><strong className="text-white">1.3 Free Trials & Promotional Offers:</strong> If you cancel before a free trial ends, no charges apply. Failure to cancel results in automatic conversion to a paid subscription, subject to this Policy.</p>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">2. ELIGIBILITY FOR REFUND REQUESTS</h3>
                    <p className="mb-2"><strong className="text-white">2.1 Valid Refund Requests:</strong> Refunds may be considered only for: Duplicate charges, Service failure (verified error), or Unauthorized transactions.</p>
                    <p><strong className="text-white">2.2 Non-Refundable Circumstances:</strong> No refunds for: Change of mind, dissatisfaction with content quality, partial usage, or Terms violations leading to ban.</p>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">3. REFUND REQUEST PROCESS</h3>
                    <p className="mb-2"><strong className="text-white">3.1 How to Request:</strong> Submit a refund request within 1 day of the charge via <span className="text-brand-primary">support@zintle.ai</span> with: Transaction ID, Reason, and Supporting evidence.</p>
                    <p><strong className="text-white">3.2 Processing Time:</strong> Approved refunds processed within 14 business days to original method.</p>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">4. CHARGEBACKS & DISPUTES</h3>
                    <p className="mb-2"><strong className="text-white">4.1 Chargeback Policy:</strong> Disputing charges via bank without contacting us first may result in immediate account suspension and a future ban.</p>
                    <p><strong className="text-white">4.2 Resolution:</strong> We will investigate and may provide evidence of delivery.</p>
                </div>

                <div>
                    <h3 className="text-white font-bold text-lg mb-2">5. GOVERNING LAW & DISPUTES</h3>
                    <p>Disputes subject to laws of India, exclusive jurisdiction of courts of Delhi. Resolved through negotiation or binding arbitration.</p>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold text-lg mb-4">CONTACT</h3>
                    <p>You may contact the Grievance Officer at:</p>
                    <p className="mt-2 text-white font-medium">Email: support@zintle.ai</p>
                    <p className="mt-2 text-gray-400">Address: Zintle (Sofnics Tech Labs Pvt. Ltd.)<br />3rd Floor, B-12, Kh No.82/9, Mahavir Enclave<br />New Delhi, South West Delhi, Delhi, 110045</p>
                </div>
            </div>
        </div>
    </div>
);
