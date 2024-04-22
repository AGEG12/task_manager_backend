const express = require('express');
const dbconnect = require('./config');
const cors = require('cors');

const bcrypt = require('bcrypt');
const app = express();
const jwt = require('jsonwebtoken');


const router = express.Router();
app.use(cors());


// SECHEMAS
const User = require('./schemas/userSchema');
const Category = require('./schemas/categorySchema');
const Task = require('./schemas/taskSchema');

// ROUTERS
router.get("/", async (req, res) => {
  const users = await User.find();
  res.send(users);
})

// REGISTER / LOGIN
router.post('/users/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.status(404).json({ mensaje: 'Usuario ya registrado' });
    }
    const newUser = new User({ username, email, hashedPassword: password });
    await newUser.save();
    const token = jwt.sign({ _id: newUser._id }, 'secretKey');
    res.status(200).json({ msj: 'Usuario registrado con éxito', token });
  } catch (err) {
    res.status(500).json({ msj: 'Error al crear el usuario', err });
  }
});
router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ _id: user._id }, 'secretKey');
    res.status(200).json({ msj: 'Inicio de sesión exitoso', token });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error });
  }
});

// DASHBOARD
router.get('/dashboard', verifyToken, async (req, res) => {
  const user_id = req.userID;
  try {
    const userTasks = await Task.find({ user_id }).sort({ due_date: 1 });
    const userCategories = await Category.find({ user_id });

    res.status(200).json({ userTasks, userCategories });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error });
  }

})

// CATEGORY
router.get('/category', verifyToken, async (req, res) => {
  const user_id = req.userID;
  try {
    const categories = await Category.find({ user_id });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error });
  }
});

router.get('/category/:id', verifyToken, async (req, res) => {
  const user_id = req.userID;
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msj: 'Categoría no encontrada' });
    }

    if (category.user_id !== user_id) {
      return res.status(403).json({ msj: 'No tienes acceso a esta categoría' });
    }
    res.status(200).json({ category_name: category.category_name });
  } catch (error) {
    res.status(500).json({ msj: 'Error al obtener categoría', error });
  }
});

router.post('/category', verifyToken, async (req, res) => {
  const { category_name, category_description } = req.body;
  const user_id = req.userID;
  try {
    const newCategory = new Category({
      category_name,
      category_description,
      user_id
    });
    await newCategory.save();
    res.status(201).json({ msj: 'Categoría creada exitosamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al crear categoría', error });
  }
});

router.put('/category/:id', verifyToken, async (req, res) => {
  const { category_name, category_description } = req.body;
  const user_id = req.userID;
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msj: 'Categoría no encontrada' });
    }

    if (category.user_id !== user_id) {
      return res.status(403).json({ msj: 'No tienes permiso para editar esta categoría', user_id, category });
    }

    category.category_name = category_name;
    category.category_description = category_description;
    await category.save();
    res.status(200).json({ msj: 'Categoría actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al actualizar categoría', error });
  }
});

router.delete('/category/:id', verifyToken, async (req, res) => {
  const user_id = req.userID;
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ msj: 'Categoría no encontrada' });
    }

    if (category.user_id !== user_id) {
      return res.status(403).json({ msj: 'No tienes permiso para eliminar esta categoría' });
    }
    await category.deleteOne();
    res.status(200).json({ msj: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al eliminar categoría', error });
  }
});

// TASK
router.get('/task/:id', verifyToken, async (req, res) => {
  const user_id = req.userID;
  const taskId = req.params.id;
  try {
    const task = await Task.findById(taskId);
    if ( !task ) {
      return res.status(404).json({ msj: 'Tarea no encontrada' });
    }
    if (task.user_id !== user_id ) {
      return res.status(403).json({ msj: 'No tienes acceso a esta tarea' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ msj: 'Error al obtener categoría', error });
  }
});
router.post('/task/filters', verifyToken, async (req, res) => {
  const { categoryId, status, sortBy } = req.body;
  const user_id = req.userID; 
  try {
    let query = Task.find({ user_id });
    if (categoryId !== 'all') {
      query = query.where('category_id').equals(categoryId);
    }
    if (status !== 'all') {
      query = query.where('status').equals(status);
    } 
    if (sortBy === 'nearest') {
      query = query.sort({ due_date: 1 });
    } else if (sortBy === 'farthest') {
      query = query.sort({ due_date: -1 });
    }
    const filteredTasks = await query.exec();
    res.status(200).json(filteredTasks);
  } catch (error) {
    res.status(500).json({ msj: 'Error al filtrar tareas', error });
  }
});
router.post('/task', verifyToken, async (req, res) => {
  const user_id = req.userID;
  const { title, description, status, due_date, category_id } = req.body;
  try {
    const newTask = new Task({
      title,
      description,
      status,
      due_date,
      user_id,
      category_id
    });
    await newTask.save();
    res.status(201).json({ msj: 'Tarea creada exitosamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al crear tarea', error });
  }
});
router.put('/task/:id', verifyToken, async (req, res) => {
  const { title, description, status, due_date, category_id } = req.body;
  const taskId = req.params.id;
  const user_id = req.userID;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }
    const category = await Category.findById(task.category_id);
    if (!category || category.user_id !== user_id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar esta tarea' });
    }
    task.title = title;
    task.description = description;
    task.status = status;
    task.due_date = due_date;
    task.category_id = category_id;
    await task.save();
    res.status(200).json({ msj: 'Tarea actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al actualizar tarea', error });
  }
});
router.delete('/task/:id', verifyToken, async (req, res) => {
  const taskId = req.params.id;
  const user_id = req.userID;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }
    const category = await Category.findById(task.category_id);
    if (!category || category.user_id !== user_id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta tarea' });
    }
    await task.deleteOne();
    res.status(200).json({ msj: 'Tarea eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ msj: 'Error al eliminar tarea', error });
  }
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token || token === null) return res.status(401).send('Acceso no autorizado');
  try {
    const data = jwt.verify(token.split(' ')[1], 'secretKey');
    req.userID = data._id;
    next();
  } catch {
    return res.status(401).send('Acceso no autorizado');
  }
}


app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor corriendo en el puerto: ', PORT);
})

dbconnect();