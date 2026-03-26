export interface AuthSessionResponse {
    authenticated: boolean;
    username: string | null;
}

export interface LoginRequestBody {
    password: string;
}
