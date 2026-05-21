/** API contract aligned with backend PDF (Person 3). */

export type CommentStatus = "ACTIVE" | "REMOVED";

export type CommentResponse = {
  id: string;
  paperId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  content: string;
  citation?: string;
  likesCount: number;
  /** Set when the request includes an authenticated viewer. */
  likedByMe?: boolean;
  replies: CommentResponse[];
  createdAt: string;
  updatedAt: string;
  status: CommentStatus;
};

export type CreateCommentRequest = {
  paperId: string;
  content: string;
  citation?: string;
  parentCommentId?: string;
};

export type UpdateCommentRequest = {
  content: string;
  citation?: string;
};
