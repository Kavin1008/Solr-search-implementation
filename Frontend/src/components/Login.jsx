import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Avatar, Container } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom'; 
import { login } from '../utils/api'; 
import Cookies from 'js-cookie';

const Login = ({ setMessage, setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();  

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const data = await login(email, password); 
            
            if (data.token) {  
            Cookies.set('jwt_token', data.token, { expires: 1, path: '' });
                navigate(`/ctable?token=${data.token}`);
            } else {
                alert(data.message); 
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('An error occurred while logging in. Please try again.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                Sign in
            </Typography>
            <Box component="form" onSubmit={handleLogin} noValidate sx={{ width: '100%' }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Sign In
                </Button>
            </Box>
        </Container>
    );
};

export default Login;
