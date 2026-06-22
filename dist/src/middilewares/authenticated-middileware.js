import { verifyToken } from "../utils/token.js";
export function auth(req, res, next) {
    //check if user is authenticated from http only cookie tokem
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    //verify token
    const verified = verifyToken(token);
    if (!verified) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = verified;
    next();
}
