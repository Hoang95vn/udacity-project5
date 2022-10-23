import { v4 as uuidv4 } from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoItemsAccess } from '../dataLayer/TodoItemsAccess'
import { AttachmentsAccess } from '../dataLayer/AttachmentsAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { PageTodoItem } from '../models/PageTodoItem'

const todoItemsAccess = new TodoItemsAccess()
const attachmentsAccess = new AttachmentsAccess()

export async function getAllTodoItems(userId: String, limit: number, nextPage: any): Promise<PageTodoItem> {
  return todoItemsAccess.getAllTodoItems(userId, limit, nextPage);
}

export async function createTodoItem(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuidv4()

  return await todoItemsAccess.createTodoItem({
    userId: userId,
    todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}

export async function updateTodoItem(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<boolean> {
  return await todoItemsAccess.updateTodoItem(userId, todoId, updateTodoRequest)
}

export async function deleteTodoItem(
  userId: string,
  todoId: string
): Promise<void> {
  await todoItemsAccess.deleteTodoItem(userId, todoId)
}

export async function getAttachmentUploadUrl(
  userId: string,
  todoId: string
): Promise<string | null> {
  const todoItem = await todoItemsAccess.findItemById(userId, todoId)
  if (!todoItem) {
    return null
  }

  return attachmentsAccess.getUploadUrl(todoId)
}

export async function parseLimitParam(event: any, limitDefault: number) {
  return await todoItemsAccess.parseLimitParam(event, limitDefault)
}

export async function parseNextPageParam(event: any) {
  return await todoItemsAccess.parseNextPage(event)
}
export function encodeNextPage(lastEvaluateKey: any) {
  if (!lastEvaluateKey)
      return null
  return encodeURIComponent(JSON.stringify(lastEvaluateKey))
}
