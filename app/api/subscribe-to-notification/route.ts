import connectDB from "@/lib/mongodb";
import usermodel from "@/lib/usermodel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const connected = await connectDB();
        if (!connected) {
            return NextResponse.json({ success: false, message: "MongoDB is not configured. Subscription service is unavailable." }, { status: 503 });
        }

        const {name,email,age,token} = await req.json();
    
        // console.log("/////",name);
        // console.log("/////",email);
        // console.log("/////",age);
        
        if (!name || !email || !age ||!token) {
            // console.log(token,name,email,age);
            return NextResponse.json({ success: false, message: "Name, email, and password are required." }, { status: 400 });
          }
          const existingUser = await usermodel.findOne({ email });
          if (existingUser) {
            // console.log("existingUser",existingUser);
            
            return NextResponse.json({ success: false, message: "User already exists." }, { status: 400 });
          }
          const newUser = await usermodel.create({ name, email, age, token });
        //   console.log("newuser",newUser);
          
          return NextResponse.json({ success: true, message: "User registered successfully", user: newUser }, { status: 201 });
    } catch (error) {
        console.log(error);
        // return error
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
    }


// Replace with your actual model
