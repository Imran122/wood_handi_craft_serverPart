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



async function run() {
    try {
        await client.connect();
        const database = client.db('IHandiCraftDB');
        const productsCollection = database.collection('ProductsList');

        //colection for insert place order data
        const orderCollection = database.collection('OrderList');



        //GET APi to get data
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products)
        });

        //API for single data load
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) };

            const product = await productsCollection.findOne(query);
            res.json(product);
        });

        //API for submit place order
        app.post('/orderlist', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order)
            console.log('hiot', order)
            res.json(result)
        });

        console.log('db connected');
    } finally {

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
