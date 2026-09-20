import { NextRequest } from "next/server";
import { getSessionCookieName, isValidSessionToken } from "./token";

export async function isAuthorizedRequest(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return isValidSessionToken(token);
}
