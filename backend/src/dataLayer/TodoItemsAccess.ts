import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PageTodoItem } from "../models/PageTodoItem";

const AWSXRay = require("aws-xray-sdk");
const XAWS = AWSXRay.captureAWS(AWS);

import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";

export class TodoItemsAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoItemsTable = process.env.TODO_ITEMS_TABLE || "",
    private readonly todoIdIndex = process.env.TODO_ID_INDEX || ""
  ) {}

  async getAllTodoItems(
    userId: String,
    limit: number,
    nextPage: any
  ): Promise<PageTodoItem> {
    const params: QueryParams = {
      TableName: this.todoItemsTable,
      Limit: limit,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };
    if (nextPage != undefined) params["ExclusiveStartKey"] = nextPage;
    const result = await this.docClient.query(params).promise();

    const items = result.Items;
    return {
      items: items as TodoItem[],
      nextPage: result.LastEvaluatedKey,
    };
  }

  async findItemById(userId: string, todoId: string): Promise<TodoItem | null> {
    const result = await this.docClient
      .query({
        TableName: this.todoItemsTable,
        IndexName: this.todoIdIndex,
        ConsistentRead: true,
        KeyConditionExpression: "userId = :userId and todoId = :todoId",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":todoId": todoId,
        },
      })
      .promise();

    if (result.Count === 0 || !result.Items) {
      return null;
    }

    return result.Items[0] as TodoItem;
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todoItemsTable,
        Item: todoItem,
      })
      .promise();

    return todoItem;
  }

  async updateTodoItem(
    userId: string,
    todoId: string,
    update: TodoUpdate
  ): Promise<boolean> {
    const todoItem = await this.findItemById(userId, todoId);
    if (!todoItem) {
      return false;
    }

    const createdAt = todoItem.createdAt;

    await this.docClient
      .update({
        TableName: this.todoItemsTable,
        Key: { userId, createdAt },
        UpdateExpression:
          "set #itemName = :itemName, dueDate = :dueDate, done = :done",
        ExpressionAttributeValues: {
          ":itemName": update.name,
          ":dueDate": update.dueDate,
          ":done": update.done,
        },
        ExpressionAttributeNames: {
          "#itemName": "name",
        },
      })
      .promise();

    return true;
  }

  async deleteTodoItem(userId: string, todoId: string): Promise<void> {
    const todoItem = await this.findItemById(userId, todoId);
    if (!todoItem) {
      return;
    }

    const createdAt = todoItem.createdAt;
    await this.docClient
      .delete({
        TableName: this.todoItemsTable,
        Key: { userId, createdAt },
      })
      .promise();
  }

  async parseLimitParam(event: any, limitDefault: number) {
    const limitStr = queryParameter(event, "limit");
    if (!limitStr) return Promise.resolve(undefined);
    const limit = parseInt(limitStr, limitDefault);
    if (limit <= 0) throw new Error("The limitation must be greater than zero");
    return limit;
  }

  async parseNextPage(event: any) {
    const nextPageStr = queryParameter(event, "nextPage");
    if (!nextPageStr) return Promise.resolve(undefined);
    const decodeURI = decodeURIComponent(nextPageStr);
    return JSON.parse(decodeURI);
  }
}

function queryParameter(event: any, name: string) {
  const query = event.queryStringParameters
  if(!query)
      return Promise.resolve(undefined)
  return query[name]
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log("Creating a local DynamoDB instance");
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
