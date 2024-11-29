const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication token is missing!" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SEC, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token!" });
    }
    req.user = user;
    next();
  });
};


const verifyTokenAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user?.isAdmin) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied! Admins only." });
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAdmin,
};
