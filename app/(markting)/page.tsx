import { Metadata } from "next";
import { HeroGrid } from "@/components/blocks/hero/HeroGrid";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyGitLanceSection from "@/components/landing/WhyGitLanceSection";
// import DevelopersClientsSection from "@/components/landing/DevelopersClientsSection";
import FAQ from "@/components/landing/faq";
import ContactUs from "@/components/landing/ContactUs";

export const metadata: Metadata = {
    title: "GitLance | GitHub-Integrated Collaboration Platform for Developers",
    description:
        "GitLance connects developers and clients through GitHub-integrated projects with real-time collaboration, transparent progress tracking, and smart project management.",
    keywords: [
        "developer collaboration",
        "GitHub integration",
        "freelancing platform",
        "software teamwork",
        "project management",
        "developer network",
        "coding collaboration",
        "remote development",
    ],
    openGraph: {
        title: "GitLance | GitHub-Integrated Collaboration Platform",
        description: "Build. Collaborate. Ship — Smarter.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "GitLance - Build. Collaborate. Ship — Smarter.",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GitLance | GitHub-Integrated Collaboration Platform",
        description: "Build. Collaborate. Ship — Smarter.",
        images: ["/og-image.png"],
    },
};

export default function Home() {
    return (
        <>
            <HeroGrid />
            <FeaturesSection />
            <HowItWorksSection />
            <WhyGitLanceSection />
            {/* <DevelopersClientsSection /> */}
            <FAQ />
            <ContactUs />
        </>
    );
}
