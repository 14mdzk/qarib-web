import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Feature cards live in content collections (file-based CMS): edit the
// Markdown, the section re-renders. UI strings stay in src/messages/*.
const features = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/features' }),
	schema: z.object({
		title: z.string(),
		order: z.number()
	})
});

export const collections = { features };
