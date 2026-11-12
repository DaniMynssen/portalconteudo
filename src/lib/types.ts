import type { Format, MediaKind, Platform, SuggestionStatus } from "./pipelines";

export type Role = "admin" | "client";

export interface Client {
  id: string;
  name: string;
  slug: string;
  color: string;
  avatar_url: string | null;
  youtube_url: string | null;
  instagram_handle: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  client_id: string | null;
}

export interface ContentMetadata {
  // YouTube
  description?: string;
  tags?: string[];
  chapters?: string;
  // Instagram
  caption?: string;
  hashtags?: string[];
  mentions?: string;
}

export interface Content {
  id: string;
  client_id: string;
  platform: Platform;
  format: Format;
  status: string;
  publish_date: string | null;
  title: string;
  briefing: string;
  script: string;
  notes: string;
  metadata: ContentMetadata;
  post_url: string | null;
  transcript: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TitleOption {
  id: string;
  content_id: string;
  text: string;
  is_selected: boolean;
  client_pick: boolean;
  created_at: string;
}

export interface Media {
  id: string;
  content_id: string;
  kind: MediaKind;
  storage_path: string;
  file_name: string | null;
  sort_order: number;
  is_selected: boolean;
  client_pick: boolean;
  created_at: string;
}

export interface MediaWithUrl extends Media {
  url: string | null;
}

export interface Suggestion {
  id: string;
  client_id: string;
  created_by: string | null;
  title: string;
  description: string;
  platform: Platform | null;
  format: Format | null;
  reference_url: string | null;
  attachment_path: string | null;
  status: SuggestionStatus;
  admin_reply: string | null;
  content_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  content_id: string | null;
  suggestion_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface Approval {
  id: string;
  content_id: string;
  user_id: string | null;
  decision: "aprovado" | "ajuste";
  comment: string | null;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
}

/** Item de lista (calendário/kanban) com a capa já assinada. */
export interface ContentCard extends Content {
  cover_url: string | null;
  client?: Pick<Client, "id" | "name" | "slug" | "color"> | null;
}
