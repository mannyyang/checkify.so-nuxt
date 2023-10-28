import { Client } from '@notionhq/client'
import { consola } from 'consola'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export default defineEventHandler(async () => {
  const databaseId = '5d619652040e4c9788e6cf0bd7aa6ed5'

  const databasePages = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ],
    page_size: 25
  })

  const pages = databasePages.results || []

  consola.log('PAGES', databasePages)

  const allBlocks = await Promise.all(
    pages.map(async (block) => {
      const childrenBlocksResp = await notion.blocks.children.list({
        block_id: block.id
      })

      consola.log('CHILDREN', childrenBlocksResp)

      const childrenBlocks = childrenBlocksResp.results.filter((childBlock) => {
        // @ts-ignore
        return childBlock.type === 'to_do'
      })

      return childrenBlocks
    })
  )

  // const todos = []

  // for (const item of allBlocks) {
  //   if (item.type === 'to_do') {
  //     todos.push(item)
  //   }
  // }

  return allBlocks
})
