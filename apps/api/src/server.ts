import { app } from './app'

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Better Auth app listening on port ${port}`);
});