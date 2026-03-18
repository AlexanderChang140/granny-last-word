import cookieParser from 'cookie-parser';
import express from 'express';

import { postSignup, postLogin, postLogout, getValidate } from './controller.js';

const router = express.Router();

router.use(express.json());
router.use(cookieParser());

router.post('/signup', (req, res) => {
    postSignup(req, res);
});

router.post('/login', (req, res) => {
    postLogin(req, res);
});

router.post('/logout', (req, res) => {
    postLogout(req, res);
});

router.get('/validate', (req, res) => {
    getValidate(req, res);
});

export default router;
