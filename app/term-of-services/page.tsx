

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-6 text-foreground">
                ⚖️ GitLance Terms of Service (TOS)
            </h1>

            <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <div className="mb-8">
                    <p className="font-medium text-foreground">Effective Date: November 2025</p>
                    <p className="font-medium text-foreground">Last Updated: November 2025</p>
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
                    <p>
                        By using GitLance, you agree to these Terms of Service (“Terms”). If you do not agree, please do not use our platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">2. Description of Service</h2>
                    <p>
                        GitLance provides an online platform for developers and clients to collaborate on software projects through GitHub integration. Users can create projects, join teams, communicate, and manage repositories securely.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Accounts</h2>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>You must provide accurate information when registering.</li>
                        <li>You are responsible for maintaining the confidentiality of your credentials.</li>
                        <li>GitLance reserves the right to suspend or terminate accounts involved in abuse, fraud, or violation of these Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">4. Use of GitHub Integration</h2>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Users authorize GitLance to access repositories via GitHub OAuth.</li>
                        <li>We will never modify or push code without explicit user actions.</li>
                        <li>You may disconnect GitHub at any time.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">5. User Responsibilities</h2>
                    <p>By using GitLance, you agree to:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Use the platform only for lawful purposes.</li>
                        <li>Respect the privacy and intellectual property of others.</li>
                        <li>Not upload harmful, malicious, or unauthorized content.</li>
                        <li>Avoid exploiting or reverse-engineering the platform.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">6. Intellectual Property</h2>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>You retain ownership of your code, projects, and repositories.</li>
                        <li>GitLance owns all platform software, branding, and design assets.</li>
                        <li>You grant GitLance a limited, non-exclusive license to display your content as necessary for service functionality.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">7. Payment and Transactions</h2>
                    <p>If GitLance introduces paid services in the future:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Pricing and billing details will be disclosed before purchase.</li>
                        <li>Transactions will be processed securely through trusted payment gateways.</li>
                        <li>Refunds (if applicable) will follow the stated policy.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">8. Content and Conduct</h2>
                    <p>GitLance may moderate or remove content that violates:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Intellectual property laws</li>
                        <li>Harassment, spam, or harmful activity</li>
                        <li>Security or ethical standards of the community</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">9. Limitation of Liability</h2>
                    <p>GitLance is not liable for:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Data loss, security breaches beyond our control, or third-party outages (e.g., GitHub downtime).</li>
                        <li>Any direct or indirect damages arising from use or inability to use the platform.</li>
                    </ul>
                    <p className="mt-2">Use of GitLance is at your own risk.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">10. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate accounts that violate these Terms or disrupt the community. Users may also delete their accounts at any time.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">11. Modifications to Service</h2>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>GitLance may update or modify platform features without prior notice.</li>
                        <li>Significant policy or feature changes will be communicated to users.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">12. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of Pakistan (or your respective jurisdiction if GitLance expands regionally). Any disputes will be resolved under applicable local laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">13. Contact</h2>
                    <p>For any inquiries or issues regarding these Terms:</p>
                    <div className="mt-2">
                        <p>📧 <a href="mailto:support@gitlance.dev" className="text-primary hover:underline">support@gitlance.dev</a></p>
                        <p>🌐 <a href="https://www.gitlance.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.gitlance.dev</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
