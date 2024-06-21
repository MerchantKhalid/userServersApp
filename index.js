const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authenticateToken = require('../UserManagementServer/middleware/auth');

const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1yjvy4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log('uri', uri);

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const usersCollection = client.db('UserManagement').collection('allusers');
    const itemsCollection = client.db('UserManagement').collection('items');
    const insertedUserCollection = client
      .db('UserManagement')
      .collection('insertedUser');
    const taskCollection = client.db('UserManagement').collection('tasks');

    // demo update profile
    // Update profile endpoint
    // app.put('/profile', async (req, res) => {
    //   const { name, email, password } = req.body;

    //   try {
    //     const user = await usersCollection.findOne({ email: req.user.email });
    //     if (name) user.name = name;
    //     if (email) user.email = email;

    //     await user.save();
    //     res.json(user);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // });

    //Starts ---------------------------------------
    // Get all tasks
    // app.get('/api/tasks', (req, res) => {
    //   client
    //     .db('UserManagement')
    //     .collection('items')
    //     .find()
    //     .toArray((err, tasks) => {
    //       if (err)
    //         return res.status(500).send({ error: 'Failed to fetch tasks' });
    //       res.status(200).send(tasks);
    //     });
    // });
    // app.get('/api/tasks', async (req, res) => {
    //   const cursor = taskCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // // Add a new task
    // app.post('/api/tasks', (req, res) => {
    //   const newTask = req.body;
    //   if (!newTask.title || newTask.title.trim() === '') {
    //     return res.status(400).send({ error: 'Task title is required' });
    //   }
    //   client
    //     .db('UserManagement')
    //     .collection('items')
    //     .insertOne(newTask, (err, result) => {
    //       if (err) return res.status(500).send({ error: 'Failed to add task' });
    //       res.status(201).send(result.ops[0]);
    //     });
    // });

    // // Update a task
    // app.put('/api/tasks/:id', (req, res) => {
    //   const id = req.params.id;
    //   const updatedTask = req.body;
    //   client
    //     .db('UserManagement')
    //     .collection('items')
    //     .findOneAndUpdate(
    //       { _id: ObjectId(id) },
    //       { $set: updatedTask },
    //       { returnOriginal: false },
    //       (err, result) => {
    //         if (err)
    //           return res.status(500).send({ error: 'Failed to update task' });
    //         res.status(200).send(result.value);
    //       }
    //     );
    // });

    // // Delete a task
    // app.delete('/api/tasks/:id', (req, res) => {
    //   const id = req.params.id;
    //   client
    //     .db('UserManagement')
    //     .collection('items')
    //     .deleteOne({ _id: ObjectId(id) }, (err, result) => {
    //       if (err)
    //         return res.status(500).send({ error: 'Failed to delete task' });
    //       res.status(200).send({ message: 'Task deleted' });
    //     });
    // });

    //End---------------------------------

    // Update profile endpoint
    app.put('/profile', async (req, res) => {
      const { name, email } = req.body;

      console.log(name, email);
      const userEmail = email;
      console.log(userEmail);

      try {
        const userCollection = client
          .db('UserManagement')
          .collection('allusers');

        // Find the user by email and update fields if provided
        const filter = { email: userEmail };
        const updateDoc = {
          $set: {
            name: name || undefined, // Only update if `name` is provided
            email: email || undefined, // Only update if `email` is provided
          },
        };

        const result = await userCollection.updateOne(filter, updateDoc, {
          returnOriginal: false, // Return the updated document
        });
        console.log(result);

        if (!result) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json(result);
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: error.message });
      }
    });

    // server.js (Express setup)

    // app.put('/api/task/:id', async (req, res) => {
    //   const { id } = req.params;
    //   const updatedTask = req.body;

    //   try {
    //     const database = client.db('UserManagement');
    //     const collection = database.collection('tasks');

    //     const result = await collection.findOneAndUpdate(
    //       { _id: new ObjectId(id) },
    //       { $set: updatedTask },
    //       { returnDocument: 'after' }
    //     );

    //     res.json(result.value);
    //   } catch (err) {
    //     console.error('Error updating task:', err);
    //     res.status(500).json({ error: 'Internal server error' });
    //   }
    // });

    // Define routes
    app.get('/task', async (req, res) => {
      try {
        const searchQuery = req.query.search; // Get search query parameter from URL

        // Query MongoDB based on search query
        let tasks;
        if (searchQuery) {
          // Perform case-insensitive search for tasks containing searchQuery
          tasks = await taskCollection
            .find({ $text: { $search: searchQuery, $caseSensitive: false } })
            .toArray();
        } else {
          // Retrieve all tasks if no search query provided
          tasks = await taskCollection.find({}).toArray();
        }

        // Render tasks as cards or send as JSON response
        res.json(tasks);
      } catch (err) {
        console.error('Error fetching tasks', err);
        res.status(500).json({ error: 'Error fetching tasks' });
      }
    });

    // jwt
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: '' });
    });

    // Your registration route
    // app.post('/users', async (req, res) => {
    //   const user = req.body;
    //   try {
    //     const result = await usersCollection.insertOne(user);
    //     const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN);
    //     res.send({ user: result, token });
    //   } catch (error) {
    //     res.status(500).send(error);
    //   }
    // });

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const result = await insertedUserCollection.insertOne(user);
        res.status(201).send(result);
      } catch (error) {
        console.error('Error inserting user:', error);
        res
          .status(500)
          .send({ error: 'An error occurred while inserting the user' });
      }
    });

    // Search route
    app.get('/api/tasks/search', async (req, res) => {
      const searchTerm = req.query.q;

      try {
        const database = client.db('UserManagement');
        const collection = database.collection('tasks');

        // Perform $text search
        const result = await collection
          .find({ $text: { $search: searchTerm } })
          .toArray();
        res.json(result);
      } catch (err) {
        console.error('Error searching tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // update profile
    // app.put('/profile', async (req, res) => {
    //   const { name, email, password } = req.body;
    //   try {
    //     const user = await usersCollection.findOne({ email: req.user.email });
    //     if (name) user.name = name;
    //     if (email) user.email = email;
    //     if (password) user.password = await bcrypt.hash(password, 10);

    //     await user.save();
    //     res.json(user);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // });

    // View Profile
    // app.get('/', authenticateToken, async (req, res) => {
    //   try {
    //     const user = await usersCollection.findOne({ email: req.user.email });
    //     res.json(user);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // });

    // Edit Profile
    app.put('/', authenticateToken, async (req, res) => {
      const { name, email, password } = req.body;
      try {
        const user = await usersCollection.findOne({ email: email });
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10);

        await user.save();
        res.json(user);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    //create task
    app.post('/task', async (req, res) => {
      try {
        const task = req.body;
        const result = await taskCollection.insertOne(task);
        res.status(201).send(result);
      } catch (error) {
        console.error('Error inserting user:', error);
        res
          .status(500)
          .send({ error: 'An error occurred while inserting the user' });
      }
    });

    // Read all tasks

    app.get('/task', async (req, res) => {
      const cursor = taskCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Update a task by ID
    app.put('/task/:id', async (req, res) => {
      const taskId = req.params.id;
      const updatedTask = req.body;

      const result = await taskCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: updatedTask },
        (err, result) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          res.send(result);
        }
      );
    });

    // Delete a task by ID
    app.delete('/task/:id', (req, res) => {
      const taskId = req.params.id;

      const result = taskCollection.deleteOne(
        { _id: new ObjectId(taskId) },
        (err, result) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          res.send(result);
        }
      );
    });

    // Upload Profile Picture
    // app.post(
    //   '/profile-picture',
    //   authenticateToken,
    //   upload.single('profilePicture'),
    //   async (req, res) => {
    //     try {
    //       const user = await usersCollection.findOne({ email: req.user.email });
    //       user.profilePicture = req.file.path;
    //       await user.save();
    //       res.json(user);
    //     } catch (error) {
    //       res.status(500).json({ message: error.message });
    //     }
    //   }
    // );

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send('User Server is running');
});
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
