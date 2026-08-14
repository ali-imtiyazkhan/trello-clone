export * from "./skills";
export * from "./scorer"

export interface RoomJoinedMessage {
  type: 'ROOM_JOINED';
  data: {
    boardId: string;
    userId: string;
    activeUsers: Array<{ userId: string; username?: string; joinedAt: Date }>;
  };
}

export interface UserJoinedMessage {
  type: 'USER_JOINED';
  data: {
    boardId: string;
    userId: string;
    username?: string;
    timestamp: string;
  };
}

export interface UserLeftMessage {
  type: 'USER_LEFT';
  data: {
    boardId: string;
    userId: string;
    username?: string;
    timestamp: string;
  };
}

export interface NewMessageMessage {
  type: 'NEW_MESSAGE';
  data: {
    boardId: string;
    userId: string;
    username?: string;
    message: string;
    timestamp: string;
  };
}

export interface CardMovedMessage {
  type: 'CARD_MOVED';
  data: {
    boardId: string;
    userId: string;
    issueId: string;
    sourceSectionId: string;
    targetSectionId: string;
    newIndex: number;
    timestamp: string;
  };
}

export interface CardCreatedMessage {
  type: 'CARD_CREATED';
  data: {
    boardId: string;
    userId: string;
    card: any;
    timestamp: string;
  };
}

export interface CardUpdatedMessage {
  type: 'CARD_UPDATED';
  data: {
    boardId: string;
    userId: string;
    card: any;
    cardId: string;
    timestamp: string;
  };
}

export interface CardDeletedMessage {
  type: 'CARD_DELETED';
  data: {
    boardId: string;
    userId: string;
    cardId: string;
    timestamp: string;
  };
}

export interface SectionCreatedMessage {
  type: 'SECTION_CREATED';
  data: {
    boardId: string;
    userId: string;
    section: any;
    timestamp: string;
  };
}

export interface SectionUpdatedMessage {
  type: 'SECTION_UPDATED';
  data: {
    boardId: string;
    userId: string;
    section: any;
    sectionId: string;
    timestamp: string;
  };
}

export interface SectionDeletedMessage {
  type: 'SECTION_DELETED';
  data: {
    boardId: string;
    userId: string;
    sectionId: string;
    timestamp: string;
  };
}

export interface PongMessage {
  type: 'PONG';
  data: {
    timestamp: string;
  };
}

export interface ErrorMessage {
  type: 'ERROR';
  data: {
    message: string;
  };
}

export interface CardAssignedMessage {
  type: 'CARD_ASSIGNED';
  data: {
    boardId: string;
    cardId: string;
    userId: string;
    username?: string;
    cardTitle?: string;
    score?: number;
    timestamp: string;
  };
}

export interface ProfileUpdatedMessage {
  type: 'PROFILE_UPDATED';
  data: {
    boardId: string;
    userId: string;
    username?: string;
    timestamp: string;
  };
}

export type ServerMessage =
  | RoomJoinedMessage
  | UserJoinedMessage
  | UserLeftMessage
  | NewMessageMessage
  | CardMovedMessage
  | CardCreatedMessage
  | CardUpdatedMessage
  | CardDeletedMessage
  | SectionCreatedMessage
  | SectionUpdatedMessage
  | SectionDeletedMessage
  | CardAssignedMessage
  | ProfileUpdatedMessage
  | PongMessage
  | ErrorMessage;

export type ClientMessage =
  | { type: 'JOIN_ROOM'; data: { boardId: string; userId: string; username?: string } }
  | { type: 'LEAVE_ROOM'; data: { boardId: string; userId: string } }
  | { type: 'SEND_MESSAGE'; data: { boardId: string; userId: string; username?: string; message: string } }
  | { type: 'MOVE_CARD'; data: { boardId: string; userId: string; issueId: string; sourceSectionId: string; targetSectionId: string; newIndex: number } }
  | { type: 'CREATE_CARD'; data: { boardId: string; userId: string; card: any } }
  | { type: 'UPDATE_CARD'; data: { boardId: string; userId: string; card: any; cardId: string } }
  | { type: 'DELETE_CARD'; data: { boardId: string; userId: string; cardId: string } }
  | { type: 'CREATE_SECTION'; data: { boardId: string; userId: string; section: any } }
  | { type: 'UPDATE_SECTION'; data: { boardId: string; userId: string; section: any; sectionId: string } }
  | { type: 'DELETE_SECTION'; data: { boardId: string; userId: string; sectionId: string } }
  | { type: 'ASSIGN_CARD'; data: { boardId: string; cardId: string; userId: string; username?: string; cardTitle?: string; score?: number } }
  | { type: 'PROFILE_UPDATED'; data: { boardId: string; userId: string; username?: string } }
  | { type: 'PING'; data: {} };