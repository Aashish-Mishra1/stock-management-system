const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, phone, address, role = 'user', avatar } = userData;
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, phone, address, role, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, phone, address, role, avatar]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, address, role, avatar, is_active, created_at FROM users WHERE id = ?',
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

  static async updateById(id, updateData) {
    const allowedFields = ['name', 'email', 'phone', 'address', 'role', 'avatar', 'is_active'];
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
      'UPDATE users SET password = ? WHERE id = ?',
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
      SELECT id, name, email, phone, address, role, avatar, is_active, created_at 
      FROM users 
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const queryParams = [];
    if (search) {
      query += ` WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?`;
      countQuery += ` WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
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