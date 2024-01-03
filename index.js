const express = require('express');
const cors = require('cors');
const port = 5000 || process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());
require('dotenv').config()

app.get('/',(req,res)=>{
    res.send('Find Hotel server is running')
})

const dbName = process.env.DB_NAME;
const dbPass = process.env.DB_PASS;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${dbName}:${dbPass}@cluster0.katjfem.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db('Find-hotel');
    const allUsers = database.collection('Users');
    const propertiesCollection = database.collection('Properties');
    const favouriteCollection =  database.collection('Favourite');
    // new user sign up 
    app.post('/api/v1/user/new',async(req,res)=>{
        const user = req.body;
        const result = await allUsers.insertOne(user);
        res.send(result)
       
    })
    // check  user role
   app.put('/api/v1/user/new/update',async(req,res)=>{
    const user = req.body;
    console.log(user)
    const filter = {
      email: user.email
    }
    const updatedDoc = {
      $set: user
    }
    const query = {
      $upsert:true
    }
    const result = await allUsers.updateOne(filter,updatedDoc,query)
    res.send(result)
    console.log(result)
   })
    // add property to fav
    app.patch('/api/v1/add-property/fav',async(req,res)=>{
      const fav = req.body.fav;
  
      const result = await favouriteCollection.insertOne(fav);
      res.send(result)
      console.log(result)
      
    })
    app.get('/api/v1/checkFavourite',async(req,res)=>{
      const propertyId = req.query.id;
      const email = req.query.email;
      const query = {
        propertyId,
        email
      }
      console.log(query)
      const result = await favouriteCollection.findOne(query)
      res.send(result)
      
    })
    // properties CRUD operations
    app.get('/api/v1/properties',async(req,res)=>{
        const result = await propertiesCollection.find().toArray();
        res.send(result)
    })
    // get single property by id 
    app.get('/api/v1/property/:id',async(req,res)=>{
        const id = req.params.id;
       
        const query = {
            _id:new ObjectId(id)
        }
        const result = await propertiesCollection.findOne(query);
        res.send(result)
        
     
    })

    app.post('/api/v1/property/post',async(req,res)=>{
        const property = req.body;
        const result = await propertiesCollection.insertOne(property);
        res.send(result);
    })


    //. dashboard 
    // my properties CRUD operations
   app.get('/api/v1/client/properties',async(req,res)=>{
    const email = req.query.email;
    const projection = {
      _id:1,
      title: 1,
      photos:1,
      location:1,
      date:1,
      approve:1
    }
    const result = await propertiesCollection.find({email}).project(projection).toArray();
    res.send(result)
   })


  //  delete client property by id
   app.delete('/api/v1/client/delete/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {
      _id: new ObjectId(id)
    }

    const result = await propertiesCollection.deleteOne(query);
    res.send(result);
   })
   
  //  favourite properties CRUD operations

  app.get('/api/v1/favourite-properties',async(req,res)=>{
    const email = req.query.email;
    const query = {
      email
    }
    const result = await favouriteCollection.find(query).toArray();
    const propertyIds =result.map(item => new ObjectId(item.propertyId))
    const project = {
      _id:1,
      title:1,
      photos:1,
      location:1,
      date:1
    }
    const properties = await propertiesCollection.find({
      _id: { $in:propertyIds}
    }).project(project).toArray();
    res.send(properties)
  })
  app.delete('/api/v1/client/favourite-property/remove',async(req,res)=>{
    const propertyId = req.query.id;
    const email = req.query.email;
    const query = {propertyId,email};
    const result = await favouriteCollection.deleteOne(query);
    res.send(result)
  })

    // property requests 
    app.get('/api/v1/property-requests',async(req,res)=>{
        const result = await propertiesCollection.find({approved:false}).toArray();
        res.send(result)
    })

    // approve property by agent
    app.patch('/api/v1/property-requests/approve',async(req,res)=>{
      const email = req.query.email;
      const {id} = req.body;
      const filter = {
        _id: new ObjectId(id)
      }
      const update = {
        approve: true
      }

    //   delete property by admin 
    app.delete('api/v1/property-request/delete',async(req,res)=>{
        const id = req.body.id;
        const filter = {
            _id: new ObjectId(id)
        }
        const result = await propertiesCollection.deleteOne(filter);
        res.send(result)
    })
    const result = await propertiesCollection.updateOne(filter,update);
    res.send(result)
    })

  
  } finally {
   
  }
}
run().catch(console.dir);



app.listen(port)