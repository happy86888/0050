export type CommentType = "idea" | "statement";
export type CommentStatus = "pending" | "approved" | "rejected";

export type PublicComment = {
  id: string;
  created_at: string;
  name: string;
  type: CommentType;
  message: string;
  holding_status: string | null;
  permission_to_publish: string | null;
  attachment_url: string | null;
};

export type AdminComment = PublicComment & {
  email: string | null;
  status: CommentStatus;
  attachment_path: string | null;
  ip_hash: string | null;
  user_agent: string | null;
};
