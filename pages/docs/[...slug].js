import { useCMS, usePlugins } from "tinacms"
import { useRouter } from "next/router"
import matter from "gray-matter"

import { parseNestedDocsMds, toMarkdownString } from "@utils"

import Head from "@components/head"
import Layout from "@components/layout"
import Container from "@components/container"

const DocTemplate = ({ markdownFile, allDocs }) => {
  const router = useRouter()
  const cms = useCMS()

  const parentObject = allDocs.find((item) => item.key === router.query.slug[0])

  usePlugins([
    {
      __type: "content-creator",
      name: `Create Child Page for ${parentObject.title}`,
      fields: [
        {
          name: "slug",
          label: "Slug",
          component: "text",
          required: true,
        },
        {
          name: "title",
          label: "Title",
          component: "text",
          required: true,
        },
        {
          name: "groupIn",
          label: "Group in",
          description: "Group under a name to create a 3rd level",
          component: "text",
        },
      ],
      onSubmit: ({ slug, title, groupIn }) => {
        return cms.api.git
          .writeToDisk({
            fileRelativePath: `docs/${router.query.slug[0]}/${slug}.md`,
            content: toMarkdownString({
              fileRelativePath: `docs/${router.query.slug[0]}/${slug}.md`,
              rawFrontmatter: {
                title,
                groupIn: groupIn || "",
              },
            }),
          })
          .then(() => {
            setTimeout(() => router.push(`/docs/${router.query.slug[0]}/${slug}`), 1500)
          })
      },
    },
  ])

  return (
    <Layout allDocs={allDocs}>
      <Head title="Docs" />
      <Container>
        <h1>{markdownFile.frontmatter.title}</h1>
      </Container>
    </Layout>
  )
}

DocTemplate.getInitialProps = async function (ctx) {
  const { slug } = ctx.query
  const content = await import(`@docs/${slug.join("/")}.md`)
  const data = matter(content.default)

  const docs = ((context) => parseNestedDocsMds(context))(require.context("@docs", true, /\.md$/))

  return {
    markdownFile: {
      fileRelativePath: `src/docs/${slug}.md`,
      frontmatter: data.data,
      markdownBody: data.content,
    },
    allDocs: docs,
  }
}

export default DocTemplate