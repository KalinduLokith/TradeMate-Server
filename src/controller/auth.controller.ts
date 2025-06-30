import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // console.log("Auth Controller: Login", req.body);

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: "Email and password are required.",
      status: 400,
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    // Authentication validation with generic message
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        data: null,
        message: "Invalid email or password.",
        status: 401,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
    );

    // Success response
    res.status(200).json({
      data: {
        id: user.id,
        email: user.email,
        token,
      },
      message: "User logged in successfully.",
      status: 200,
    });
  } catch (error) {
    console.error("Login Error:", error);

    // Internal server error
    res.status(500).json({
      data: null,
      message: "An unexpected error occurred during login.",
      status: 500,
    });
  }
};

export const register = async (req: Request, res: Response) => {
  // console.log("Auth Controller: Register");
  const { email: email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      data: null,
      message: "Email and password are required",
      status: 400,
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).json({
        data: null,
        message: "Email already taken",
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ email: email, password: hashedPassword });

    res.status(201).json({
      data: {
        id: user.id,
        email: user.email,
      },
      message: "User created successfully",
      status: 201,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      data: null,
      message: "User creation failed due to an internal error.",
      status: 500,
    });
  }
};
