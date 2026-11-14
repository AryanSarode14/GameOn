export default function requireLogin(req, res, next) {
  if (!req.isAuthenticated())
    return res.status(401).json({ error: "Login required" });
  next();
}
