const express = require('express')
const { MongoClient } = require('mongodb');
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000

//configure midleware cors
app.use(cors());
app.use(express.json());
//single data loading by objectId
const ObjectId = require('mongodb').ObjectId;
//connect to db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvy8c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//stripe related stuff
const stripe = require("stripe")(process.env.STRIPE_SECRET);

async function run() {
    try {
        await client.connect();
        const database = client.db('IHandiCraftDB');
        const productsCollection = database.collection('ProductsList');

        //colection for insert place order data
        const orderCollection = database.collection('OrderList');

        const reviewCollection = database.collection('ReviewData')
        //user collection db
        const usersCollection = database.collection('users')


        //checking user is admin or not from user db
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        //api for save product from admin dashboard
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.json(result)
        });

        //GET APi to get data
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            const count = await cursor.count();
            res.send({

                count,
                products
            })
        });

        //API for single data load
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };

            const product = await productsCollection.findOne(query);
            res.json(product);
        });
        //api for delete products from list and db
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result)
        });





        //API for submit place order
        app.post('/orderlist', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order)
            console.log('hiot', order)
            res.json(result)
        });
        //api for manage order to get all order list in admin dashboard

        app.get('/adminAllOrder', async (req, res) => {
            const cursor = orderCollection.find({});
            const allOrder = await cursor.toArray();
            res.send(allOrder)
        });
        //api for update status for a order pending to shiped
        app.put('/orderlist/:id', async (req, res) => {
            const id = req.params.id;
            const updateOrder = req.body;
            const filter = { _id: ObjectId(id) };
            console.log(id);
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updateOrder.status,
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        });

        //API for getting a users order list data
        app.get('/orderlist', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = orderCollection.find(query);
            const allOrder = await cursor.toArray();
            res.send(allOrder)
        });


        //API for load a single order data to make payment
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query);
            res.json(result)
        })


        //API for delete a order
        app.delete('/orderlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result)
        });

        //API for send review data
        app.post('/reviews', async (req, res) => {
            const review = req.body;

            const result = await reviewCollection.insertOne(review)

            res.json(result)
        });

        //GET APi to get data of all reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews)
        });

        //save email pass auth data to mongodb
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.json(result);
        })
        //save google data to mongodb
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        //api for make admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email }
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc)
            res.json(result);
        })
        //payment related work api
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })


        console.log('db connected');
    }
    finally {

        //await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
