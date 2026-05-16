import { NextResponse } from "next/server";
import UserModel from "@/lib/usermodel";
import connectDB from "@/lib/mongodb";

export async function DELETE(req: Request) {
    try {
        const connected = await connectDB();
        if (!connected) {
            return NextResponse.json({ success: false, message: "MongoDB is not configured. Unsubscribe service is unavailable." }, { status: 503 });
        }

        const { email } = await req.json(); // Get email from request body

        if (!email) {
            return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
        }

        const deletedUser = await UserModel.findOneAndDelete({ email });

        if (!deletedUser) {
            return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "User deleted successfully." }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
    }
}
