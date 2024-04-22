const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pendiente', 'en progreso', 'completada'], default: 'pendiente' },
  due_date: { type: Date },
  user_id: { type: String, required: true },
  category_id: { type: String, required: true } //{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
