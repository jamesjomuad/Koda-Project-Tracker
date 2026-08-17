export interface CommentPayload {
  body: string;
}

export interface Comment extends CommentPayload {
  id: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}