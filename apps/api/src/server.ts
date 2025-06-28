import { app } from './app'
import { config } from './config';


app.listen(config.env.port, () => {
    console.log(`Better Auth app listening on port ${config.env.port}`);
});