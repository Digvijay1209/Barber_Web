const express = require("express")
const mongoose = require('mongoose')
const cors=require("cors")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

 const EmployeeModel =require('./models/Employee')
 const TimeModel=require('./models/Time')
const app = express()
app.use(express.json())


app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true
}))
app.use(cookieParser())

require('dotenv').config(); 
//mongoose.connect("mongodb://127.0.0.1:27017/employee");
mongoose.connect("mongodb+srv://dig:ab@barber.it6z4k9.mongodb.net/?retryWrites=true&w=majority&appName=barber");

const verifyUser=(req,res,next)=>{
    const token=req.cookies.token;
    
    if(!token){
        return res.json("Token is missing")

    }

    else
    {
        jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
               if(err)
               {
                return res.json('Err wiht token')
               }

               else
               {
                if(decoded.role==="admin" || decoded.role==="visitor")
                { 
                    next()
                }

                else
                return res.json("not allowed")
               }
        })
    }
}

app.get('/Dashboard',verifyUser ,(req, res) => {
    res.json("Success")
    

})

app.get("/",(req,res)=>{
    res.json("hello");
})
app.get('/Dashboard_1',(req, res) => {
    TimeModel.find()
    .then(times => res.json(times))
    .catch(err => res.status(500).json({ error: err.message }));
    

})


app.get('/Dashboard_auth',verifyUser ,(req, res) => {
    res.json("Success")
 
})

app.post('/dashboard',(req,res)=>{
    const {timing, status} = req.body;
    const token=req.cookies.token;
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
        if(err)
        {
            return res.json('Error with token');
        }
        else
        {
            const name=decoded.name;
            console.log(name)
            TimeModel.create({timing, name, status})
            .then(time => res.json(time))
            .catch(err => res.json(err))
        }
    });

   
 
});

app.post('/updated', async (req, res) => {
    const { name, time, status } = req.body; 
    console.log(req.body);
    console.log("yo");
    console.log( name, time, status ); 
    try {
        const updated = await TimeModel.findOneAndUpdate(
            { name:name, timing:time,status:status },
            { status: 'Accepted' },
            {new:true}
           
        );

        if (updated) {
          //  console.log('done');
            res.status(200).json({ message: 'Updated', data: updated });
        } else {
           //w console.log('done');
            res.status(404).json({ message: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

app.post('/rejected', async (req, res) => {
    const { name, time } = req.body; 

    try {
        // Find and delete the document based on name and timing
        const deleted = await TimeModel.findOneAndDelete({ name: name, timing: time });

        if (deleted) {
            console.log('Deleted:', deleted);
            res.status(200).json({ message: 'Deleted', data: deleted });
        } else {
            res.status(404).json({ message: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});


        
   
 



app.post('/register',(req,res)=>{
  const {name, email, password} = req.body;
  bcrypt.hash(password,10)
  .then(hash=>{
  EmployeeModel.create({name, email, password:hash})
    .then(employees => res.json(employees))
    .catch(err => res.json(err))
  }).catch(err=> res.json(err))
})

app.post('/Login', (req, res) => {
  const { email, password } = req.body;
  const user = EmployeeModel.findOne({ email: email })
      .then(user => {
          if (user) {
            bcrypt.compare(password, user.password, (err, response) => {
                if(response) {
                  const token = jwt.sign({name: user.name, email: user.email, role: user.role },
                      process.env.JWT_SECRET_KEY,{ expiresIn: '1h'});
                    res.cookie('token', token)
                    
                    
                    return res.json(user)
                }else {
                    return res.json("The password is incorrect")
                }
            })
        } else {
            return res.json("No record existed")
        }
    })
})


app.listen(3001,()=>{
    console.log("server ")
})
