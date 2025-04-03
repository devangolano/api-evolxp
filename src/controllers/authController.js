const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { name, document, prefecture, password } = req.body;
    const photo = req.file ? req.file.filename : null;

    const userExists = await User.findOne({ where: { document } });
    if (userExists) {
      return res.status(400).json({ error: 'Document already registered' });
    }

    const user = await User.create({
      name,
      document,
      prefecture,
      photo,
      password
    });

    user.password = undefined;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { document, password } = req.body;

    const user = await User.findOne({ where: { document } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    user.password = undefined;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    return res.status(200).json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = {
  register,
  login
};