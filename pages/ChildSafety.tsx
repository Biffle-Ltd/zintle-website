import React from 'react';

export const ChildSafety = () => (
    <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold text-white mb-6">Child Safety Standards – Zintle</h1>
        <div className="prose prose-invert max-w-none text-brand-muted space-y-6 text-sm">
            <p className="text-base text-white">
                <strong>Effective Date:</strong> 23 January 2026
            </p>

            <h3 className="text-lg font-bold text-white mt-6">1. Our Commitment to Child Safety</h3>
            <p>
                Zintle is committed to providing a safe digital environment and has zero tolerance for any form of Child Sexual Abuse and Exploitation (CSAE).
            </p>
            <p>
                We strictly prohibit the creation, distribution, promotion, or storage of any content that exploits or harms minors. This applies to user-generated content, AI-generated content, text, images, audio, video, or any other media created or shared through the Zintle platform.
            </p>

            <h3 className="text-lg font-bold text-white mt-6">2. Prohibited Content</h3>
            <p>The following content is strictly prohibited on Zintle:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Sexual content involving minors, including explicit, implicit, or suggestive material</li>
                <li>Any depiction of a minor in sexual acts, poses, or contexts</li>
                <li>Grooming behavior, sexual conversations involving minors, or role-play involving minors</li>
                <li>Requests for, promotion of, or distribution of child sexual abuse material (CSAM)</li>
                <li>AI-generated content that depicts minors in sexualized or exploitative ways</li>
            </ul>
            <p className="mt-4">
                This prohibition applies regardless of intent, including fictional, animated, AI-generated, or storytelling formats.
            </p>
            <p>
                For the purposes of this policy, a minor refers to any individual under the age of 18.
            </p>

            <h3 className="text-lg font-bold text-white mt-6">3. AI Content Safety</h3>
            <p>Zintle uses AI to generate storytelling content. We take additional precautions to ensure that:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>AI systems are designed to reject prompts involving sexual content related to minors</li>
                <li>Outputs are monitored and filtered to prevent CSAE</li>
                <li>Repeated or suspicious attempts to generate prohibited content result in account restrictions or bans</li>
            </ul>

            <h3 className="text-lg font-bold text-white mt-6">4. Detection, Moderation & Enforcement</h3>
            <p>To prevent and address CSAE, we use a combination of:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Automated content filtering and moderation</li>
                <li>Prompt validation and abuse detection</li>
                <li>User reporting mechanisms</li>
                <li>Manual review where required</li>
            </ul>
            <p className="mt-4">Accounts found violating child safety standards may be:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Permanently suspended</li>
                <li>Reported to law enforcement authorities</li>
                <li>Blocked from accessing the platform</li>
            </ul>

            <h3 className="text-lg font-bold text-white mt-6">5. Reporting Child Safety Concerns</h3>
            <p>Users can report suspected child safety violations or CSAE content by contacting us at:</p>
            <p className="text-brand-primary font-medium">
                📧 support@zintle.ai
            </p>
            <p>Reports are reviewed promptly, and appropriate action is taken.</p>

            <h3 className="text-lg font-bold text-white mt-6">6. Cooperation with Law Enforcement</h3>
            <p>Zintle cooperates fully with law enforcement authorities and complies with applicable laws in India, including child protection and cyber safety regulations.</p>
            <p className="mt-4">Where required, we will:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Preserve relevant data</li>
                <li>Report CSAM to appropriate authorities</li>
                <li>Assist investigations in accordance with applicable laws</li>
            </ul>

            <h3 className="text-lg font-bold text-white mt-6">7. Compliance with Indian Laws</h3>
            <p>Zintle operates in compliance with applicable Indian laws, including laws related to:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Child protection</li>
                <li>Online safety</li>
                <li>Prevention of sexual exploitation of minors</li>
            </ul>

            <h3 className="text-lg font-bold text-white mt-6">8. Updates to This Policy</h3>
            <p>This Child Safety Standards policy may be updated periodically. Continued use of Zintle constitutes acceptance of the updated policy.</p>
        </div>
    </div>
);
