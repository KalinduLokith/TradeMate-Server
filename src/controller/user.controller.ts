import { Request, Response } from "express";
import User from "../models/User";
import { getClaimsFromToken } from "../utils/Jwt.utils";

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1] || "";
    const claims = getClaimsFromToken(token);
    if (!claims) {
      return res.status(401).json({
        data: null,
        message: "Invalid token.",
        status: 401,
      });
    }

    const email = claims.email;

    const user = await User.findOne({
      where: { email },
      attributes: [
        "id",
        "email",
        "fullName",
        "firstName",
        "lastName",
        "dateOfBirth",
        "mobile",
        "addressLine1",
        "addressLine2",
        "city",
        "postalCode",
        "country",
        "gender",
        "initial_capital",
      ],
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        message: "User not found.",
        status: 404,
      });
    }

    res.status(200).json({
      data: user,
      message: "User details retrieved successfully.",
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);

    res.status(500).json({
      data: null,
      message: "An unexpected error occurred.",
      status: 500,
    });
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1] || "";

    const claims = getClaimsFromToken(token);
    if (!claims) {
      return res.status(401).json({
        data: null,
        message: "Invalid token.",
        status: 401,
      });
    }

    const email = claims.email;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        message: "User not found.",
        status: 404,
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      mobile,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      gender,
      initial_capital,
    } = req.body;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.mobile = mobile || user.mobile;
    user.addressLine1 = addressLine1 || user.addressLine1;
    user.addressLine2 = addressLine2 || user.addressLine2;
    user.city = city || user.city;
    user.postalCode = postalCode || user.postalCode;
    user.country = country || user.country;
    user.gender = gender || user.gender;
    user.initial_capital = initial_capital || user.initial_capital;

    await user.save();

    res.status(200).json({
      data: user,
      message: "User details updated successfully.",
      status: 200,
    });
  } catch (error) {
    console.error("Error updating user details:", error);

    res.status(500).json({
      data: null,
      message: "An unexpected error occurred.",
      status: 500,
    });
  }
};
