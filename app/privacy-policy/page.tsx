

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
                🛡️ GitLance Privacy Policy
            </h1>

            <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <div className="mb-8">
                    <p className="font-medium text-foreground">Effective Date: November 2025</p>
                    <p className="font-medium text-foreground">Last Updated: November 2025</p>
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">1. Introduction</h2>
                    <p>
                        Welcome to GitLance (“we,” “our,” or “us”). GitLance is a collaboration and freelancing platform that connects developers and clients to work on GitHub-integrated projects. We value your privacy and are committed to protecting your personal information in accordance with applicable data protection laws.
                    </p>
                    <p className="mt-2">
                        This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">2. Information We Collect</h2>
                    <p className="mb-2">We collect the following types of information:</p>

                    <div className="ml-4 space-y-4">
                        <div>
                            <h3 className="font-medium text-foreground">a. Personal Information</h3>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>Name, email address, and password (for registered users).</li>
                                <li>GitHub username or linked account details (if connected).</li>
                                <li>Profile data such as skills, bio, and project history.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">b. Project and Repository Information</h3>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>GitHub repository metadata, commits, pull requests, and related activity.</li>
                                <li>Files or communication shared through GitLance (chat, proposals, etc.).</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">c. Usage Data</h3>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>Device type, IP address, and browser type.</li>
                                <li>Session logs, analytics data, and interaction history.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">d. Cookies & Tracking</h3>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>We use cookies and similar technologies for authentication, analytics, and improving user experience.</li>
                                <li>You can control cookies through your browser settings.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">3. How We Use Your Information</h2>
                    <p>We process your data to:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Enable account registration and secure authentication.</li>
                        <li>Facilitate project collaboration between clients and developers.</li>
                        <li>Integrate GitHub repositories and display contribution data.</li>
                        <li>Improve user experience, personalize recommendations, and analyze platform performance.</li>
                        <li>Communicate updates, notifications, or promotional content (if opted in).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">4. How We Protect Your Data</h2>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>All connections use HTTPS and encryption for data transmission.</li>
                        <li>GitHub authorization follows OAuth 2.0 standards.</li>
                        <li>Sensitive information (like passwords) is stored in hashed format.</li>
                        <li>Access to project data is restricted to approved collaborators only.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">5. Data Sharing</h2>
                    <p>We do not sell or rent user data. We may share data only with:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>GitHub APIs, strictly for integration purposes.</li>
                        <li>Service providers who help us operate the platform (e.g., hosting, analytics).</li>
                        <li>Legal authorities, if required by law.</li>
                    </ul>
                    <p className="mt-2">All third-party services comply with standard data protection agreements.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">6. Data Retention</h2>
                    <p>
                        We retain data for as long as your account remains active. You may request account deletion at any time — all personal and project data will be permanently erased, except as required by law.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">7. Your Rights</h2>
                    <p>You can:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Access, edit, or delete your personal data.</li>
                        <li>Revoke GitHub integration at any time.</li>
                        <li>Request a copy of your data or restrict processing (subject to verification).</li>
                    </ul>
                    <p className="mt-2">
                        For any privacy-related inquiries, contact us at: <a href="mailto:support@gitlance.dev" className="text-primary hover:underline">support@gitlance.dev</a>
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">8. Children’s Privacy</h2>
                    <p>
                        GitLance is intended for users aged 16 and above. We do not knowingly collect information from children under 16. If such data is found, it will be deleted immediately.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">9. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy periodically. Any significant changes will be announced via email or in-app notifications.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">10. Contact Us</h2>
                    <p>If you have questions about this policy, contact:</p>
                    <div className="mt-2">
                        <p className="font-medium text-foreground">GitLance Team</p>
                        <p>📧 <a href="mailto:support@gitlance.dev" className="text-primary hover:underline">support@gitlance.dev</a></p>
                        <p>🌐 <a href="https://www.gitlance.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.gitlance.dev</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
