export interface RegisterUser {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "FACULTY" | "STUDENT";
}