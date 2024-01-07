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

    app.post('/api/v1/user/login/google-facebook/new',async(req,res)=>{
      const user = req.body;
      const email = user.email;
      const find = await allUsers.findOne({email});
     if(find){
      res.send({status:true})
      return
     }
     else{
      const result = await allUsers.insertOne(user);
      res.send({status:true});
     }
    })

   // Homepage
 
   app.get('/api/v1/find-house/homepage',async(req,res)=>{
    // const filterByCity = {
    //        "location.city":{
    //         $in:["Los Angeles","Chicago","San Francisco","Miami","Houseton"]
    //        }
    // }
    // const cityDocumentCount = await propertiesCollection.find(filterByCity).toArray();
    // console.log(cityDocumentCount)
    const projection = {
      _id:1,
      title: 1,
      details:1,
      photos:1,
      location:1,
      
      
    }
    const popularProperties = (await propertiesCollection.find().project(projection).toArray()).reverse();
    res.send({
      popularProperties:popularProperties.slice(0,6)

    })
  
   })  
   
    // check  user role
    app.get('/api/v1/user/check-role',async(req,res)=>{
      const email = req.query.email;
      const result = await allUsers.findOne({email:email});
     res.send(result.role)
    })
     
   app.get('/api/v1/user/profile',async(req,res)=>{
    const email = req.query.email;
    const result = await allUsers.findOne({email});
    res.send(result)
   })
 
    app.get('/api/v1/users',async(req,res)=>{
    const project = {
      email:1,
      firstName:1,
      lastName:1,
      role:1,
    }
  const result = await allUsers.find().project(project).toArray();
   res.send(result); 
  })
   app.put('/api/v1/user/profile/update',async(req,res)=>{
    const user = req.body;

    const filter = {
      email: user.email
    }
  
    const updatedDoc = {
      $set: user.contactInformation
    }
    const query = {
      $upsert:true
    }
    
    const result = await allUsers.updateOne(filter,updatedDoc,query)
    res.send(result)
   
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
      const query = req.query;
    const sort = {
     'details.price': parseInt(query.sort) || 1
    }
      const filter = {
       $and:[

       ]
      };
      filter.$and.push({'approved':true})
      if(query.location != 'null'){
     filter.$and.push({"location.city":query.location})
      }
      if(query.status != 'null'){
      
       filter.$and.push({'details.status':query.status})
      }
      if(query.bedrooms != 'null' && !query.bedrooms){
     filter.$and.push({'details.extraInformation.rooms':parseInt(query.bedrooms)})
      }
      if(query.bathrooms != 'null'){
        filter.$and.push({'details.extraInformation.bathRooms':parseInt(query.bathrooms)})
         }
       
        // if(parseInt(query.sort)){
        //   sort.["details.price"]: parseInt()
        // }
         if(filter.$and.length === 0){
          const result = await propertiesCollection.find().toArray();
          res.send(result)
          
          return;
         }
        
        const result = await propertiesCollection.find(filter).sort(sort).toArray();
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
        const result = await propertiesCollection.find({approved:false,request_status:'Pending'}).toArray();
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
       $set:{
        approved: true,
        agentInformation:   req.body.doc
       }

      }
      const upsert = {
        $upsert:true
      }
      const result = await propertiesCollection.updateOne(filter,update,upsert);
      res.send(result)
   console.log(result)
   
    })
     //   delete property by admin 
    app.put('api/v1/property-request/delete',async(req,res)=>{
        const id = req.body.id;
        const filter = {
            _id: new ObjectId(id)
        }
        const update = {
          $set:{
            request_status:'not approved'
          }
        }
        const result = await propertiesCollection.updateOne(filter,update,{$upsert:true});
        res.send(result)
    })
  
  //  users
  app.patch('/api/v1/user/update/role',async(req,res)=>{
  const body = req.body;
  const email = body.email;
  const role = body.role;
  const updatedDoc = {
    $set:{
      role
    }
  }
  const result = await allUsers.updateOne({email},updatedDoc)
  res.send(result)
  })
  // Client properties
  app.get('/api/v1/client/properties',(req,res)=>{
    const email = req.query.agent;
    console.log(email)
  })
  } finally {
   
  }
}
run().catch(console.dir);



app.listen(port)