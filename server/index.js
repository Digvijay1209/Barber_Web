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

const verifyUser = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json("Token is missing");
    }

    try {
        const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        if (decoded.role === "admin" || decoded.role === "visitor") {
            next();
        } else {
            return res.json("not allowed");
        }
    } catch (err) {
        return res.json('Err with token');
    }
};

app.get('/Dashboard', verifyUser, async (req, res) => {
    res.json("Success");
});

app.get("/", async (req, res) => {
    res.json("hello");
});

app.get('/Dashboard_1', async (req, res) => {
    try {
        const times = await TimeModel.find();
        return res.json(times);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.get('/Dashboard_auth', verifyUser, async (req, res) => {
    res.json("Success");
});


app.post('/dashboard', async (req, res) => {
    const { timing, status } = req.body;
    const token = req.cookies.token;

    try {
        const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
        const name = decoded.name;
        console.log(name);
        const time = await TimeModel.create({ timing, name, status });
        return res.json(time);
    } catch (err) {
        return res.json('Error with token');
    }
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
           console.log('done');
            res.status(200).json({ message: 'Updated', data: updated });
        } else {
           
            res.status(404).json({ message: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

app.post('/rejected', async (req, res) => {
    const { name, time } = req.body; 

    try {
      
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


        
   
 app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        const employees = await EmployeeModel.create({ name, email, password: hash });
        return res.json(employees);
    } catch (err) {
        return res.json(err);
    }
});




app.post('/Login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await EmployeeModel.findOne({ email: email });

        if (user) {
            const response = await bcrypt.compare(password, user.password);

            if (response) {
                const token = jwt.sign(
                    { name: user.name, email: user.email, role: user.role },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: '1h' }
                );

                res.cookie('token', token);
                return res.json(user);
            } else {
                return res.json("The password is incorrect");
            }
        } else {
            return res.json("No record existed");
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json("Internal Server Error");
    }
});


app.listen(3001,()=>{
    console.log("server ")
})
