export type Comment = {
  id: number;
  user: string;
  text: string;
  date: string;
};

export type Contributor = {
  label: string;
  userId?: string;
  href?: string;
  avatarUrl?: string;
};

export type Attachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  keywords: string[];
  categories?: string[];
  publishedDate?: string;
  doi?: string;
  references?: string[];
  contributors?: Contributor[];
  attachment?: Attachment;
  author: {
    name: string;
    bio: string;
    avatar: string;
  };
  date: string;
  stats: {
    downloads: number;
    rating: number;
    shares: number;
    citations: number;
  };
  comments: Comment[];
};

export type NewPost = {
  title: string;
  content: string;
  keywords?: string[];
  categories?: string[];
  publishedDate?: string;
  doi?: string;
  references?: string[];
  contributors?: Contributor[];
  attachment?: Attachment;
  author?: {
    name: string;
    bio: string;
    avatar: string;
  };
  date?: string;
  stats?: {
    downloads?: number;
    rating?: number;
    shares?: number;
    citations?: number;
  };
};

export type NewComment = {
  user?: string;
  text: string;
  date?: string;
};

export function getPosts(): Post[];
export function getPostById(id: number | string): Post | null;
export function addPost(post: NewPost): Post;
export function updatePost(id: number | string, patch: Partial<NewPost>): Post;
export function addComment(postId: number | string, comment: NewComment): Comment;

