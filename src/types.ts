export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  email: string;
  phone?: string;
  avatar?: string; // base64 URL or image URL
  skills?: string; // comma separated or text
  github?: string;
  linkedin?: string;
  website?: string;
  updatedAt?: string;
}

export interface Education {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description?: string;
  userId: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description?: string;
  userId: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string; // base64 or URL
  link?: string;
  techStack?: string;
  userId: string;
  order?: number;
  extraImages?: string[]; // Up to 5 base64 or URLs
  videoUrl?: string; // Standard video path or YouTube URL
}
