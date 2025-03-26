import express from "express";
import db from "./config/database.js";
import router from "./routes/index.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import Autority from "./models/aurorityModel.js";
 
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Home Route');
});

try {
    await db.authenticate();
    console.log('Database connected...');
} catch (error) {
    console.error('Connection error:', error);
}

app.use(cors());
app.use(express.json());
app.use('/', router);

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await Autority.findOne({ where: { username } }); // Извлекаем пользователя из БД

      if (!user) {
          return res.status(400).send('User not found');
      }
      
      const isMatch = await bcrypt.compare(user.password, password);
      if (!isMatch) {
          return res.status(403).send('Invalid password');
      }
      const token = jwt.sign({ username: user.username, role: user.role  }, 'secret-key', { expiresIn: '15h' });
      res.json({ token });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

app.get('/api/check-token', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Извлечение токена из заголовка

    if (!token) {
        return res.status(401).json({ valid: false }); // Токен отсутствует
    }

    jwt.verify(token, 'secret-key', (err) => {
        if (err) {
            return res.status(401).json({ valid: false }); // Токен недействителен
        }
        return res.json({ valid: true }); // Токен действителен
    });
});

app.get('/api/get-user-info', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Извлечение токена из заголовка

    if (!token) {
        return res.status(401).json({ valid: false, message: 'Токен отсутствует' }); // Токен отсутствует
    }

    jwt.verify(token, 'secret-key', async (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Токен недействителен' }); // Токен недействителен
        }

        // Получение логина из декодированного токена
        const { username } = decoded;
        
        try {
            const user = await Autority.findOne({ where: { username } });

            if (!user) {
                return res.status(404).json({ valid: false, message: 'Пользователь не найден' }); // Пользователь не найден
            }

            return res.json({ valid: true, username, role: user.role }); // Возвращаем статус и данные
        } catch (error) {
            console.error(error);
            return res.status(500).json({ valid: false, message: 'Ошибка сервера' }); // Ошибка сервера
        }
    });
});



app.listen(port, () =>
    console.log(`Server running on port ${port}, http://localhost:${port}`)
  );