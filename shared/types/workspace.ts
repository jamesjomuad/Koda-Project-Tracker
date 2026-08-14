export interface WorkspacePayload {
  name: string;
  description?: string;
}

export interface Workspace extends WorkspacePayload {
  id: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}