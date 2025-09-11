import { app } from './app'
import { config } from './config';


app.listen(config.env.port, () => {
    console.log(`API server listening on port ${config.env.port}`);
});