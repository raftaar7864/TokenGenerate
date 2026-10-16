const crypto = require("crypto");
const User = require("../models/User");
const SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET;

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = SECRET || "CHANGE_THIS_AUTH_SECRET_IN_PRODUCTION";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}
function verify(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;
  const secret = SECRET || "CHANGE_THIS_AUTH_SECRET_IN_PRODUCTION";
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try { const payload = JSON.parse(Buffer.from(body, "base64url").toString()); if (!payload.exp || payload.exp < Date.now()) return null; return payload; } catch { return null; }
}
async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const payload = verify(token);
    if (!payload) return res.status(401).json({ message: "Authentication required" });
    const user = await User.findById(payload.id).select("username role");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user; next();
  } catch (error) { return res.status(401).json({ message: "Invalid authentication" }); }
}
function allowRoles(...roles) { return (req, res, next) => roles.includes(req.user?.role || "Admin") ? next() : res.status(403).json({ message: "You do not have permission to perform this action" }); }
module.exports = { sign, requireAuth, allowRoles };
