interface QueryParams {
  TableName: string;
  Limit: number;
  KeyConditionExpression: string;
  ExclusiveStartKey?: any;
  ExpressionAttributeValues: any;
}
