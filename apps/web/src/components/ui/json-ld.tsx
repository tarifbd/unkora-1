/**
 * Server-rendered JSON-LD structured data helper.
 * Emits a <script type="application/ld+json"> tag for SEO rich results.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default JsonLd;
