const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, firstName, lastName, role = 'user' } = userData;
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName || null, lastName || null, role]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, username, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return users[0];
  }

  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0];
  }

  static async findByUsername(username) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return users[0];
  }

  static async updateById(id, updateData) {
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role'];
    const fields = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAllUsers(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = `
      SELECT id, username, email, first_name, last_name, role, created_at, updated_at
      FROM users 
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const queryParams = [];
    if (search) {
      query += ` WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
      countQuery += ` WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit) || 10} OFFSET ${parseInt(offset) || 0}`;
    const [users] = await pool.execute(query, queryParams);
    const [totalResult] = await pool.execute(countQuery, search ? [
      `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`
    ] : []);
    return {
      users,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async exists(id) {
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    return users.length > 0;
  }
}

module.exports = User;
