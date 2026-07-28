export type AdminSearchItemType = "user" | "project" | "file" | "lead";
export type AdminSearchGroupKey = "users" | "projects" | "files" | "leads";
export type AdminSearchMetadataValue = string | number | boolean | null;

export type AdminSearchItem = {
  id: string;
  type: AdminSearchItemType;
  title: string;
  subtitle: string;
  metadata: Record<string, AdminSearchMetadataValue>;
  target_url: string;
};

export type AdminSearchGroups = Record<AdminSearchGroupKey, AdminSearchItem[]>;

export type AdminSearchResponse = {
  query: string;
  groups: AdminSearchGroups;
  total_matches: number;
};
