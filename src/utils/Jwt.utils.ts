import jwt from "jsonwebtoken";

export const getClaimsFromToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return error;
  }
};
