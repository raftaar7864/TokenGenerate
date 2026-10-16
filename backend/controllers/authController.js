const User = require("../models/User");
const { sign } = require("../middleware/auth");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password are required" });
    // Kept compatible with the existing user records and login setup.
    const user = await User.findOne({ username: username.trim(), password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const role = user.role || "Admin";
    const token = sign({ id: String(user._id), exp: Date.now() + 12 * 60 * 60 * 1000 });
    res.json({ message: "Login successful", token, user: { id: user._id, username: user.username, role } });
  } catch (error) { res.status(500).json({ message: "Login failed" }); }
};
