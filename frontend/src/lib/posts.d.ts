export type Comment = {
  id: number;
  user: string;
  text: string;
  date: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  keywords: string[];
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
export function addComment(postId: number | string, comment: NewComment): Comment;

