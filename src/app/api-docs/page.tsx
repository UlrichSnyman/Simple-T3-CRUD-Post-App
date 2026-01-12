import { getApiDocs } from "~/lib/swagger";
import ReactSwagger from "~/components/swagger-ui";

export default async function SwaggerPage() {
  const spec = await getApiDocs();
  return (
    <section className="container mx-auto">
      <ReactSwagger spec={spec} />
    </section>
  );
}
