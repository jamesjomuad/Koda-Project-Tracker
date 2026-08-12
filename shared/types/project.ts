export const STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export type ProjectStatus = (typeof STATUSES)[number];
export type ProjectPriority = (typeof PRIORITIES)[number];
export type SortField = 'clientName' | 'projectName' | 'status' | 'priority' | 'startDate' | 'dueDate' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export const SORTABLE_FIELDS: readonly SortField[] = [
  'clientName',
  'projectName',
  'status',
  'priority',
  'startDate',
  'dueDate',
  'createdAt',
];

export interface ProjectPayload {
  clientName: string;
  projectName: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  dueDate: string;
}

export interface Project extends ProjectPayload {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsQuery {
  search?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  sortBy?: SortField;
  order?: SortOrder;
}

export interface ValidationIssue {
  field: string;
  message: string;
}