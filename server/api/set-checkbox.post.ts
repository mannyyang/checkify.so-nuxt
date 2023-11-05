import { Client, isFullBlock } from '@notionhq/client';
import {
  ToDoBlockObjectResponse,
  PageObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { consola } from 'consola';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

type CheckboxBlock = ToDoBlockObjectResponse & {};

export default defineEventHandler(async (event) => {
  const body: ToDoBlockObjectResponse = await readBody(event);

  try {
    const response = await notion.blocks.update({
      block_id: body.id,
      to_do: {
        checked: body.to_do.checked
      }
    });

    return response;
  } catch (error) {
    throw error;
  }
});
