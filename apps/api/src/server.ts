import { app } from './app'
import { config } from './config';


app.listen(config.api.port, () => {
    console.log(`Better Auth app listening on port ${config.api.port}`);
});