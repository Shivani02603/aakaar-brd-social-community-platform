import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface FeedPost {
  id: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedResponse {
  posts: FeedPost[];
  page: number;
  limit: number;
  total: number;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  coverImageUrl?: string;
  createdAt: string;
}

export interface GroupsResponse {
  groups: Group[];
  page: number;
  limit: number;
  total: number;
}

export interface MarketplaceItem {
  id: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceResponse {
  items: MarketplaceItem[];
  page: number;
  limit: number;
  total: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantAvatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface MessagingResponse {
  conversations: Conversation[];
  messages: Message[];
  page: number;
  limit: number;
  total: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  limit: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  friendCount: number;
}

export interface UsersResponse {
  users: User[];
  page: number;
  limit: number;
  total: number;
}

export const login = (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
  return api.post('/api/auth/login', data);
};

export const register = (data: RegisterRequest): Promise<AxiosResponse<RegisterResponse>> => {
  return api.post('/api/auth/register', data);
};

export const getFeed = (page: number = 1, limit: number = 10): Promise<AxiosResponse<FeedResponse>> => {
  return api.get('/api/feed', { params: { page, limit } });
};

export const createPost = (data: { content: string; image?: File; video?: File }): Promise<AxiosResponse<FeedPost>> => {
  const formData = new FormData();
  formData.append('content', data.content);
  if (data.image) formData.append('image', data.image);
  if (data.video) formData.append('video', data.video);
  return api.post('/api/feed', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getGroups = (page: number = 1, limit: number = 10): Promise<AxiosResponse<GroupsResponse>> => {
  return api.get('/api/groups', { params: { page, limit } });
};

export const createGroup = (data: { name: string; description: string; isPrivate: boolean; coverImage?: File }): Promise<AxiosResponse<Group>> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('isPrivate', data.isPrivate.toString());
  if (data.coverImage) formData.append('coverImage', data.coverImage);
  return api.post('/api/groups', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMarketplace = (page: number = 1, limit: number = 10): Promise<AxiosResponse<MarketplaceResponse>> => {
  return api.get('/api/marketplace', { params: { page, limit } });
};

export const createMarketplaceItem = (data: {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  images: File[];
}): Promise<AxiosResponse<MarketplaceItem>> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('price', data.price.toString());
  formData.append('currency', data.currency);
  formData.append('category', data.category);
  formData.append('condition', data.condition);
  formData.append('location', data.location);
  data.images.forEach((image) => formData.append('images', image));
  return api.post('/api/marketplace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getConversations = (page: number = 1, limit: number = 20): Promise<AxiosResponse<MessagingResponse>> => {
  return api.get('/api/messaging/conversations', { params: { page, limit } });
};

export const getMessages = (userId: number, page: number = 1, limit: number = 50): Promise<AxiosResponse<MessagingResponse>> => {
  return api.get(`/api/messaging/messages/${userId}`, { params: { page, limit } });
};

export const sendMessage = (receiverId: number, content: string): Promise<AxiosResponse<Message>> => {
  return api.post('/api/messaging/send', { receiverId, content });
};

export const getNotifications = (page: number = 1, limit: number = 20): Promise<AxiosResponse<NotificationsResponse>> => {
  return api.get('/api/notifications', { params: { page, limit } });
};

export const markNotificationAsRead = (notificationId: number): Promise<AxiosResponse<Notification>> => {
  return api.patch(`/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = (): Promise<AxiosResponse<{ message: string }>> => {
  return api.patch('/api/notifications/read-all');
};

export const getUsers = (page: number = 1, limit: number = 20): Promise<AxiosResponse<UsersResponse>> => {
  return api.get('/api/users', { params: { page, limit } });
};

export const getUser = (userId: number): Promise<AxiosResponse<User>> => {
  return api.get(`/api/users/${userId}`);
};

export const updateUser = (data: {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: File;
  coverImage?: File;
}): Promise<AxiosResponse<User>> => {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.bio) formData.append('bio', data.bio);
  if (data.location) formData.append('location', data.location);
  if (data.website) formData.append('website', data.website);
  if (data.avatar) formData.append('avatar', data.avatar);
  if (data.coverImage) formData.append('coverImage', data.coverImage);
  return api.patch('/api/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;