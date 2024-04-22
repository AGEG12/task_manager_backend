const mongoose = require('mongoose');
const mongo = process.env.MONGO || 'mongodb+srv://dwebalanestrada:sQDdBQ9FRFJOcoGe@taskmanagerdb.d8fkst0.mongodb.net/?retryWrites=true&w=majority&appName=TaskManagerDB';
const dbconnect = () => {
    mongoose.set('strictQuery', true);
    mongoose.
    connect(mongo)
    .catch (error => console.log(error));
}
module.exports = dbconnect;