
import User from "../models/userModel.js";

// Controller: Handle user registration.
// This creates a new user account if the email isn't already taken.
export const signupController = async (req, reply) => {
  try {
    const { name, email, password } = req.body;

    // First, check if a user with this email already exists.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        message: "User already exists"
      });
    }

    // If not, create a new user with the provided details.
    const user = await User.create({ name, email, password });

    // Return success with the new user's basic info (no password).
    return reply.code(201).send({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Controller: Handle user login.
// This verifies the user's credentials and returns a JWT token for authenticated requests.
export const loginController = async (req, reply) => {
  try {
    const { email, password } = req.body;

    // Look up the user by email.
    const user = await User.findOne({ email });
    if (!user) {
      return reply.code(400).send({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if the provided password matches the stored hash.
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return reply.code(400).send({
        success: false,
        message: "Invalid email or password"
      });
    }

    // If credentials are valid, generate a JWT token containing the user ID.
    const jwtToken = req.server.jwt.sign(
      { id: user._id.toString() }
    );

    // Return the token and user details for the frontend to store.
    return reply.send({
      success: true,
      message: "Login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// Controller: Get the current user's details.
// This is a protected route that uses the JWT to identify and return the authenticated user's info.
export const getMeController = async (req, reply) => {
  try {
    const userId = req.user.id;

    // Fetch the user from the database, excluding the password field.
    const user = await User.findById(userId).select("-password");

    // Return the user's details.
    return reply.send({
      success: true,
      user
    });

  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error"
    });
  }
};
