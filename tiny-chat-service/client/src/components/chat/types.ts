export type UserSummary = {
  id: string;
  name: string;
  email?: string;
  roomId?: string;
};

export type RoomSummary = {
  id: string;
  title: string;
  participants: UserSummary[];
  isVirtual?: boolean;
  lastMessagePreview?: string;
};
