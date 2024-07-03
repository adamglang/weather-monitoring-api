import express, {Request, Response, Router} from 'express';
import jwt from 'jsonwebtoken';
import {validateLoginRequest} from "./validators/auth.validator";

const router: Router = express.Router();

router.post('/login', validateLoginRequest, async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // In a real application, we would fetch the user from the database
  // and compare the hashed password. We would preferably also have a second factor of authentication.
  // Since a user table was not required for this project, we will use a hardcoded username and password as a simple example.
  if (username === 'admin' && password === 'password') {
    const token: string = jwt.sign({ username }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;