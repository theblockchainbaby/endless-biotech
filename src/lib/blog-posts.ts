export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "why-tissue-culture-labs-still-use-spreadsheets",
    title: "Why Tissue Culture Labs Still Use Spreadsheets (And Why That Has to Change)",
    excerpt:
      "Most tissue culture labs are running on spreadsheets built years ago. Here's what that's actually costing you — and what modern labs are doing instead.",
    date: "March 10, 2026",
    author: "Cassidy",
    category: "Industry",
    readTime: "4 min read",
    content: `
<p>Walk into almost any tissue culture lab today and you'll find the same thing: a spreadsheet open on someone's screen. Maybe two. Maybe a folder full of them, one per cultivar, one per location, one per week.</p>

<p>It works. Until it doesn't.</p>

<h2>The spreadsheet problem isn't the spreadsheet</h2>

<p>Spreadsheets aren't the enemy. They're flexible, familiar, and free. The problem is what happens when your lab scales. When you're managing thousands of vessels across multiple cultivars, tracking subculture schedules, monitoring contamination rates, and trying to plan production for Q3 — a spreadsheet stops being a tool and starts being a liability.</p>

<p>Here's what we hear from lab directors all the time:</p>

<ul>
<li>"We have three different files and nobody knows which one is current."</li>
<li>"I have to manually count vessels every week because the numbers never match."</li>
<li>"If our lead tech leaves, half our institutional knowledge walks out the door with them."</li>
</ul>

<p>Sound familiar?</p>

<h2>What you're actually losing</h2>

<p>Manual vessel logging takes about 15 seconds per entry. In a lab moving 500 vessels a day, that's over two hours of data entry. Every day. That's time your team isn't spending on actual science.</p>

<p>Beyond the time cost, there's the accuracy problem. Human error in spreadsheets is inevitable. A transposed number, a missed row, a formula that breaks when someone adds a column — these aren't edge cases. They're Tuesday.</p>

<p>And contamination tracking? Most labs aren't doing it systematically at all. They're reacting to problems instead of spotting patterns before they spread.</p>

<h2>What modern labs are doing instead</h2>

<p>Purpose-built lab management software has come a long way. The best systems today let you log a vessel in 3 seconds with a barcode scan, automatically flag subculture schedules, and surface contamination trends by cultivar, location, or media type — before they become a crisis.</p>

<p>More importantly, they make your lab's knowledge permanent. Your protocols, your lineage trees, your production history — it lives in the system, not in someone's head or a file on their desktop.</p>

<p>The labs that are scaling fastest right now aren't the ones with the most PhDs. They're the ones that have figured out their operations. Software is how they did it.</p>

<p>If you're still on spreadsheets, it's not because there isn't a better option. It's because switching feels like a project. We've tried to make that as easy as possible — see how VitrOS works in a free demo.</p>
    `.trim(),
  },
  {
    slug: "contamination-is-costing-you-more-than-you-think",
    title: "Contamination Is Costing You More Than You Think",
    excerpt:
      "A 5% contamination rate sounds manageable. But when you do the math on lost vessels, wasted media, and delayed orders, the number gets uncomfortable fast.",
    date: "March 14, 2026",
    author: "Cassidy",
    category: "Operations",
    readTime: "5 min read",
    content: `
<p>Most labs track contamination in one of two ways: they notice when it's bad, or they don't track it at all. Neither approach is going to help you get better.</p>

<p>Let's talk about what contamination is actually costing you — and how to start getting a handle on it.</p>

<h2>The math most labs aren't doing</h2>

<p>Take a lab producing 10,000 vessels per month with a 5% contamination rate. That's 500 vessels lost. If each vessel represents roughly $2 in media, labor, and overhead costs, that's $1,000 per month — $12,000 per year — just walking out the door.</p>

<p>But the real cost isn't the vessels. It's the downstream effect. Contaminated vessels mean delayed subculture schedules. Delayed schedules mean late orders. Late orders mean unhappy customers and, sometimes, lost accounts.</p>

<p>Now ask yourself: do you actually know your contamination rate right now? And do you know which cultivar, which location, or which technician it's coming from?</p>

<h2>Why contamination is so hard to track manually</h2>

<p>The challenge with contamination is that it's a lagging indicator. By the time you see it, it's already happened. And without systematic data, you can't trace it back to the source.</p>

<p>Was it the media prep? A specific autoclave cycle? A particular transfer room? One technician's technique? Without vessel-level tracking, you're guessing.</p>

<p>Most labs keep a rough contamination log — a notebook, a column in a spreadsheet. But they're not correlating that data with anything. They're not asking: is my contamination rate for Cultivar A three times higher in Location 2 than Location 1? Because if it is, that tells you something important.</p>

<h2>What systematic tracking actually looks like</h2>

<p>Good contamination tracking means logging every vessel with enough metadata to actually diagnose problems. That means tracking cultivar, location, media batch, technician, and stage — so when contamination spikes, you can filter and find the pattern.</p>

<p>It also means setting alert thresholds. If your contamination rate for a specific cultivar jumps above 8%, you want to know that day — not when you're reviewing the month-end report three weeks later.</p>

<p>This isn't complicated. It just requires getting your data into a system that can surface these patterns automatically instead of waiting for someone to go looking for them.</p>

<h2>Start with what you have</h2>

<p>You don't have to overhaul your entire operation to get better contamination data. Start by making sure every vessel is logged when it's flagged as contaminated, and that the log includes at minimum the cultivar, location, and date. Even a month of consistent data will start to show you patterns you've been missing.</p>

<p>From there, the goal is to make that logging fast enough that your team actually does it — which is where barcode scanning and purpose-built software make a real difference. When logging takes 3 seconds instead of 15, compliance goes up and your data gets clean enough to act on.</p>
    `.trim(),
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
