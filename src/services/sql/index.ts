import { Pool } from 'pg';
import { sqlUrl } from '../../config/config';

const pool = new Pool({ connectionString: sqlUrl });

export default pool;
