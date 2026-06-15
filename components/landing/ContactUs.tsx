'use client';

import { useId, useState, useRef, useEffect } from 'react';
import { Mail, Send, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "hello@gitlance.dev",
    description: "We'll respond within 24 hours",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Remote First",
    description: "Working globally, everywhere",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "< 24 Hours",
    description: "Quick and reliable support",
  },
];

export default function ContactUs() {
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const messageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-animate-header] > *',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '[data-animate-header]',
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        '[data-animate-content]',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '[data-animate-grid]',
            start: "top 80%",
            once: true,
          },
          clearProps: "all",
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <section ref={sectionRef} id="contact" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-50/20 to-background dark:via-emerald-950/5" />
      </div>

      {/* Floating orbs - CSS only */}
      <div className="absolute left-[5%] top-[20%] h-56 w-56 rounded-full bg-emerald-400/8 blur-[80px]" />
      <div className="absolute right-[10%] bottom-[20%] h-64 w-64 rounded-full bg-cyan-400/8 blur-[80px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header - all text rendered for SEO */}
          <div data-animate-header className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <Mail className="w-4 h-4" />
              Get in Touch
            </div>

            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Let's Start a </span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Conversation</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or ideas? We'd love to hear from you.
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div data-animate-grid className="grid lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Contact Info */}
            <div data-animate-content className="lg:col-span-2 space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={info.title}
                    className="group flex items-start gap-4 p-5 rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                      <p className="text-base font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">{info.value}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                );
              })}

              {/* Social proof */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-sm text-muted-foreground mb-3">Trusted by developers worldwide</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white dark:border-gray-900"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">+1,000 developers</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div data-animate-content className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="p-6 md:p-8 rounded-3xl bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-lg"
              >
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <Label
                        htmlFor={nameId}
                        className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusedField === 'name' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                      >
                        Name
                      </Label>
                      <Input
                        id={nameId}
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="John Doe"
                        required
                        className="bg-white/50 dark:bg-black/30 border-emerald-500/20 focus:border-emerald-500 rounded-xl h-11 transition-colors duration-200"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label
                        htmlFor={emailId}
                        className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusedField === 'email' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                      >
                        Email
                      </Label>
                      <Input
                        id={emailId}
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="john@example.com"
                        required
                        className="bg-white/50 dark:bg-black/30 border-emerald-500/20 focus:border-emerald-500 rounded-xl h-11 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label
                      htmlFor={subjectId}
                      className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusedField === 'subject' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                    >
                      Subject
                    </Label>
                    <Input
                      id={subjectId}
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="How can we help?"
                      required
                      className="bg-white/50 dark:bg-black/30 border-emerald-500/20 focus:border-emerald-500 rounded-xl h-11 transition-colors duration-200"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label
                      htmlFor={messageId}
                      className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusedField === 'message' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                    >
                      Message
                    </Label>
                    <textarea
                      id={messageId}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      rows={4}
                      placeholder="Tell us more about your inquiry..."
                      required
                      className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 border border-emerald-500/20 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors duration-200 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      We'll get back to you within 24 hours
                    </p>
                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300 rounded-xl px-6 py-5 text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : status === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Success/Error Messages */}
                  {status === 'success' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Thank you! Your message has been sent successfully.
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                      Something went wrong. Please try again.
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
    </section>
  );
}
