export type User = {
  id: string;
  status?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  login?: string;
  title?: string;
  department?: string;
  location?: string;
  phone?: string;
  managerId?: string;
};

export type UserLite = Pick<User, 'id' | 'name' | 'title' | 'department' | 'location' | 'managerId'>;

export type UsersResponse = {
  items: User[];
  nextCursor?: string;
};

export type OrgResponse = {
  node: UserLite;
  reports: UserLite[];
  hasMore: boolean;
  nextCursor?: string;
};
