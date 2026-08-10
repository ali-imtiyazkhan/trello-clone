export interface CommonMessage {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    sender: string;
    receiver: string;
    type: string;
    status: string;
    error: string;
    errorCode: string;
    errorMessage: string;
    errorData: any;
}