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

const getUsersByDocument = async (req, res) => {
  try {
    const { document } = req.body;

    const user = await User.findOne({
      where: { document },
      attributes: ['id', 'prefecture']
    });

    if (!user) {
      return res.status(400).json({ error: 'Nenhum usuário encontrado!' });
    }

    return res.status(200).json({ 
      id: user.id,
      prefecture: user.prefecture 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user information' });
  }
};

const login = async (req, res) => {
  try {
    const { document, prefecture, password } = req.body;

    const user = await User.findOne({
      where: { document }
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    // Se apenas o documento foi enviado, retorna a prefeitura
    if (!prefecture && !password) {
      return res.status(200).json({
        id: user.id,
        prefecture: user.prefecture
      });
    }

    // Verifica se a prefeitura corresponde
    if (prefecture && prefecture !== user.prefecture) {
      return res.status(400).json({ error: 'Prefeitura não corresponde ao usuário' });
    }

    // Verifica a senha apenas quando todos os campos estão presentes
    if (document && prefecture && password) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Senha inválida' });
      }

      user.password = undefined;

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });

      return res.status(200).json({ user, token });
    }

    return res.status(400).json({ error: 'Dados incompletos' });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = {
  register,
  login,
  getUsersByDocument
};