import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllPosts } from "@/sanity/queries";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Blog | Tissue Culture Lab Tips & Industry Insights | VitrOS",
  description:
    "Practical guides, industry insights, and operations advice for tissue culture labs. Learn how modern labs are scaling faster with better systems.",
  keywords: [
    "tissue culture blog",
    "lab management tips",
    "plant propagation insights",
    "tissue culture operations",
    "lab software guides",
    "contamination tracking tips",
  ],
  openGraph: {
    title: "Blog | Tissue Culture Lab Tips & Industry Insights | VitrOS",
    description:
      "Practical guides, industry insights, and operations advice for tissue culture labs.",
  },
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="VitrOS" width={500} height={488} className="h-14 w-auto" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/features"><Button variant="ghost" size="sm">Features</Button></Link>
            <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <Link href="/blog" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Blog</Button></Link>
            <Link href="/demo" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Demo</Button></Link>
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/signup"><Button size="sm">Start Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 md:py-24 px-4 border-b">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Lab Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Practical guides and industry perspective for tissue culture labs that are serious about scaling.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 px-4 flex-1">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts yet. Check back soon.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <article className="border rounded-xl p-8 h-full hover:border-primary/50 transition-colors bg-background">
                    <div className="flex items-center gap-3 mb-4">
                      {post.category && <Badge variant="secondary">{post.category}</Badge>}
                    </div>
                    <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(post.publishedAt), "MMMM d, yyyy")} &middot; {post.author}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-muted/30 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            See VitrOS in action
          </h2>
          <p className="text-muted-foreground mb-8">
            Track every vessel, spot contamination trends, and scale your lab without the spreadsheet chaos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">Get a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/why-vitros" className="hover:text-foreground transition-colors">Why VitrOS</Link></li>
                <li><a href="mailto:support@vitroslabs.com" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Start Free</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Built For</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tissue Culture Labs</li>
                <li>Plant Propagation</li>
                <li>Commercial Nurseries</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <Image src="/logo.png" alt="VitrOS" width={100} height={67} className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} VitrOS Labs. Powered by Caipher. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
