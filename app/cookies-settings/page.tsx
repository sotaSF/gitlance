
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiesSettings() {
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
                🍪 Cookies Settings
            </h1>

            <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <div className="mb-8">
                    <p className="font-medium text-foreground">Effective Date: November 2025</p>
                    <p className="font-medium text-foreground">Last Updated: November 2025</p>
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">1. What Are Cookies?</h2>
                    <p>
                        Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the owners of the site.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Cookies</h2>
                    <p className="mb-2">We use cookies for several reasons, detailed below:</p>

                    <div className="ml-4 space-y-4">
                        <div>
                            <h3 className="font-medium text-foreground">a. Essential Cookies</h3>
                            <p>
                                These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">b. Analytics Cookies</h3>
                            <p>
                                These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">c. Functional Cookies</h3>
                            <p>
                                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-medium text-foreground">d. Targeting Cookies</h3>
                            <p>
                                These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">3. Managing Cookies</h2>
                    <p>
                        You can change your cookie preferences at any time by clicking on the "Cookie Settings" link in the footer of our website. You can also adjust your browser settings to block or delete cookies.
                    </p>
                    <p className="mt-2">
                        Please note that blocking some types of cookies may impact your experience of the site and the services we are able to offer.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">4. Third-Party Cookies</h2>
                    <p>
                        In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.
                    </p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Google Analytics: One of the most widespread and trusted analytics solutions on the web for helping us to understand how you use the site and ways that we can improve your experience.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">5. Updates to This Policy</h2>
                    <p>
                        We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">6. Contact Us</h2>
                    <p>If you have questions about our use of cookies or other technologies, please email us at:</p>
                    <div className="mt-2">
                        <p>📧 <a href="mailto:support@gitlance.dev" className="text-primary hover:underline">support@gitlance.dev</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
