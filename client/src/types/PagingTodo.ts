import { Todo } from "./Todo"

export interface PagingTodo {
  items: Todo[]
  nextPage: string
}
