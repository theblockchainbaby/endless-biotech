import { sanityClient } from './client'
import { PortableTextBlock } from 'next-sanity'

export interface SanityPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  author: string
  category: string
  publishedAt: string
  body: PortableTextBlock[]
}

export async function getAllPosts(): Promise<SanityPost[]> {
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      "excerpt": pt::text(body)[0..200],
      "author": author->name,
      "category": categories[0]->title,
      publishedAt,
    }`
  )
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      "excerpt": pt::text(body)[0..200],
      "author": author->name,
      "category": categories[0]->title,
      publishedAt,
      body,
    }`,
    { slug }
  )
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await sanityClient.fetch(
    `*[_type == "post"]{ "slug": slug.current }`
  )
  return posts.map((p: { slug: string }) => p.slug)
}
